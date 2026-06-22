# Requirements — Weather Explorer / Weekend Trip Planner

> **Source & fidelity.** This document mirrors the upstream customer PRD
> (*PRD — Weather Explorer / Weekend Trip Planner*, last updated **2026-05-15**).
> The PRD is the single source of truth for scope and wording; descriptions here
> are reproduced faithfully (light trimming only).
>
> **Stable ids (ADR-0003).** Every requirement id is preserved **verbatim** from
> the PRD — `FR-SEARCH-01`, `NFR-A11Y-01`, `TC-STACK-01`, `BC-PRIVACY-02`, etc.
> Ids are stable across the project's whole life and are never renumbered.
>
> **Phase column.** A `Phase` column (`MVP` / `Future`) is added **for the
> traceability checker** so it can classify each requirement's delivery phase.
> This is separate from — and does not replace — the PRD's own `Status` values
> (proposed / accepted / shipped / dropped), which are tracked upstream
> (see *Status legend* below).

## Functional Requirements (FR)

### Shell & navigation

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-SHELL-01 | MVP | Shell & navigation | Single-page app with a top bar (logo, theme indicator) and a main content area. |
| FR-SHELL-02 | MVP | Shell & navigation | Layout adapts at 768 px and 1280 px breakpoints; mobile single-column, tablet two-column, desktop three-column. |
| FR-SHELL-03 | MVP | Shell & navigation | Empty state on first load: hero copy + city search prominently centered. |

### Top clock

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-CLOCK-01 | MVP | Top clock | Header shows a compact accessible local-time clock that updates live while the page is open (demo capability `top-clock`). |

### City search

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-SEARCH-01 | MVP | City search | User types a free-form city name into a single input; debounced suggestions appear from the Open-Meteo geocoding API. |
| FR-SEARCH-02 | MVP | City search | Each suggestion shows: city name, admin region, country, optional flag emoji. |
| FR-SEARCH-03 | MVP | City search | Selecting a suggestion sets the active location; URL reflects it as `?lat=&lon=&name=`. |
| FR-SEARCH-04 | MVP | City search | Pressing Enter with a single suggestion auto-selects it. |
| FR-SEARCH-05 | MVP | City search | If the geocoding API returns zero results, show "Nothing found" inline; no error toast. |
| FR-SEARCH-06 | MVP | City search | A "Use my location" button is the only sanctioned, opt-in geolocation path (never on page load); on permission denial or failure it falls back silently to the search empty state. Derived from BC-PRIVACY-02 and approved at scope sign-off (Checkpoint 1). |

### Footer jokes

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-JOKES-01 | MVP | Footer jokes | Footer area shows deterministic Ukrainian weather-themed jokes without external APIs or tracking (capability `bottom-jokes`). |

### Forecast

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-FORECAST-01 | MVP | Forecast | After a location is selected, fetch a 7-day daily forecast from the Open-Meteo forecast API. |
| FR-FORECAST-02 | MVP | Forecast | Render 7 day cards: weekday name, hi / lo °C, weather icon, precipitation probability %, wind speed. |
| FR-FORECAST-03 | MVP | Forecast | Render an hourly temperature line chart for the next 48 h using Recharts. |
| FR-FORECAST-04 | MVP | Forecast | Show sunrise + sunset for today as small text under the hourly chart. |
| FR-FORECAST-05 | MVP | Forecast | Re-fetch when location changes; cache last successful response in memory until next location switch. |

### Map

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-MAP-01 | MVP | Map | Render an OSM-tiled interactive map (Leaflet via react-leaflet) bounded to the current location. |
| FR-MAP-02 | MVP | Map | Show a marker at the current location with a popup naming the city. |
| FR-MAP-03 | MVP | Map | Clicking on the map updates the active location by the clicked coordinates and re-fetches the forecast; the point is labeled by rounded coordinates. (Amended at Checkpoint 2 / ADR-0004: Open-Meteo has no reverse-geocoding endpoint, so no city name is resolved for arbitrary clicked points.) |
| FR-MAP-04 | MVP | Map | Display "© OpenStreetMap contributors" attribution at the bottom-right; required by OSM Tile Usage Policy. |
| FR-MAP-05 | MVP | Map | Map is client-only (`dynamic({ ssr: false })`); SSR placeholder is a skeleton with the same footprint. |

### Comfort score

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-COMFORT-01 | MVP | Comfort score | `comfortScore(daily): { value: 0..100; rationale: string }` is a pure function in `lib/scoring/comfort.ts`. |
| FR-COMFORT-02 | MVP | Comfort score | Inputs: temperature feels-like, precipitation probability, wind, cloud cover, UV index. |
| FR-COMFORT-03 | MVP | Comfort score | Output rationale is a single sentence in Ukrainian, max 80 chars, no emojis. |
| FR-COMFORT-04 | MVP | Comfort score | Score for each day is displayed in the day card as a colored badge (green ≥ 70, yellow 40-69, red < 40). |
| FR-COMFORT-05 | MVP | Comfort score | Score for the upcoming weekend (Sat + Sun avg) is highlighted at the top of the forecast grid. |

### Animated background

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-ANIM-01 | MVP | Animated background | Background reflects current condition: day / night gradient, rain particles, snow particles, cloud drift. |
| FR-ANIM-02 | MVP | Animated background | Daytime vs nighttime is driven by today's sunrise/sunset for the active location, not by the user's clock. |
| FR-ANIM-03 | MVP | Animated background | Animations respect `prefers-reduced-motion`: when set, render a static gradient only. |
| FR-ANIM-04 | MVP | Animated background | Background never blocks interaction; pointer-events disabled. |

### Weekend compare

| ID | Phase | Area | Description |
|---|---|---|---|
| FR-COMPARE-01 | MVP | Weekend compare | User can pin up to 3 cities; pinned cities appear in a small chip row above the forecast (capability `weekend-compare`). |
| FR-COMPARE-02 | MVP | Weekend compare | A "Compare weekend" toggle switches the view to a 3-column table for Sat / Sun: hi/lo, precip %, comfort score. |
| FR-COMPARE-03 | MVP | Weekend compare | Each column has a sticky header with the city name and a "make active" button. |

## Non-Functional Requirements (NFR)

| ID | Phase | Area | Description |
|---|---|---|---|
| NFR-PERF-01 | MVP | Performance | Vercel Preview TTFB ≤ 300 ms on p95 for the homepage. |
| NFR-PERF-02 | MVP | Performance | Lighthouse Performance ≥ 90 on production URL (mobile + desktop). |
| NFR-PERF-03 | MVP | Performance | Initial client JS payload ≤ 200 KB gzipped. |
| NFR-A11Y-01 | MVP | Accessibility | Lighthouse Accessibility ≥ 95; all interactive elements have visible focus styles and accessible names. |
| NFR-A11Y-02 | MVP | Accessibility | Color palette meets WCAG AA contrast ratio across both light and dark themes. |
| NFR-COST-01 | MVP | Cost | Zero paid API keys; all third-party data is keyless or free-tier. |
| NFR-OBS-01 | MVP | Observability | Console is silent at runtime (no warnings, no errors) on a healthy session. |
| NFR-DX-01 | MVP | Developer experience | `npm run lint && tsc --noEmit && npm test && npm run build` finish in < 60 s on a clean checkout. |
| NFR-I18N-01 | MVP | Internationalization | Product UI strings centralised in `lib/i18n/uk.ts`; English fallback in `en.ts` (no runtime i18n library in MVP). |

## Constraints

### Technical (TC)

| ID | Phase | Area | Description |
|---|---|---|---|
| TC-STACK-01 | MVP | Technical | Next.js 16.2 App Router; TypeScript strict; React 19.2. |
| TC-STACK-02 | MVP | Technical | Tailwind CSS 4 (PostCSS plugin); shadcn/ui base-nova; class-variance-authority. |
| TC-STACK-03 | MVP | Technical | Open-Meteo APIs (forecast + geocoding); no other weather provider. |
| TC-STACK-04 | MVP | Technical | Leaflet + react-leaflet for maps; OSM raster tiles only. |
| TC-STACK-05 | MVP | Technical | Vitest for unit tests on `lib/`; automated E2E recording + requirement validation via headless Playwright (`@playwright/test`, `e2e/`), recorded as video and guarded by `check-recordings` (amended 2026-06-22 by user decision, ADR-0006; originally specified the chrome-devtools MCP without Playwright). |
| TC-DEPLOY-01 | MVP | Technical | Vercel for hosting; preview URL per PR via Git integration. |
| TC-DATA-01 | MVP | Technical | All Open-Meteo calls happen from Server Components or Route Handlers when possible; never expose Open-Meteo URLs in the client bundle in a way that suggests they require keys. |
| TC-MAP-01 | MVP | Technical | OSM tiles include attribution; respect the Tile Usage Policy (HTTPS, no scraping, valid Referer). |
| TC-PURE-01 | MVP | Technical | `lib/` is framework-free: no `next/*`, no `react`, no DOM globals — enables 100% unit-testability. |

### Business / UX (BC)

| ID | Phase | Area | Description |
|---|---|---|---|
| BC-PRIVACY-01 | MVP | Business | No analytics, no third-party trackers, no fingerprinting. |
| BC-PRIVACY-02 | MVP | Business | Geolocation only via explicit user action (button "Use my location") — never on page load. |
| BC-PRIVACY-03 | MVP | Business | No cookies set by the application code. |
| BC-BRAND-01 | MVP | Business | Visual identity follows DESIGN.md (chosen in Phase 4). UI is Ukrainian-first; tone is calm, practical, no exclamation marks. |
| BC-BRAND-02 | MVP | Business | Footer credits Open-Meteo and OpenStreetMap with hyperlinks. |
| BC-DEMO-01 | MVP | Business | The repo and live URL are the workshop's primary artifacts; every requirement is publicly demonstrable. |

## Assumptions & Notes

These items are inferred or are decisions recorded to keep the loop honest. None
of them add scope beyond the PRD; where the PRD is silent, the item is flagged
for clarification (see the batched clarification list in the analyst handoff).

- **Id grammar is stable (ADR-0003).** The loop's traceability grammar was
  widened to `(FR|NFR|TC|BC|BUG)-([A-Z0-9]+-)?NN` so it accepts the PRD's
  semantic ids verbatim. Ids are never renumbered to `FR-1..n`. Specs, tests,
  PRs, and recordings cite these ids directly.
- **Scope sign-off decisions (Checkpoint 1, 2026-06-21).** The user approved the
  MVP scope with these resolutions:
  - **Weekend-compare is MVP.** The PRD marked `weekend-compare`
    (`FR-COMPARE-01/02/03`) "optional"; the user promoted it to a core MVP slice.
    All 32 FRs are now `MVP`.
  - **Theme = system preference + indicator, no manual toggle.** FR-SHELL-01's
    "theme indicator" reflects the OS light/dark preference; NFR-A11Y-02's AA
    contrast holds in both themes. No theme-toggle control ships in the MVP
    (also avoids client state without cookies, BC-PRIVACY-03). The animated
    day/night background (FR-ANIM-01/02) is condition-driven and independent of
    the UI theme.
  - **"Use my location" is in scope** as a new traceable requirement
    (`FR-SEARCH-06`), derived from BC-PRIVACY-02 — opt-in only, never on load,
    silent fallback on denial.
  - All other recommended defaults accepted (°C only; UK-only UI with `en.ts`
    code-level fallback, no switcher; worldwide geocoding; deep links load the
    location directly; inline calm error states for all Open-Meteo failures;
    48 h hourly chart; city-level map zoom; shadcn base-nova + neutral).
- **Keyless / no-DB / no-auth stack (ADR-0001).** The app is database-free,
  auth-free, email-free. All weather/geo data comes from the keyless Open-Meteo
  forecast + geocoding APIs; there is no persistence, no accounts, no server
  secrets. Pinned cities (the Future weekend-compare feature) would be
  client-only state. The runtime needs zero env vars.
- **"Weekend"** is assumed to mean the upcoming Saturday + Sunday relative to the
  **active location's** local calendar date (consistent with FR-COMFORT-05 and
  the day-bound rules in AGENTS.md), not the visitor's own clock.
- **Geographic scope** is assumed worldwide — any city reachable via Open-Meteo
  geocoding. The PRD names no regional restriction.
- **Temperature units** are °C only for the MVP (the PRD uses °C throughout); no
  °F toggle is implied.
- **Language.** UI is Ukrainian-first (NFR-I18N-01, BC-BRAND-01). `en.ts` exists
  as a code-level fallback; no runtime i18n library and no user-facing language
  switcher are implied for the MVP.
- **Theme.** The PRD specifies a theme *indicator* (FR-SHELL-01) and AA contrast
  across both light and dark themes (NFR-A11Y-02), but no explicit theme-toggle
  FR. A light/dark *toggle* is therefore treated as not-in-scope pending
  clarification; the indicator is assumed to reflect system preference. The
  animated day/night background (FR-ANIM-01/02) is condition-driven by the active
  location's sunrise/sunset and is independent of the UI theme.
- **Error surface.** On Open-Meteo unreachability or network error, the assumed
  behavior is an inline, calm error state with a retry affordance — never a
  generic 500 and never a silent blank (consistent with NFR-OBS-01 and the
  correctness rules in AGENTS.md). This generalizes the explicit FR-SEARCH-05
  "Nothing found, no toast" rule to all external calls.
- **Hourly chart** is assumed to plot the next 48 hours of hourly points
  (FR-FORECAST-03). **Map default zoom** is assumed at roughly city level
  (≈ z=10) when bounding to the current location (FR-MAP-01).
- **shadcn/ui "base-nova"** (TC-STACK-02) is taken as the intended shadcn style;
  the concrete base color and visual identity are confirmed in the Phase-4
  `DESIGN.md` step (BC-BRAND-01).

## Status legend

The PRD assigns each requirement a `Status` value from
**proposed · accepted · shipped · dropped**. Those values are tracked **upstream
in the PRD** and are intentionally **not duplicated as a column here** — this
document carries only the `Phase` (`MVP` / `Future`) classification the
traceability checker needs. If the upstream `Status` and this document ever
conflict, the PRD is authoritative.
