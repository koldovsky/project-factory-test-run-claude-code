# ADR-0006: Automated E2E recording + validation via headless Playwright

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** user + orchestrator
- **Amends:** TC-STACK-05; supersedes the "browser-MCP only / no Playwright"
  recording approach in ADR-0001 and the rationale in ADR-0005.

## Context

The MVP originally specified browser-MCP E2E verification and explicitly
excluded Playwright (TC-STACK-05). In practice that produced recordings that
were **manual** (driven through the user's own browser via the Chrome MCP),
required a **manual save dialog**, and were **not validated against
requirements** — the clips illustrated flows but nothing asserted that a flow
actually met its FR. The user rejected this and asked for recordings that are
"completely automated", run in a "background browser" (not theirs), and that
"validate how they match requirements", built into the process.

The user then relaxed the no-Playwright constraint ("use anything most efficient
for the task"). For record-and-validate, Playwright is the most efficient tool:
built-in video recording, auto-waiting web-first assertions (the requirement
check *is* the test), a JSON reporter the gate can consume, and its own headless
browsers (a background browser, never the user's).

## Decision

Automated E2E recordings + requirement validation use **headless Playwright**
(`@playwright/test`, Chromium):

- `e2e/recordings.spec.ts` — each test is one demo clip. It drives a real user
  flow, **asserts the FRs named in its title** (`@FR-...`), records a video, and
  a global fixture asserts a silent console (NFR-OBS-01). A clip passes only if
  its requirement assertions pass.
- `scripts/record-demos.mjs` (`npm run qa:record-demos`) runs the harness and
  turns the JSON report into `docs/qa/demo-recordings/clips/*.webm` + a
  `manifest.json` (clips with `validated` + `proves` + video, plus an
  `additionalCoverage` map for the MVP FRs proven by unit/integration/manual).
- `scripts/check-recordings.mjs` (`npm run check:recordings`) is a pure-Node,
  CI-safe gate: every clip must be validated and have a real video on disk. It
  is wired into `qa:verify`.

The browser-MCP is no longer used for recordings, and recordings are never routed
through the user's browser.

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| Headless Playwright (chosen) | Background browser; video + assertions in one step; report drives the gate; most efficient | Adds a dev dependency + browser download (reverses the original TC-STACK-05) |
| Keep browser-MCP recordings | No new dep | Manual, uses the user's browser, no requirement validation — the rejected status quo |
| Puppeteer + ffmpeg | Honors "no Playwright" literally | More glue (manual assertions, manual frame/ffmpeg stitching, manual report); less robust |

## Consequences

- **Honest + automated:** every demo clip is a passing assertion of its FRs;
  `check-recordings` guards the committed evidence; `test:e2e` re-validates live.
- The traceability gate keeps `--strict-recordings` (manifest covers every MVP
  FR via clips + `additionalCoverage`); ADR-0005's "no `--strict-tests`" stance
  is unchanged for now, though the Playwright suite now gives several browser-only
  FRs real automated assertions.
- Raw Playwright artifacts (`evals/results/e2e-artifacts/`, `e2e-report.json`,
  `test-results/`, `playwright-report/`) are git-ignored; the committed evidence
  is the manifest + `*.webm` clips.
- `TC-STACK-05` in `docs/requirements.md` is amended to reflect this; `AGENTS.md`
  updated accordingly.
- This harness also functions as a UX-defect detector: a failing
  obvious-behavior assertion is a defect (it caught BUG-001 — see
  `docs/qa/ux-defects.md`).
