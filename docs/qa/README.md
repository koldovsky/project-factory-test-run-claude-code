# QA Proof Pack — Weather Explorer / Weekend Trip Planner

This directory is the Phase 6 QA proof pack for the **Weather Explorer / Weekend
Trip Planner** MVP. It is the evidence a customer reads to accept the work and
the map the next engineer reads to resume it.

The product is **Ukrainian-first**; these QA documents are written in **English**
because they are developer- and reviewer-facing.

## Stack context (read this first)

This is a **keyless, database-free, auth-free** Next.js 16.2 App Router app
(ADR-0001). There is **no persistence, no accounts, no server secrets, no cookies
set by the app, and zero required env vars**. All weather and geocoding data come
from the keyless **Open-Meteo** APIs; map tiles from **OpenStreetMap**. This
shapes the whole QA approach:

- There are **no test users or seeded accounts** — anyone who opens the URL is a
  full user. Manual tests need only a Chrome browser.
- Because `lib/` is framework-free (TC-PURE-01), the bulk of the logic is covered
  by fast Vitest **unit tests**; route handlers and the forecast→comfort→weekend
  pipeline are covered by **integration tests** against recorded Open-Meteo
  fixtures.
- **E2E uses the browser MCP, not Playwright** (ADR-0001 / TC-STACK-05). The
  live-app smoke is recorded in [`g5-browser-smoke.md`](./g5-browser-smoke.md);
  polished per-capability recordings follow the [`demo-script.md`](./demo-script.md).
- Some NFRs are **deployed-URL-dependent** (Lighthouse Performance/Accessibility,
  Vercel TTFB). Those are explicitly marked **for G7** in the matrix and
  acceptance report — they are not claimed as passing here.

## Index

| Artifact | Purpose |
|---|---|
| [`requirements-traceability-matrix.md`](./requirements-traceability-matrix.md) | Every MVP FR (33) and NFR (9) → implementing module(s) → automated test(s) → evidence. No empty cells. |
| [`manual-test-plan.md`](./manual-test-plan.md) | Numbered scenarios a non-developer can run in Chrome: action → expected result, with FR ids. |
| [`demo-script.md`](./demo-script.md) | Ordered narration for one recording per capability + a negative/error clip. |
| [`risk-register.md`](./risk-register.md) | Risks, likelihood, impact, mitigation, owner, status. |
| [`mvp-acceptance-report.md`](./mvp-acceptance-report.md) | Per-capability acceptance criteria + evidence, signature-ready. |
| [`g5-browser-smoke.md`](./g5-browser-smoke.md) | Live-app cross-cutting browser smoke (Phase 5 / G5). |
| [`traceability-report.md`](./traceability-report.md) | Generated FR→spec/plan/test/recording matrix (`check-traceability.mjs`). |
| [`trajectory-report.md`](./trajectory-report.md) | Generated per-slice process audit (`check-trajectory.mjs`). |
| [`automated-verification-latest.md`](./automated-verification-latest.md) | Captured output of `npm run qa:verify`. |
| [`eval-report.md`](./eval-report.md) | **Generated 2026-06-22** by the `eval-suite` workflow. Per-dimension scores (`copy-tone` 87.6, `error-clarity` 96) + per-case verdicts. **8 cases: 7 pass, 1 FAIL** (`eval-comfort-rationale-wet`, 42/100). The eval *decides* a quality case; a recording only illustrates it. |
| `demo-recordings/` | **Not yet captured.** Per-capability video + screenshots per `demo-script.md`. |

## How to run the battery

```bash
npm run qa:verify
```

`scripts/qa-verify.mjs` runs the full gate battery and writes
[`automated-verification-latest.md`](./automated-verification-latest.md). Each
check, and what it covers:

| Check | Command | What it proves |
|---|---|---|
| traceability | `node scripts/check-traceability.mjs` | Every MVP FR maps to a spec, a plan slice, ≥1 `@trace`'d test, and (where present) a recording manifest. Writes `traceability-report.md`. |
| trajectory | `node scripts/check-trajectory.mjs` | Each archived slice took a sound path (review evidence, `Slice:` trailers, disjoint module scope). Writes `trajectory-report.md`. |
| unit-tests | `npm run test:run` | Vitest unit suite on `lib/` + a component test (`ComfortBadge`). **399 tests** across 24 files. |
| integration-tests | `npm run test:integration` | Route handlers (`/api/geocode`, `/api/forecast`) + the forecast→comfort→weekend pipeline vs Open-Meteo fixtures. **32 tests**. |
| eval-ratchet | `node scripts/check-eval-ratchet.mjs` | Guards the graded quality score against regressions. Currently **SKIP** — `evals/results/latest.json` exists (generated 2026-06-22) but no `quality/eval-baseline.json` is committed yet. The baseline should **not** be established until the one failing case (`eval-comfort-rationale-wet`) is fixed, or it would lock in a failure. |
| lint | `npm run lint` | ESLint (Next config) clean. |
| production-build | `npm run build` | `next build` succeeds (also runs `tsc`). |
| openspec-all | `npx openspec validate --all --strict` | All 9 capability specs valid. |
| openspec-active-list | `npx openspec list` | No active (un-archived) changes remain. |

### Other useful commands

```bash
npm run test            # Vitest watch mode
npm run test:coverage   # coverage (baseline: quality/coverage-baseline.json)
npm run typecheck       # tsc --noEmit
npm run check:trace     # regenerate the traceability report only
```

## Verification layering

Three tools answer three different questions; this pack uses all three:

- **Tests** — "is the output exactly correct?" Deterministic logic (scoring,
  mapping, URL/state, weekend math). 399 tests total (incl. 32 integration).
- **Evals** — "across many cases, how good is the *quality*?" Copy tone, error
  clarity, condition naming. Graded by a rubric, ratcheted over time. The eval
  *decides* a quality case; a recording only *illustrates* it.
- **Recordings** — "did one watched run look right?" Human-facing proof of the
  happy path and the calm error path, per [`demo-script.md`](./demo-script.md).

When a clip and an eval cover the same scenario, cite the **eval verdict** as the
decision and the clip as the illustration.
