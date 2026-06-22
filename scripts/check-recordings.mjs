// Recordings gate (pure Node, CI-safe — no browser, no Playwright needed).
//
// Guards the committed automated-recordings evidence produced by
// `npm run qa:record-demos` (ADR-0006): every clip in the manifest must be
// validated (its requirement assertions passed) and have a real video file on
// disk. This is the committed-evidence guard; the live validation happens when
// the harness runs (npm run test:e2e / qa:record-demos).
//
// Run: node scripts/check-recordings.mjs   (wired into qa:verify + CI).

import { existsSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const recDir = join(root, "docs", "qa", "demo-recordings");
const manifestPath = join(recDir, "manifest.json");

const MIN_CLIPS = 6;
const MIN_VIDEO_BYTES = 1024;

const problems = [];

if (!existsSync(manifestPath)) {
  console.error(`recordings: no manifest at ${manifestPath} — run \`npm run qa:record-demos\`.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const clips = Array.isArray(manifest.clips) ? manifest.clips : [];

if (clips.length < MIN_CLIPS) {
  problems.push(`only ${clips.length} clip(s) in the manifest; expected at least ${MIN_CLIPS}`);
}

for (const clip of clips) {
  const where = `clip "${clip.id ?? "?"}"`;
  if (clip.validated !== true) problems.push(`${where}: not validated (status ${clip.status ?? "?"})`);
  if (clip.status && clip.status !== "passed") problems.push(`${where}: status is "${clip.status}", expected "passed"`);
  if (!Array.isArray(clip.proves) || clip.proves.length === 0) problems.push(`${where}: proves no requirement ids`);
  if (!clip.video) {
    problems.push(`${where}: no video path`);
    continue;
  }
  const videoPath = join(recDir, clip.video);
  if (!existsSync(videoPath)) {
    problems.push(`${where}: video file missing (${clip.video})`);
  } else if (statSync(videoPath).size < MIN_VIDEO_BYTES) {
    problems.push(`${where}: video file is suspiciously small (${clip.video})`);
  }
}

const covered = new Set([
  ...clips.flatMap((c) => c.proves ?? []),
  ...(manifest.additionalCoverage ?? []).flatMap((a) => a.ids ?? []),
]);

if (problems.length > 0) {
  console.error("recordings: FAIL");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const validated = clips.filter((c) => c.validated).length;
console.log(
  `recordings: OK — ${validated}/${clips.length} clips validated with video; ${covered.size} requirement ids covered (clips + additionalCoverage).`,
);
