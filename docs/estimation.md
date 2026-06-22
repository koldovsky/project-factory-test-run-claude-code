# Estimation & effort log

An honest reconstruction of the delivery, derived from the git history
(`git log --oneline`, 48 commits). This was an **automated multi-agent build**
under Project Factory, so it is described in **phases, slices, and gates** rather
than invented person-hours. The rough human-equivalent estimates below are a
sanity guide for a team scoping similar work, not a record of time actually spent.

- **Repository window:** first commit `b665e38` 2026-06-21 23:04 →
  latest `f1f3741` 2026-06-22 05:40 (Europe/Kyiv). ~6.5 hours of automated
  wall-clock across the run.
- **Output:** 9 capability slices, 33 MVP FRs, 9 NFRs, 5 ADRs, the QA proof pack,
  399 unit + 32 integration tests, 8/8 evals.

## Phases & gates (from git + current-state)

| Phase | Gate | Commits | Output |
|---|---|---|---|
| 0 Setup | G0 | `b665e38`, `edcb870` | Next.js scaffold + Project Factory loop; hooks verified |
| 1 Requirements | G1 | `5f51c74` | `requirements.md`, `product-brief.md` |
| 2 Specs | G2 | `35849f1` | 9 baseline capability specs (`openspec/specs/`) |
| 3 Planning | G3 | `3ad5902` | `mvp-capability-plan.md`; map reverse-geo resolution (ADR-0004) |
| 4 Build (per-slice) | G4 ×9 | `0709084`…`396904f` | 9 slices built test-first, reviewed (maker≠checker), archived |
| 5 Integration | G5 | `34b4557`, `f0120a4`, `8769527` | 32 integration tests; coverage baseline; browser smoke |
| 6 Quality | G6 | `7afb504`, `1799493`, `f1f3741` | QA pack; eval suite + baseline; eval-driven comfort fix; trace gate calibration (ADR-0005) |
| 7 Docs + deploy | G7 | (this work) | Technical docs, estimation, delivery report; Vercel deploy + Lighthouse outstanding |

## Per-slice effort log

Each slice ran the loop: proposal → spec delta → design → tasks → tests (red) →
implement (green) → review gate → archive. The commit pattern is visible per
slice (`feat` → one or more `fix(...): … (review)` → `chore: archive`), which
shows the maker≠checker review actually changed code. Test counts are the
colocated unit tests for that slice's `lib/` modules (see the
[traceability matrix](./qa/requirements-traceability-matrix.md)).

| # | Slice | FRs | Key commits | Tests added | Review fixes | Human-equiv* |
|---|---|---|---|---|---|---|
| 1 | app-shell | FR-SHELL-01..03 | `0709084` feat; `6f934ce`/`5e8428e`/`df11393` fix(review); `13039ec`/`0bec033` archive | `location/url` 24, `i18n` 10 | 3 review rounds (clock slot, coord round-trip, h1 heading) | 1.0–1.5 d |
| 2 | comfort-score | FR-COMFORT-01..05 | `9c9528d` scaffold; `705d996` feat; `09bc3c0` test+review; `7db3e95` archive | `comfort` 25, `band` 8, `weekend` 13 | badge render test | 1.0 d |
| 3 | city-search | FR-SEARCH-01..06 | `866d91a` feat; `0496660`/`5ff4a43` fix(review); `5325729`/`3cc6caa` archive | `geo/parse` 14, `geo/flag` 15, `geo/map` 14 | 2 review rounds (combobox/listbox a11y) | 1.0–1.5 d |
| 4 | forecast | FR-FORECAST-01..05 | `f5390de` feat; `b2ed944` fix(review); `7bfd7a0`/`2065217` archive | `weather/map` 19, `code` 54, `weekday` 9 | null-optional days, invalid-coord spec | 1.5 d |
| 5 | top-clock | FR-CLOCK-01 | `58b1a73` feat; `0516e66` review a11y | `clock/format` 9 | aria-label polish | 0.5 d |
| 6 | footer-jokes | FR-JOKES-01 | `4ad7c49` feat; `0f6177d` review | `jokes` 9, `select` 15, `dayOfYear` 10 | clean review | 0.5 d |
| 7 | map | FR-MAP-01..05 | `5bbf202` feat; `84ad90c` fix(review); `b5e9736` archive | `coordinateLabel` 22 | out-of-range click message, marker alt | 1.0–1.5 d |
| 8 | animated-bg | FR-ANIM-01..04 | `255e13a` feat; `aecac62` fix(review); `ad8ba91` archive | `sky/scene` 45, `daynight` 17 | AA-contrast backing | 1.0 d |
| 9 | weekend-compare | FR-COMPARE-01..03 | `dfb253e` scaffold; `d55a817` feat; `1278c03` fix(review); `396904f` archive | `compare/pins` 16, `weekendDays` 15 | empty-cell label, stale limit gate, WCAG 2.5.3 | 1.5 d |

\* *Human-equivalent* = a rough estimate of how long one experienced Next.js
engineer might take to build, test, and self-review the slice to the same bar
(spec, tests, a11y, calm error states). It is a scoping aid, not measured time.

## Cross-cutting effort (not in any single slice)

| Item | Commits | Human-equiv* |
|---|---|---|
| Phase 0–3 (scaffold, requirements, specs, plan, ADR-0001..0004) | `b665e38`…`3ad5902` | 1.5–2.0 d |
| Integration tests + coverage baseline (G5) | `34b4557`, `8769527` | 0.5 d |
| Browser smoke (G5) | `f0120a4` | 0.5 d |
| Eval suite + baseline + the eval-driven comfort fix (G6) | `7afb504`, `1799493` | 0.5–1.0 d |
| QA proof pack (6 docs + recordings manifest) | `7afb504` | 1.0 d |
| Traceability gate calibration / ADR-0005 (G6) | `f1f3741` | 0.5 d |
| Technical docs + delivery report (G7, this work) | — | 0.5–1.0 d |

## Rough total

Summing the slice and cross-cutting estimates gives roughly **13–17 engineer-days**
of human-equivalent effort for the whole MVP (9 capabilities + the spec/test/QA
scaffolding around them). The automated run compressed this into ~6.5 hours of
wall-clock. The estimate excludes the deploy-dependent G7 measurement work
(Vercel deploy + Lighthouse), which is small but blocked on infrastructure.

## What the git history shows about quality

- **Test-first is visible:** slices land tests with the feature; the 431-test
  suite is all green ([automated-verification-latest](./qa/automated-verification-latest.md)).
- **Maker≠checker is visible:** almost every slice has at least one
  `fix(...): … (review)` commit that changed code after a separate review pass
  (a11y, contrast, error copy, spec reconciliation).
- **A gate caught a real bug:** the eval suite failed `eval-comfort-rationale-wet`
  (pleasant copy on a 95%-rain day); commit `7afb504` fixed
  `lib/scoring/comfort.ts` before the baseline was committed — the kind of
  accuracy defect a unit test cannot catch.
