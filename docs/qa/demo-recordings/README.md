# Demo recordings — index

This MVP's E2E proof is captured via **browser MCP** against the live app, not
Playwright (ADR-0001, TC-STACK-05). Each capability has a clip defined in
[manifest.json](manifest.json), narrated step-by-step in
[../demo-script.md](../demo-script.md), and the underlying states were run and
**visually reviewed** against the live app (Next dev + live Open-Meteo) — recorded
in [../g5-browser-smoke.md](../g5-browser-smoke.md).

## How to (re)capture

1. `npm run dev`, or start the preview server (`.claude/launch.json`).
2. Follow [../demo-script.md](../demo-script.md) clip by clip; one clip per viewport
   (desktop + 360–375px), never resizing mid-clip.
3. For each clip, confirm the FR ids in `manifest.json` are demonstrated and the
   console is silent (NFR-OBS-01).

## Coverage

The 10 clips (9 capabilities + 1 negative/error) collectively prove all 33 MVP
FRs plus the silent-console NFR. The eval suite ([../eval-report.md](../eval-report.md))
is the graded **quality bar**; these recordings *illustrate* the behavior for
humans. The requirements traceability matrix
([../requirements-traceability-matrix.md](../requirements-traceability-matrix.md))
links every FR to its code, test, and this evidence.

> Note: full video files are not committed — the preview MCP captures
> screenshots/state for review rather than savable video, and binary clips would
> bloat the repo. The executable demo-script + the visually-reviewed smoke states
> + the per-capability eval cases are the durable, reviewable artifacts.
