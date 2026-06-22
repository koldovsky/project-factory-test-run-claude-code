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
const recDir = join(root, "docs", "qa", "demo-recordings");
const clipsDir = join(recDir, "clips");
const framesDir = join(recDir, "frames");
const manifestPath = join(recDir, "manifest.json");
const readmePath = join(recDir, "README.md");
const verdictsPath = join(root, "evals", "results", "vision-verdicts.json");

// Human description per clip: what the viewer sees happen, tying the flow to its
// requirements. Used in the README and given to the vision verifier as the rubric.
const CLIP_DESCRIPTIONS = {
  "clip-empty-state": "First load: top bar (logo home-link, live clock, theme toggle), the Ukrainian hero, the centered city search, and the footer credits + daily joke.",
  "clip-city-search": "Typing a city shows debounced suggestions with name/region/country/flag; a nonsense query shows a calm inline ‘nothing found’; the ‘use my location’ button is present.",
  "clip-forecast": "A city's 7 day cards (weekday, hi/lo, icon, precip, wind) each with a colored comfort badge, the weekend-comfort highlight, the 48h hourly chart, and today's sunrise/sunset.",
  "clip-map": "The OpenStreetMap Leaflet map renders at city zoom with the location marker and the ‘© OpenStreetMap contributors’ attribution.",
  "clip-weekend-compare": "Pinning the active city adds a chip; toggling compare shows the weekend table with Saturday/Sunday hi/lo, precip and comfort, plus a comfortable unpin target and make-active control.",
  "clip-navigation-reachability": "From a forecast the user opens the in-view search, looks up a different city, and lands on it with focus on the new heading; the logo is a working home link.",
  "clip-compare-multi-mobile": "On a phone viewport, two cities are pinned (search reachable from the forecast) and compared in a table that stacks vertically with no horizontal scrolling.",
  "clip-theme-toggle": "Clicking the theme control switches the theme (light↔dark) and the page restyles accordingly.",
  "clip-animated-bg-reduced-motion": "With prefers-reduced-motion the animated particle layer is hidden — only the static gradient remains.",
};

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

// Vision verdicts (from the recording-vision-verify workflow), if present.
const verdicts = existsSync(verdictsPath)
  ? JSON.parse(readFileSync(verdictsPath, "utf8"))
  : {};

const clips = [];
for (const sp of specs) {
  const title = sp.title ?? "";
  const id = title.split(/\s+@/)[0].trim();
  if (!id.startsWith("clip-")) continue; // recordings only (skip a11y specs)
  const proves = (title.match(/@((?:FR|NFR)-[A-Z]+-\d+)/g) ?? []).map((m) => m.slice(1));
  const result = sp.tests?.[0]?.results?.[0];
  const status = result?.status ?? "unknown";
  const video = (result?.attachments ?? []).find((a) => a.name === "video");
  let videoRel = null;
  if (video?.path && existsSync(video.path)) {
    videoRel = `clips/${id}.webm`;
    copyFileSync(video.path, join(clipsDir, `${id}.webm`));
  }
  const frameRel = existsSync(join(framesDir, `${id}.png`)) ? `frames/${id}.png` : null;
  clips.push({
    id,
    proves,
    description: CLIP_DESCRIPTIONS[id] ?? "",
    validated: status === "passed" && Boolean(videoRel),
    status,
    durationMs: result?.duration ?? null,
    video: videoRel,
    frame: frameRel,
    vision: verdicts[id] ?? null,
  });
}

clips.sort((a, b) => a.id.localeCompare(b.id));

const manifest = {
  kind: "demo-recordings",
  generatedAt: new Date().toISOString().slice(0, 10),
  captureMethod:
    "Automated headless Chromium via Playwright (e2e/recordings.spec.ts). Each clip drives a real user flow, asserts the FRs it proves, records video + a settled proof still, and is vision-verified (a fresh agent confirms the requirement is visibly met and readable). Generated by `npm run qa:record-demos` (+ the recording-vision-verify workflow); guarded by `npm run check:recordings` (ADR-0006). Supersedes the manual browser-MCP approach (TC-STACK-05, amended).",
  framework: "@playwright/test",
  clips,
  additionalCoverage,
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

// Human-readable proof README — per clip: what happens, the FRs it proves, the
// video + proof still, and the vision verdict.
const lines = [
  "# Demo recordings — validated proof",
  "",
  manifest.captureMethod,
  "",
  `Generated ${manifest.generatedAt}. ${clips.filter((c) => c.validated).length}/${clips.length} clips validated.`,
  "",
];
for (const c of clips) {
  const v = c.vision;
  const verdict = v ? (v.met ? `✅ vision-verified${v.readable === false ? " (readability concern)" : ""}` : `❌ vision: NOT met`) : "⏳ vision pending";
  lines.push(`## ${c.id}`);
  lines.push("");
  lines.push(`- **Proves:** ${c.proves.join(", ") || "—"}`);
  lines.push(`- **What happens:** ${c.description}`);
  lines.push(`- **Assertion status:** ${c.status}`);
  lines.push(`- **Vision verdict:** ${verdict}${v?.notes ? ` — ${v.notes}` : ""}`);
  if (c.video) lines.push(`- **Video:** [${c.video}](${c.video})`);
  if (c.frame) lines.push(`- **Proof still:** ![${c.id}](${c.frame})`);
  lines.push("");
}
lines.push("## Requirements covered outside a browser-flow clip");
lines.push("");
for (const a of additionalCoverage) lines.push(`- **${a.ids.join(", ")}** — ${a.method}`);
lines.push("");
writeFileSync(readmePath, lines.join("\n"), "utf8");

const validated = clips.filter((c) => c.validated).length;
const frCount = new Set([
  ...clips.flatMap((c) => c.proves),
  ...additionalCoverage.flatMap((a) => a.ids),
]).size;
console.log(`\nrecord-demos: ${validated}/${clips.length} clips validated, ${frCount} requirement ids covered`);
console.log(`record-demos: wrote ${manifestPath} and ${readmePath}`);
if (validated !== clips.length) {
  console.error("record-demos: some clips did not validate — see the report above.");
  process.exit(1);
}
