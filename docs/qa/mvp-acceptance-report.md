# MVP Acceptance Report — Weather Explorer / Weekend Trip Planner

Acceptance summary for the MVP. Calm and factual: it states what is delivered and
proven, and what remains for the deploy gate (G7). It is ready for customer
review and signature once the G7 items are closed.

- **Date:** 2026-06-22 (Europe/Kyiv)
- **Phase:** 5 complete (G5); Phase 6 QA pack authored; G6 (evals + recordings)
  and G7 (deploy + Lighthouse) outstanding.
- **Stack:** keyless, DB-free, auth-free Next.js 16.2 App Router (ADR-0001).

## 1. Scope delivered

**9 capability slices, all implemented, reviewed, and archived** (per
[`trajectory-report.md`](./trajectory-report.md), 9 slices, review evidence
"clean", no cross-slice module overlap):

| # | Capability | MVP FRs |
|---|---|---|
| 1 | app-shell | FR-SHELL-01, FR-SHELL-02, FR-SHELL-03 |
| 2 | comfort-score | FR-COMFORT-01..05 |
| 3 | city-search | FR-SEARCH-01..06 |
| 4 | forecast | FR-FORECAST-01..05 |
| 5 | top-clock | FR-CLOCK-01 |
| 6 | footer-jokes | FR-JOKES-01 |
| 7 | map | FR-MAP-01..05 |
| 8 | animated-bg | FR-ANIM-01..04 |
| 9 | weekend-compare | FR-COMPARE-01..03 |

**All 33 MVP functional requirements** are accounted for with an owning slice and
evidence (full mapping in
[`requirements-traceability-matrix.md`](./requirements-traceability-matrix.md)).
The generated [`traceability-report.md`](./traceability-report.md) is **PASS, 0
failures** (48 advisory warnings, explained in the matrix).

## 2. Per-capability acceptance

Acceptance criteria are taken from each slice's Definition of Done in
`docs/mvp-capability-plan.md`. Evidence: T = automated tests, S = browser smoke
([`g5-browser-smoke.md`](./g5-browser-smoke.md)), M = manual test
([`manual-test-plan.md`](./manual-test-plan.md)), E = eval case
(`evals/cases/*.eval.ts`; graded report at G6).

| Capability | Acceptance criteria (from DoD) | Evidence | Accepted |
|---|---|---|---|
| app-shell | Layout snaps at 768/1280; empty vs deep-link both render; i18n for every string; silent console | S (empty + location + responsive), T (`location/url`, `i18n`), E (copy tone) | ☐ |
| comfort-score | 100% branch intent on `comfort.ts`; never throws; rationale ≤80 chars, emoji-free; framework-free | T (`scoring/comfort` 23, `scoring/band` 8, `scoring/weekend` 13); E rationale **3/4 pass** — wet-day case fails (42), see §5 | ☐ (blocked on wet-day rationale fix) |
| city-search | Debounce; keyboard accessible; zero-results + network-error inline; geolocation only on button | T (`geo/parse`, `geo/flag`, `geo/map`, `api-geocode`), S, M (MT-02/02b/04) | ☐ |
| forecast | Live fetch for a known city; cards + chart + sun times; error state; `lib/weather` tested; Recharts not in initial bundle | T (`weather/*`, `forecast-pipeline`, `api-forecast`), S (live Київ), M (MT-05/13), E (error copy, condition names) | ☐ |
| top-clock | Updates live; accessible name; interval cleared on unmount; tested | T (`clock/format` 9), S, M (MT-01) | ☐ |
| footer-jokes | Same joke server & client; selector pure + tested; on-tone | T (`jokes/*` 34), M (MT-11) | ☐ |
| map | Client-only with skeleton, no SSR error; attribution; click sets location + re-fetch; Leaflet not in initial bundle | T (`location/coordinateLabel` 22), S (map + attribution), M (MT-06/07), build green | ☐ |
| animated-bg | Never intercepts clicks; reduced-motion static; day/night by location sun; tested; perf-safe | T (`sky/scene` 45, `sky/daynight` 17), M (MT-09/09b) | ☐ |
| weekend-compare | Pin/unpin up to 3; compare table Sat/Sun; make-active switches; no cookies | T (`compare/pins` 16, `weather/weekendDays` 15, `api-forecast`), S (toggle present), M (MT-10) | ☐ |

## 3. Non-functional requirements

| NFR | Status | Basis |
|---|---|---|
| NFR-PERF-01 (TTFB ≤ 300 ms p95) | **Pending G7** | Deploy-time metric; no DB / minimal server work. Measure on Vercel Preview. |
| NFR-PERF-02 (Lighthouse Perf ≥ 90) | **Pending G7** | Heavy libs deferred via `dynamic ssr:false`; bounded particles. Run Lighthouse on prod URL. |
| NFR-PERF-03 (initial JS ≤ 200 KB gz) | **Pending G7** (deferral implemented) | Leaflet + Recharts kept out of the initial bundle; build green. Confirm gzipped size on deployed build. |
| NFR-A11Y-01 (Lighthouse A11y ≥ 95; focus + names) | **Met (code) / score pending G7** | Visible focus rings + i18n accessible names on every control; `geo/flag` test traces NFR-A11Y-01. Lighthouse score at G7. |
| NFR-A11Y-02 (AA contrast both themes) | **Met** | Token pairs documented ≥4.5:1 in `globals.css`; scrim preserves hero/heading contrast over the gradient. Smoke notes the contrast fix; MT-12. |
| NFR-COST-01 (zero paid keys) | **Met** | Open-Meteo + OSM keyless; zero env vars; smoke confirms keyless loads. |
| NFR-OBS-01 (silent console) | **Met** | Smoke: zero warnings/errors across empty + location views, both themes/viewports, with Leaflet + Recharts + live fetch. Calm error surfaces; effect teardown. |
| NFR-DX-01 (battery < 60 s) | **Met** | `qa:verify` ran ~21 s wall (02:08:34Z → 02:08:55Z), all-green — see [`automated-verification-latest.md`](./automated-verification-latest.md). |
| NFR-I18N-01 (strings centralised; en fallback) | **Met** | `lib/i18n/{uk,en}.ts` + typed `t()`; `i18n.test.ts` traces NFR-I18N-01. |

## 4. Test counts and gates

- **Automated tests: 397 unit + 32 integration = 429**, across 24 files, all
  green (full log in [`automated-verification-latest.md`](./automated-verification-latest.md)).
- **Coverage baseline committed** (`quality/coverage-baseline.json`): lib lines
  94.77%, branches 88.95%.
- **`npm run qa:verify` is all-green:** traceability, trajectory, unit,
  integration, eval-ratchet (SKIP — no baseline committed yet), lint,
  production-build, OpenSpec 9/9 valid, no active changes.
- **Eval suite (graded quality, [`eval-report.md`](./eval-report.md), generated
  2026-06-22):** 8 cases, **7 pass / 1 fail**. Per-dimension: `copy-tone` 87.6,
  `error-clarity` 96. The failing case is **`eval-comfort-rationale-wet` (42/100)**
  — for a 95%-precipitation day the comfort rationale reads as a pleasant day and
  ignores the rain. This is a real quality defect the unit tests cannot catch;
  see §5. The eval baseline must **not** be committed until it is fixed.

**Gates:**

| Gate | Meaning | Status |
|---|---|---|
| G0–G3 | Setup / analysis / planning / spec gates | Passed (per `current-state.md`) |
| G4 | Per-slice review + archive (×9) | Passed — all 9 slices archived, trajectory "clean" |
| G5 | Cross-cutting battery + live browser smoke | Passed — `qa:verify` green, smoke recorded |
| G6 | Eval suite (graded quality) + demo recordings | **Partly done** — eval suite run (7/8 pass, [`eval-report.md`](./eval-report.md)); **1 failing case to fix + baseline to commit**; demo recordings not yet captured |
| G7 | Deploy + Lighthouse + global review | **Open** — Vercel deploy, then NFR-PERF-01/02/03 + NFR-A11Y-01 measurement |

## 5. Open items for G6 / G7

1. **G6 — Evals (must fix before baseline):** the suite is run
   ([`eval-report.md`](./eval-report.md), 7/8 pass). **`eval-comfort-rationale-wet`
   fails (42/100)**: `lib/scoring/comfort.ts` returns a "pleasant day" rationale
   at 95% precipitation, ignoring rain (FR-COMFORT-03 accuracy). Fix the rationale
   selection so high precipitation is reflected, re-run the suite, then commit
   `quality/eval-baseline.json` so `check-eval-ratchet` guards the score. Do not
   baseline a failing case.
2. **G6 — Recordings:** capture the 10 clips in
   [`demo-script.md`](./demo-script.md), **one clip per viewport**; visually
   review every screenshot and frame-sensitive video moment before treating any
   clip as evidence; record FR ids in each manifest entry.
3. **G7 — Deploy + Lighthouse:** deploy to Vercel; measure homepage p95 TTFB
   (NFR-PERF-01), gzipped initial JS (NFR-PERF-03), and Lighthouse Performance
   (NFR-PERF-02) + Accessibility (NFR-A11Y-01) on the production URL, mobile +
   desktop. Record results against these NFR rows.
4. **G7 — `npm audit`:** record remaining dev-only advisories (R-11) in the
   delivery report; upgrade if any runtime-affecting advisory appears.

## 6. Limitations stated plainly

- **Map clicks show coordinates, not city names** (FR-MAP-03, amended by
  ADR-0004): Open-Meteo has no reverse-geocoding endpoint; clicked points use a
  calm rounded-coordinate label. Forecast/comfort/map/background all work from
  lat/lon; named cities still come from search.
- **The four deploy-dependent NFRs are not asserted as passing here** — they are
  measured at G7 on the live URL. Code-level mitigations are in place and
  reviewed, but a score is not a score until it is measured.
- **The graded quality bar ([`eval-report.md`](./eval-report.md)) is produced and
  has one failing case** — `eval-comfort-rationale-wet` (42/100): the comfort
  rationale for a very wet day reads as pleasant and omits the rain. Until this is
  fixed and the suite re-run, FR-COMFORT-03's rationale **accuracy** is not fully
  met (the formatting/tone constraints — Ukrainian, ≤80 chars, no `!`, calm — are
  met and unit-tested). The `error-clarity` dimension (96) and the rest of
  `copy-tone` pass.

---

**Customer sign-off**

Accepted by: ______________________  Role: ______________  Date: ____________

Notes / conditions: ___________________________________________________________
