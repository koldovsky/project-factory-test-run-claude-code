# Design — add-forecast

## Goals / Non-goals

- **Goals:** server-side keyless 7-day + 48-h fetch; pure total mappers; 7 day
  cards (UA weekday, hi/lo °C, weather-code icon, precip %, wind, comfort badge);
  lazy Recharts hourly chart; sunrise/sunset; re-fetch on location change with a
  request-scoped cache; every failure → calm inline state.
- **Non-goals:** marine/aviation/agriculture variables; historical analysis;
  client-side Open-Meteo calls.

## Key decisions

1. **Server fetch from `app/page.tsx` (Server Component).** The active location
   comes from the validated URL (`lib/location`). `lib/weather/fetchForecast(lat,lon)`
   builds the Open-Meteo URL (daily + `forecast_hours=48` hourly, `timezone=auto`,
   °C) server-side — never in the client bundle (TC-DATA-01). Field names per
   `docs/open-meteo-reference.md` (`weather_code`, `apparent_temperature_max`,
   `precipitation_probability_max`, `wind_speed_10m_max`, `cloud_cover_mean`,
   `uv_index_max`, `sunrise`/`sunset`, hourly `temperature_2m`).
2. **Request-scoped cache, NOT process-wide.** Wrap the fetch in React `cache()`
   so repeated reads of the same coordinates within one render pass reuse the
   result, and a location change (new coords / new render) fetches fresh. This
   satisfies the spec's "keyed by coordinates, scoped to the request/render, never
   shared across readers" rule. (No module-level mutable map.)
3. **Pure total mappers `lib/weather`.** `mapForecast(json)` → discriminated
   `{ ok: true, forecast } | { ok: false, reason }`. Returns `ok:false` for empty
   `daily`, missing hourly temps, null sunrise/sunset, or malformed/unparseable
   input — never throws. Helpers: `weatherCodeToCondition(code)` (→ icon key +
   Ukrainian condition name), `ukWeekday(localDateStr)` (from the location-local
   `daily.time` string, never `toISOString().slice`). Partial-but-usable (≥1
   well-formed day + usable hourly) maps to available data.
4. **Coordinate validation before fetch.** Reuse `lib/location` range checks;
   invalid/out-of-range/NaN (incl. malformed deep links) → calm inline state, no
   fetch issued.
5. **Hourly chart is a lazily-loaded client component.** `HourlyChart` is
   `"use client"`; imported via `dynamic(() => import('./HourlyChart'), { ssr:false })`
   from a small client wrapper so Recharts stays out of the initial/empty-state
   bundle (NFR-PERF-03). Day cards + sun times render server-side. Chart region
   has a Ukrainian accessible name.
6. **Comfort integration.** Each `DayCard` shows `ComfortBadge` for that day
   (built from the day's apparent temp/precip/wind/cloud/uv via `comfortScore`);
   the weekend highlight uses `weekendComfort` over the mapped days.

## Data model (pure)

`DailyForecast { date; hiC; loC; feelsLikeMaxC; weatherCode; precipProbability;
windKmh; cloudCover; uvIndex }`; `Forecast { days: DailyForecast[]; hourly:
{ time: string[]; tempC: number[] }; sunrise; sunset; timezone }`;
`mapForecast(json): { ok:true; forecast } | { ok:false; reason }`.

## Error handling

All non-happy outcomes (network, non-2xx, 200-but-empty/incomplete, null
sun times, malformed body, invalid coords) → the same calm inline `ForecastError`
(Ukrainian, no "!") with an accessible retry control. Console stays silent
(NFR-OBS-01).

## Risks & mitigations

- **Recharts bundle weight:** dynamic import + `ssr:false` from a client wrapper
  (the Next 16 gotcha — never from a Server Component).
- **Local-date correctness:** weekday/sunrise/weekend from `timezone=auto`
  location-local strings, never UTC slice or visitor clock.
- **Cache scoping:** `cache()` is request-scoped by design — verified by the
  spec's "not process-wide" scenario (no shared mutable map in the code).
