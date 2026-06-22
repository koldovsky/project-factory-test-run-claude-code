# Add weekend-compare

## Why

People choosing a weekend trip want to compare candidate cities side by side.
This lets a visitor pin up to 3 cities and switch to a 3-column table comparing
the upcoming Saturday and Sunday (hi/lo, precip %, comfort score), then promote
any column to the main view. All state is client-only (no cookies). (FR-COMPARE-01..03.)

## What Changes

- A keyless `/api/forecast` Route Handler (server-side Open-Meteo proxy via the
  existing `fetchForecast`/`mapForecast`) so the client compare view can fetch
  each pinned city's forecast (TC-DATA-01).
- A pure `weekendDays(days)` helper extracting each city's upcoming Saturday and
  Sunday by its LOCAL calendar date (reusing `ukWeekday`).
- A client weekend-compare feature: a pin chip row above the forecast (pin/unpin,
  3-city limit with a calm inline message), a "Compare weekend" toggle, a
  3-column table (sticky header + "make active" per column), an empty state, and
  per-column fetch failure → calm message + retry.

## Impact

- Affected specs: weekend-compare (ADDED).
- Affected code: `app/api/forecast/route.ts`, `lib/weather/weekend.ts`
  (`weekendDays`), `components/compare/*` (PinBar, CompareView, CompareTable),
  location-view wiring in `app/page.tsx`, i18n keys.
- Dependencies: add-app-shell (location state), add-city-search (pin the active
  city), add-forecast (`fetchForecast`/`mapForecast`, day shape),
  add-comfort-score (`comfortScore`). Client-only state; no cookies (BC-PRIVACY-03).
