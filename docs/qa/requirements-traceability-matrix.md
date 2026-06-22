# Requirements Traceability Matrix

Human-readable matrix for **all 33 MVP functional requirements** and **all 9
non-functional requirements**. Each row links a requirement to the implementing
module(s)/component(s), the automated test(s) that cover it (citing the `@trace`
annotation actually present in the test file), and the evidence that demonstrates
it.

Companion machine-generated report:
[`traceability-report.md`](./traceability-report.md) (`check-traceability.mjs`,
**PASS, 0 failures, 48 warnings**). The warnings are *advisory*: they flag FRs
whose `@trace` test annotation uses a sibling FR id from the same slice, and FRs
not yet referenced by a recording manifest (recordings are captured at G6 — see
[`demo-script.md`](./demo-script.md)). None is a failure.

Evidence keys:

- **Smoke** = a documented state in [`g5-browser-smoke.md`](./g5-browser-smoke.md).
- **Tests** = the unit/integration files listed (run counts in
  [`automated-verification-latest.md`](./automated-verification-latest.md):
  399 tests total (incl. 32 integration), all green).
- **Eval** = a graded quality case in `evals/cases/*.eval.ts`, scored in
  [`eval-report.md`](./eval-report.md) (generated 2026-06-22 by the `eval-suite`
  workflow: 8 cases, 8 pass / 0 fail; dimensions `copy-tone` 94.4,
  `error-clarity` 100). The eval *decides* a quality case; cite its verdict, not
  just a clip. `check-eval-ratchet` guards the committed baseline
  (`quality/eval-baseline.json`).
- **G7** = verified only on the deployed URL (Lighthouse / Vercel) — not claimed
  passing here.

`@trace` annotations are quoted verbatim from the test file header so a reviewer
can grep for them.

## Functional Requirements

### Shell & navigation

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-SHELL-01 | `components/shell/AppShell.tsx`, `TopBar.tsx` (logo + theme indicator + clock slot), `Footer.tsx`; theme indicator + tokens in `app/globals.css` | No direct `@trace FR-SHELL-01` test (server-composed chrome; advisory warning). Theme strings/indicator copy covered indirectly by `lib/i18n/i18n.test.ts` (`@trace NFR-I18N-01, BC-BRAND-01`) | Smoke: top bar shows logo + live clock + theme indicator in both empty and location states |
| FR-SHELL-02 | `AppShell.tsx` `<main>` grid `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (Tailwind md=768, xl=1280) | No direct `@trace` (CSS breakpoints; advisory warning) | Smoke: desktop renders multi-column; mobile 375px renders single column; "Responsive (FR-SHELL-02)" check |
| FR-SHELL-03 | `app/page.tsx` (empty-vs-deep-link routing), `components/shell/EmptyState.tsx`, `lib/location/url.ts` (`parseLocationParams`) | `lib/location/url.test.ts` (`@trace FR-SHELL-03`, 24 tests) | Smoke: first-load empty state (hero + centered search); Eval **pass**: `eval-copy-tone-empty-state-hero` (96), `eval-copy-tone-deep-link-error-notice` (96) |

### Top clock

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-CLOCK-01 | `components/clock/Clock.tsx` (`useSyncExternalStore`, hydration-safe, accessible `<time>`); `lib/clock/format.ts` | `lib/clock/format.test.ts` (`@trace FR-CLOCK-01`, 9 tests) | Smoke: "live clock" present in top bar |

### City search

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-SEARCH-01 | `components/search/CitySearch.tsx` (debounced ~300 ms fetch), `app/api/geocode/route.ts`, `lib/geo/parse.ts` | `tests/integration/api-geocode.test.ts` (`@trace FR-SEARCH-01, FR-SEARCH-05, TC-DATA-01`, 9), `lib/geo/parse.test.ts` (`@trace FR-SEARCH-01, FR-SEARCH-05`, 14) | Tests; manual MT-02 |
| FR-SEARCH-02 | `CitySearch.tsx` suggestion rows (name, admin1, country, flag), `lib/geo/flag.ts`, `lib/geo/map.ts` | `lib/geo/flag.test.ts` (`@trace FR-SEARCH-02, NFR-A11Y-01`, 15), `lib/geo/map.test.ts` (`@trace FR-SEARCH-02`, 14) | Tests; manual MT-02 |
| FR-SEARCH-03 | `CitySearch.tsx` (`router.push(?lat&lon&name)`), `lib/location/url.ts` (`toLocationQuery`) | `lib/location/url.test.ts` (`@trace FR-SHELL-03`, same module covers query build + parse round-trip; advisory warning on the FR-SEARCH-03 id) | Smoke: deep-link view loads from `?lat&lon&name`; manual MT-03 |
| FR-SEARCH-04 | `CitySearch.tsx` `handleKeyDown` (Enter auto-selects a lone suggestion) | No direct `@trace FR-SEARCH-04` test (UI keyboard handler; advisory warning) | Manual MT-02 (Enter on single suggestion) |
| FR-SEARCH-05 | `CitySearch.tsx` `status: "empty"` inline (no toast); `lib/geo/parse.ts` (missing `results` → []); `app/api/geocode/route.ts` | `lib/geo/parse.test.ts` (`@trace FR-SEARCH-01, FR-SEARCH-05`, 14), `tests/integration/api-geocode.test.ts` (`@trace ... FR-SEARCH-05`, 9) | Tests; manual MT-02b |
| FR-SEARCH-06 | `CitySearch.tsx` `handleUseMyLocation` (opt-in button only; silent fallback on denial) | No direct `@trace FR-SEARCH-06` test (browser geolocation API; advisory warning) | Manual MT-04 (allow + deny paths); derived from BC-PRIVACY-02 |

### Footer jokes

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-JOKES-01 | `components/shell/Footer.tsx`, `lib/jokes/jokes.ts`, `lib/jokes/select.ts`, `lib/jokes/dayOfYear.ts` | `lib/jokes/jokes.test.ts` (`@trace FR-JOKES-01, NFR-I18N-01`, 9), `lib/jokes/select.test.ts` (`@trace FR-JOKES-01`, 15), `lib/jokes/dayOfYear.test.ts` (`@trace FR-JOKES-01`, 10) | Tests (determinism, bounds, no `!`); manual MT-11 |

### Forecast

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-FORECAST-01 | `components/forecast/getForecast.ts` (request-scoped `cache()`), `lib/weather/fetchForecast.ts`, `lib/weather/map.ts`, `app/page.tsx`; error path `components/forecast/ForecastError.tsx` | `tests/integration/forecast-pipeline.test.ts` (`@trace FR-FORECAST-01, FR-FORECAST-02, FR-COMFORT-04, FR-COMFORT-05`, 5), `tests/integration/api-forecast.test.ts` (`@trace FR-FORECAST-01, FR-COMPARE-02, TC-DATA-01`, 18), `lib/weather/map.test.ts` (`@trace FR-FORECAST-01, FR-FORECAST-02, NFR-OBS-01`, 19) | Smoke: live Open-Meteo forecast renders (no error); Eval **pass**: `eval-forecast-error-copy-tone` (96, dimension `error-clarity`) |
| FR-FORECAST-02 | `components/forecast/DayCard.tsx`, `WeatherIcon.tsx`, `lib/weather/code.ts`, `lib/weather/weekday.ts`, `lib/weather/map.ts` | `lib/weather/code.test.ts` (`@trace FR-FORECAST-02`, 54), `lib/weather/weekday.test.ts` (`@trace FR-FORECAST-02`, 9), `lib/weather/map.test.ts` (`@trace FR-FORECAST-01, FR-FORECAST-02, NFR-OBS-01`, 19) | Smoke: 7 day cards with weekday, hi/lo, precip %, wind; Eval **pass**: `eval-forecast-condition-names` (100) |
| FR-FORECAST-03 | `components/forecast/HourlyChartLazy.tsx` (`dynamic ssr:false`), `HourlyChart.tsx` (Recharts) | No direct `@trace FR-FORECAST-03` test (Recharts is a client-only render; advisory warning). Underlying hourly data mapping covered by `lib/weather/map.test.ts` | Smoke: 48h hourly chart in location view; manual MT-05 |
| FR-FORECAST-04 | `components/forecast/SunTimes.tsx` (today sunrise/sunset under chart); local-time strings from `lib/weather/map.ts` | No direct `@trace FR-FORECAST-04` test (presentation slice of mapped data; advisory warning). Sun-time mapping covered by `lib/weather/map.test.ts` | Manual MT-05 (sunrise/sunset under chart) |
| FR-FORECAST-05 | `components/forecast/getForecast.ts` (`react cache()` — request-scoped memo; re-fetch on coordinate change) | No direct `@trace FR-FORECAST-05` test (React `cache()` is request-scoped framework behavior, intentionally not a `lib/` unit; advisory warning). Documented rationale in `getForecast.ts` | Manual MT-03 (switching location re-fetches) |

### Map

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-MAP-01 | `components/map/MapView.tsx` (Leaflet `MapContainer`, OSM `TileLayer`, z=10), `MapPanel.tsx` | No direct `@trace FR-MAP-01` test (Leaflet touches `window`; client-only, advisory warning) | Smoke: "OSM Leaflet map centered on Kyiv with marker"; manual MT-06 |
| FR-MAP-02 | `MapView.tsx` `<Marker>` + `<Popup>{location.name}` | No direct `@trace FR-MAP-02` test (advisory warning) | Smoke: marker on Kyiv; manual MT-06 |
| FR-MAP-03 | `MapView.tsx` `ClickToSetLocation` (bounds-validated click → `?lat&lon&name`), `lib/location/coordinateLabel.ts` (ADR-0004: coordinate label, no reverse geocoding) | `lib/location/coordinateLabel.test.ts` (`@trace FR-MAP-03`, 22 tests) | Smoke: "FR-MAP-03 ... 1" in traceability-report; manual MT-07 (click sets coords + re-fetch) |
| FR-MAP-04 | `MapView.tsx` `TileLayer attribution={t("mapAttribution")}`; copy `lib/i18n/uk.ts` | No direct `@trace FR-MAP-04` test (Leaflet render; advisory warning). Attribution string presence covered by `lib/i18n/i18n.test.ts` | Smoke: "© OpenStreetMap contributors attribution visible (FR-MAP-04)"; manual MT-06 |
| FR-MAP-05 | `components/map/MapPanel.tsx` (`dynamic(..., { ssr:false })` from `"use client"` wrapper; equal-footprint `MapSkeleton`) | No direct `@trace FR-MAP-05` test (Next bundling behavior; advisory warning) | Build: client-only chunk, no SSR error (production-build green); manual MT-06 (no layout shift) |

### Comfort score

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-COMFORT-01 | `lib/scoring/comfort.ts` (pure total `comfortScore`) | `lib/scoring/comfort.test.ts` (`@trace FR-COMFORT-01, FR-COMFORT-02, FR-COMFORT-03`, 23 tests) | Tests (never throws, clamping, boundaries) |
| FR-COMFORT-02 | `lib/scoring/comfort.ts` inputs: feels-like, precip prob, wind, cloud, UV | `lib/scoring/comfort.test.ts` (`@trace FR-COMFORT-01, FR-COMFORT-02, FR-COMFORT-03`, 23) | Tests |
| FR-COMFORT-03 | `lib/scoring/comfort.ts` rationale (UA, ≤80 chars, no emoji) | `lib/scoring/comfort.test.ts` (`@trace ... FR-COMFORT-03`, incl. the dominant-adverse-driver regression tests) | Tests pass (UA, ≤80 chars, no `!`). **Eval: 4/4 pass** ([`eval-report.md`](./eval-report.md)). The eval gate originally caught a real bug — a 95%-rain day scoring ~70 returned the "pleasant day" rationale, ignoring the rain — now fixed: a notably-adverse driver is named even at high values (`SEVERE = 0.35` in `buildRationale`), with a unit regression guard. |
| FR-COMFORT-04 | `components/comfort/ComfortBadge.tsx`, `lib/scoring/band.ts` (green ≥70 / yellow 40–69 / red <40) | `lib/scoring/band.test.ts` (`@trace FR-COMFORT-04`, 8), `components/comfort/ComfortBadge.test.tsx` (`@trace FR-COMFORT-04`, 4), `tests/integration/forecast-pipeline.test.ts` (`@trace ... FR-COMFORT-04 ...`, 5) | Smoke: 8 comfort badges with `data-band`; manual MT-08 |
| FR-COMFORT-05 | `components/forecast/WeekendHighlight.tsx`, `lib/scoring/weekend.ts`, `lib/weather/weekendDays.ts`, `ForecastView.tsx` | `lib/scoring/weekend.test.ts` (`@trace FR-COMFORT-05`, 13), `tests/integration/forecast-pipeline.test.ts` (`@trace ... FR-COMFORT-05`, 5) | Smoke: "weekend comfort highlight 88 сприятливо"; manual MT-08 |

### Animated background

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-ANIM-01 | `components/background/AnimatedBackground.tsx`, `lib/sky/scene.ts`, gradients/particles in `app/globals.css` | `lib/sky/scene.test.ts` (`@trace FR-ANIM-01, FR-ANIM-02`, 45 tests) | Smoke: location view renders the day/night gradient; manual MT-09 |
| FR-ANIM-02 | `lib/sky/daynight.ts`, `lib/sky/localNow.ts` (day/night from active location's sun times, not visitor clock); wired in `app/page.tsx` | `lib/sky/daynight.test.ts` (`@trace FR-ANIM-02`, 17), `lib/sky/scene.test.ts` (`@trace FR-ANIM-01, FR-ANIM-02`, 45) | Tests; manual MT-09 |
| FR-ANIM-03 | `app/globals.css` `@media (prefers-reduced-motion: reduce)` hides `.sky-particles` (CSS, pre-hydration) | No direct `@trace FR-ANIM-03` test (CSS media query; advisory warning) | Manual MT-09b (OS reduced-motion → static gradient) |
| FR-ANIM-04 | `AnimatedBackground.tsx` (`aria-hidden`, `pointer-events-none`, `-z-10`), `.sky-layer { pointer-events:none }` | No direct `@trace FR-ANIM-04` test (CSS/DOM attribute; advisory warning) | Manual MT-09 (clicks pass through to content) |

### Weekend compare

| Req | Implementation | Automated tests (`@trace`) | Evidence |
|---|---|---|---|
| FR-COMPARE-01 | `components/compare/PinBar.tsx`, `CompareView.tsx`, `lib/compare/pins.ts` (max 3, dedupe) | `lib/compare/pins.test.ts` (`@trace FR-COMPARE-01`, 16 tests) | Smoke: "pin + compare buttons"; manual MT-10 |
| FR-COMPARE-02 | `components/compare/CompareTable.tsx` (3-col Sat/Sun: hi/lo, precip %, comfort), `lib/weather/weekendDays.ts`, `app/api/forecast/route.ts` | `lib/weather/weekendDays.test.ts` (`@trace FR-COMPARE-02`, 15), `tests/integration/api-forecast.test.ts` (`@trace FR-FORECAST-01, FR-COMPARE-02, TC-DATA-01`, 18) | Smoke: "Порівняти вихідні" toggle present; manual MT-10 |
| FR-COMPARE-03 | `CompareTable.tsx` sticky per-column header + "make active" button | No direct `@trace FR-COMPARE-03` test (UI sticky header + nav; advisory warning) | Manual MT-10 (sticky header + make-active switches view) |

## Non-Functional Requirements

| Req | Where enforced / measured | Automated tests (`@trace`) | Evidence / verification method |
|---|---|---|---|
| NFR-PERF-01 (TTFB ≤ 300 ms p95) | Server Components + route handlers; no DB; static-ish home route | None (deploy-time metric) | **G7**: measure on the Vercel Preview URL (p95 homepage TTFB). Not claimed here. |
| NFR-PERF-02 (Lighthouse Perf ≥ 90) | Heavy client libs deferred via `dynamic ssr:false`: `MapPanel.tsx` (Leaflet), `HourlyChartLazy.tsx` (Recharts); bounded particle count (`PARTICLE_COUNT=14`) | None (deploy-time metric) | **G7**: Lighthouse on the production URL (mobile + desktop). Code-level deferral verified; score pending deploy. |
| NFR-PERF-03 (initial JS ≤ 200 KB gz) | `dynamic ssr:false` keeps Leaflet + Recharts out of the initial/empty-state bundle; `MapPanel.tsx`, `HourlyChartLazy.tsx` | None | Build succeeds (`production-build` green). **G7**: confirm gzipped initial JS on the deployed build. Deferral is implemented and code-reviewed. |
| NFR-A11Y-01 (Lighthouse A11y ≥ 95; focus + names) | Visible `focus-visible:ring-*` on every control; accessible names from i18n (`Clock`, `ComfortBadge`, `CitySearch`, `Footer`, `MapView`, compare controls) | `lib/geo/flag.test.ts` (`@trace FR-SEARCH-02, NFR-A11Y-01`, 15) | Smoke: silent console; controls labelled. **G7**: Lighthouse Accessibility score. Manual MT covers focus/keyboard. |
| NFR-A11Y-02 (WCAG AA contrast, both themes) | `app/globals.css` token pairs documented ≥4.5:1 (e.g. foreground/background ≈ 18.9–20:1, muted ≈ 6.7–8.3:1); theme-aware scrim behind hero/h1 over the gradient (`EmptyState.tsx`, `app/page.tsx` `bg-background/80`) | None (CSS palette) | Smoke: "city heading readable over the light day-gradient (NFR-A11Y-02 contrast fix)". Manual MT verifies both themes. |
| NFR-COST-01 (zero paid keys; keyless/free-tier) | Open-Meteo (forecast + geocode) keyless; OSM tiles; no env vars; `.env.example` carries no secret | Keyless behavior asserted in `tests/integration/api-geocode.test.ts` and `api-forecast.test.ts` (`@trace ... TC-DATA-01`) | Smoke: "Keyless (NFR-COST-01): forecast + geocode + tiles all loaded with no API key" |
| NFR-OBS-01 (console silent on healthy session) | Calm inline error surfaces (`ForecastError`, `Notice`, search/compare/map inline states); timer/effect teardown (`Clock`, `CitySearch`, `CompareTable`) | `lib/weather/map.test.ts` (`@trace FR-FORECAST-01, FR-FORECAST-02, NFR-OBS-01`, 19) | Smoke: "zero console warnings and zero errors across empty state, location view (Leaflet + Recharts + live fetch), both themes/viewports" |
| NFR-DX-01 (lint+tsc+test+build < 60 s) | `npm run qa:verify` battery | The battery itself | `automated-verification-latest.md`: started 02:08:34Z, finished 02:08:55Z (~21 s wall for the full battery incl. extra checks). All-green. |
| NFR-I18N-01 (strings in `lib/i18n/uk.ts`; `en.ts` fallback) | `lib/i18n/uk.ts`, `lib/i18n/en.ts`, `lib/i18n/index.ts` (typed `t()` accessor used by every visible-string component) | `lib/i18n/i18n.test.ts` (`@trace NFR-I18N-01, BC-BRAND-01`, 10); also `lib/jokes/jokes.test.ts` (`@trace FR-JOKES-01, NFR-I18N-01`) | Tests (key parity uk/en, accessor) |

## Constraints (selected, for completeness)

These travel with the slices; the key ones with direct evidence:

| Constraint | Where | Evidence |
|---|---|---|
| TC-PURE-01 (`lib/` framework-free) | all of `lib/` | trajectory-report (per-slice lib domains); unit tests run under jsdom with no `next/*` imports in `lib/` |
| TC-DATA-01 (Open-Meteo from server) | `app/api/geocode/route.ts`, `app/api/forecast/route.ts`, `getForecast.ts` | `api-geocode.test.ts`, `api-forecast.test.ts` (`@trace ... TC-DATA-01`) |
| TC-MAP-01 (OSM attribution + HTTPS) | `MapView.tsx` (`https://tile.openstreetmap.org`, attribution) | Smoke: attribution visible (FR-MAP-04) |
| TC-STACK-03/04 (Open-Meteo only; Leaflet/OSM) | dependencies in `package.json`; ADR-0004 | Build + smoke |
| BC-PRIVACY-01/02/03 (no trackers/cookies; opt-in geo) | no analytics libs; `CitySearch.handleUseMyLocation`; no `document.cookie` writes | Manual MT-04 / MT-12; code review |
| BC-BRAND-01/02 (UA-first, calm; footer credits) | `lib/i18n/uk.ts`; `Footer.tsx` Open-Meteo + OSM links | `i18n.test.ts` (`@trace ... BC-BRAND-01`); evals (`copy-tone` dimension); manual MT-11 |

## Requirements with no dedicated `@trace` test (explicit reasons)

These FRs are covered by browser smoke + manual tests + code review rather than a
unit test that carries their own id. The reason is stated per the matrix rule
"no empty cells without an explicit reason":

- **FR-SHELL-01, FR-SHELL-02** — server-composed chrome / CSS breakpoints; no
  unit-testable pure function. Verified in the browser smoke (top bar; responsive
  column behavior).
- **FR-SEARCH-03, FR-SEARCH-04, FR-SEARCH-06** — URL navigation, Enter
  auto-select, and the browser geolocation API are UI/browser-API behaviors.
  FR-SEARCH-03's URL helper is exercised by `lib/location/url.test.ts`; the rest
  by manual tests.
- **FR-FORECAST-03, FR-FORECAST-04** — Recharts client render and presentation of
  already-mapped sun times; underlying data mapping is unit-tested in
  `lib/weather/map.test.ts`.
- **FR-FORECAST-05** — React `cache()` is request-scoped framework behavior,
  intentionally not a `lib/` unit (TC-PURE-01).
- **FR-MAP-01/02/04/05** — Leaflet renders against `window` (client-only); covered
  by the browser smoke and the production build (client-only chunk).
- **FR-ANIM-03, FR-ANIM-04** — enforced in CSS (`prefers-reduced-motion`,
  `pointer-events:none`), verified manually.
- **FR-COMPARE-03** — sticky header + make-active navigation, verified manually.

No FR or NFR is left without evidence. The only items whose **passing result**
cannot be asserted from this repository are the **deploy-dependent NFRs**
(NFR-PERF-01/02/03 measured values, NFR-A11Y-01 Lighthouse score), explicitly
deferred to **G7**.
