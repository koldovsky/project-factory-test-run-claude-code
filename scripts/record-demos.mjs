// Automated demo recording + requirement validation (ADR-0006).
//
// Runs the Playwright harness (e2e/recordings.spec.ts) in a headless background
// Chromium — its own browser, never the user's, no manual save dialog. Each test
// drives a real user flow, ASSERTS the FRs named in its title (@FR-...), and
// records a video. This script then turns the Playwright JSON report into:
//   - docs/qa/demo-recordings/clips/<clip>.webm  (the validated videos)
//   - docs/qa/demo-recordings/manifest.json      (clips + FR coverage)
// A clip is only "validated" if its requirement assertions passed.
//
// The remaining MVP FRs that are not browser-flow clips (pure logic, URL/Enter,
// map-click coordinate label, jokes) are listed under `additionalCoverage` with
// their honest verification method, so the manifest documents every MVP FR and
// the traceability gate (`--strict-recordings`) stays satisfied.
//
// Run: npm run qa:record-demos   (requires a prod build + the harness server).
// Guarded by: npm run check:recordings (pure Node, CI-safe).

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = join(root, "evals", "results", "e2e-report.json");
const clipsDir = join(root, "docs", "qa", "demo-recordings", "clips");
const manifestPath = join(root, "docs", "qa", "demo-recordings", "manifest.json");

// MVP FRs proven outside a browser-flow clip — documented honestly so the
// manifest covers every FR. (Pure logic has @trace unit/integration tests;
// browser-only minutiae have manual test-plan steps.)
const additionalCoverage = [
  { ids: ["FR-SEARCH-03"], method: "Selecting a suggestion sets ?lat&lon&name — exercised in clip-navigation-reachability and pinned by lib/location/url + integration @trace tests." },
  { ids: ["FR-SEARCH-04"], method: "Enter auto-selects a lone suggestion — lib/location/url contract + integration @trace tests and manual test plan." },
  { ids: ["FR-FORECAST-05"], method: "Render-what-you-have for partial/empty days — lib/weather/map @trace unit tests." },
  { ids: ["FR-COMFORT-02"], method: "comfortScore is pure, total, clamped 0..100, never throws — lib/scoring/comfort @trace unit tests." },
  { ids: ["FR-COMFORT-03"], method: "Comfort rationale accuracy — lib/scoring @trace unit tests + the eval suite (eval-comfort-rationale)." },
  { ids: ["FR-MAP-03"], method: "Map click sets a rounded coordinate label (ADR-0004) — lib/location/coordinateLabel @trace unit tests + manual test plan." },
  { ids: ["FR-ANIM-02"], method: "Day/night gradient by the location's local sun times — lib/sky @trace unit tests; the daytime scene is visible in clip-forecast/clip-map." },
  { ids: ["FR-ANIM-04"], method: "Particle layer is pointer-events:none (interaction passes through) — globals.css + manual test plan." },
  { ids: ["FR-JOKES-01"], method: "Deterministic Ukrainian footer joke — lib/jokes @trace unit tests; rendered in clip-empty-state." },
];

// 1) Run the harness (records video + writes the JSON report).
console.log("==> running Playwright harness (headless Chromium)");
const pw = spawnSync("npx", ["playwright", "test"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (pw.status !== 0) {
  console.error("record-demos: harness failed — not regenerating the manifest.");
  process.exit(pw.status ?? 1);
}

// 2) Parse the report.
if (!existsSync(reportPath)) {
  console.error(`record-demos: no report at ${reportPath}`);
  process.exit(1);
}
const report = JSON.parse(readFileSync(reportPath, "utf8"));

const specs = [];
function walk(suites) {
  for (const s of suites ?? []) {
    for (const sp of s.specs ?? []) specs.push(sp);
    walk(s.suites);
  }
}
walk(report.suites);

// 3) Build clips from specs: id + FR tags from the title; status + video.
// Start clean so removed tests don't leave orphan videos.
rmSync(clipsDir, { recursive: true, force: true });
mkdirSync(clipsDir, { recursive: true });

const clips = [];
for (const sp of specs) {
  const title = sp.title ?? "";
  const id = title.split(/\s+@/)[0].trim();
  const proves = (title.match(/@((?:FR|NFR)-[A-Z]+-\d+)/g) ?? []).map((m) => m.slice(1));
  const result = sp.tests?.[0]?.results?.[0];
  const status = result?.status ?? "unknown";
  const video = (result?.attachments ?? []).find((a) => a.name === "video");
  let videoRel = null;
  if (video?.path && existsSync(video.path)) {
    videoRel = `clips/${id}.webm`;
    copyFileSync(video.path, join(clipsDir, `${id}.webm`));
  }
  clips.push({
    id,
    proves,
    validated: status === "passed" && Boolean(videoRel),
    status,
    durationMs: result?.duration ?? null,
    video: videoRel,
  });
}

clips.sort((a, b) => a.id.localeCompare(b.id));

const manifest = {
  kind: "demo-recordings",
  generatedAt: new Date().toISOString().slice(0, 10),
  captureMethod:
    "Automated headless Chromium via Playwright (e2e/recordings.spec.ts). Each clip drives a real user flow, asserts the FRs it proves, and records video. Generated by `npm run qa:record-demos`; guarded by `npm run check:recordings` (ADR-0006). Supersedes the manual browser-MCP approach (TC-STACK-05, amended).",
  framework: "@playwright/test",
  clips,
  additionalCoverage,
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

const validated = clips.filter((c) => c.validated).length;
const frCount = new Set([
  ...clips.flatMap((c) => c.proves),
  ...additionalCoverage.flatMap((a) => a.ids),
]).size;
console.log(`\nrecord-demos: ${validated}/${clips.length} clips validated, ${frCount} requirement ids covered`);
console.log(`record-demos: wrote ${manifestPath}`);
if (validated !== clips.length) {
  console.error("record-demos: some clips did not validate — see the report above.");
  process.exit(1);
}
