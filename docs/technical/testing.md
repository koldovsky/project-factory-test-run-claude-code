# Testing

The quality strategy and how to run it. Evidence lives in the QA pack:
[traceability matrix](../qa/requirements-traceability-matrix.md),
[manual test plan](../qa/manual-test-plan.md),
[browser smoke](../qa/g5-browser-smoke.md),
[eval report](../qa/eval-report.md),
[automated verification](../qa/automated-verification-latest.md). Strategy
decision: [ADR-0005](../adr/ADR-0005-traceability-gate-calibration.md).

## Layers

| Layer | What it covers | Where | Tool |
|---|---|---|---|
| Unit | Framework-free `lib/` domain logic — pure, total, deterministic | colocated `lib/**/*.test.ts` | Vitest |
| Integration | Route handlers + the forecast→comfort→weekend pipeline | `tests/integration/*.test.ts` | Vitest |
| E2E (browser) | UI/CSS/browser-API behaviors against the live app + Open-Meteo | [g5-browser-smoke](../qa/g5-browser-smoke.md), [demo-script](../qa/demo-script.md) | browser MCP (no Playwright, TC-STACK-05) |
| Eval | Graded quality a unit test cannot assert — copy tone, error clarity, rationale accuracy | `evals/cases/*.eval.ts` | `eval-suite` workflow + `eval-judge` |

### Unit — framework-free `lib/` (Vitest)

`lib/` imports no `next/*`, `react`, or DOM (TC-PURE-01), so it is 100%
unit-testable. Tests are colocated and carry `@trace FR-x` annotations the
traceability validator reads. The pure functions are **total** — defined for
every input, clamping/falling back rather than throwing — so the tests exercise
edge inputs (NaN, null, out-of-range, missing fields), boundaries (band 39/40/
69/70, the 80-char rationale limit), and determinism.

### Integration — route handlers + pipeline

`tests/integration/`: `api-geocode.test.ts` (9) and `api-forecast.test.ts` (18)
exercise the keyless proxy handlers including every error branch (invalid coords
→ 400, upstream/network → 502, empty query → empty result);
`forecast-pipeline.test.ts` (5) checks fetch→map→comfort→weekend end to end.

### E2E — browser MCP, not Playwright

Per [ADR-0001](../adr/ADR-0001-stack.md) / TC-STACK-05, E2E is verified via
browser MCP recordings against the running app with **live Open-Meteo data**, not
Playwright. The cross-cutting smoke ([g5-browser-smoke](../qa/g5-browser-smoke.md))
covers the empty state, the deep-link location view, both themes, and mobile/
desktop viewports, and confirms a silent console (NFR-OBS-01). Per-capability
demo clips follow [demo-script](../qa/demo-script.md) and the recording quality
bar (one clip per viewport; review every artifact before it counts).

### Eval — graded quality

Tests assert exact results; evals grade what a unit test cannot — Ukrainian copy
tone, no exclamation marks, empty-state usability, error clarity, comfort-
rationale accuracy. The `eval-suite` workflow grades cases with a fresh
`eval-judge`; `node scripts/check-eval-ratchet.mjs` guards the committed score in
CI (no API key needed). Quality may ratchet up, never silently drop.

> The eval gate caught a real bug. `eval-comfort-rationale-wet` failed because
> `comfortScore` returned a "pleasant day" rationale at 95% precipitation,
> ignoring the rain — a unit test could not catch it (format/tone were correct;
> accuracy is a judgment). The fix added a `SEVERE = 0.35` driver check in
> `lib/scoring/comfort.ts` so a single notably-adverse driver is always named.
> The suite now passes **8/8** (copy-tone 94.4, error-clarity 100;
> [eval-report](../qa/eval-report.md)) and the baseline is committed.

## Counts (current, all green)

- **399 unit + 32 integration = 431** across 24 files
  ([automated-verification-latest](../qa/automated-verification-latest.md)).
- **Eval: 8/8 pass** — copy-tone 94.4, error-clarity 100
  ([eval-report](../qa/eval-report.md)).
- **Coverage baseline** (`quality/coverage-baseline.json`): lib lines 94.77%,
  branches 88.95%.

> Note: earlier QA-pack artifacts (the
> [traceability matrix](../qa/requirements-traceability-matrix.md) and
> [acceptance report](../qa/mvp-acceptance-report.md)) cite the *pre-fix* eval
> snapshot (7/8 pass, wet case 42). The fix landed in commit `7afb504`
> ("eval-driven rationale fix") and the ratchet went active in `1799493`; the
> current state is 8/8. Those two pages predate the fix and have not been
> regenerated.

## Ratchets and the deterministic loop

Coverage and eval scores are guarded by ratchets — they may rise but not silently
fall (`scripts/check-coverage-ratchet.mjs`, `scripts/check-eval-ratchet.mjs`).
Traceability and trajectory are checked deterministically:

- `node scripts/check-traceability.mjs` — every MVP FR is owned by a slice,
  cited by a spec, and has evidence (a `@trace` test for logic/data/URL/route FRs,
  or a recording-manifest clip + manual test for browser-only UI FRs). Release
  gate runs `--release --strict-recordings --check-fresh`
  ([ADR-0005](../adr/ADR-0005-traceability-gate-calibration.md)). Browser-only
  FRs surface as informational `test-trace` warnings, not failures.
- `node scripts/check-trajectory.mjs` — audits the per-slice build/review/archive
  trajectory (9 slices, clean).
- Git hooks + CI run the full battery; the `commit-msg` hook enforces `Refs:`
  trailers with the PRD id grammar (ADR-0003).

## Run it

```bash
npm run test:run            # unit + integration (Vitest)
npm run test:integration    # integration only
npm run test:coverage       # coverage report
npm run qa:verify           # full battery: trace, trajectory, tests, eval-ratchet, lint, build, openspec
```

`npm run qa:verify` is the single all-green gate (NFR-DX-01: it ran ~21 s wall in
the latest run). E2E recordings are captured via browser MCP, not an npm script
(see `test:e2e` / `qa:record-demos`, which print pointers to the recording
process).
