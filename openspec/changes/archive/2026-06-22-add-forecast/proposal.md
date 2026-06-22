# Add forecast

## Why

The forecast turns the active location into a readable outlook: 7 day cards
(weekday, hi/lo, weather-code icon, precip %, wind, comfort badge), a 48-hour
hourly temperature chart, and today's sunrise/sunset. It fetches only from the
keyless Open-Meteo forecast API server-side, maps responses with pure total
`lib/weather` mappers, and degrades every failure to a calm inline state.
(FR-FORECAST-01..05; uses comfort-score for badges + weekend highlight.)

## What Changes

- `lib/weather`: pure, total Open-Meteo forecast mappers + domain types (never
  throw; typed failure/empty on empty/incomplete/malformed payloads).
- Server-side forecast fetch (request-scoped `cache()` keyed by coordinates — not
  a process-wide store) with coordinate validation before fetching.
- The location view renders: weekend comfort highlight (top), 7 day cards with
  `ComfortBadge`, a lazily-loaded Recharts 48-hour hourly chart, and
  sunrise/sunset caption — plus calm inline error+retry states.

## Impact

- Affected specs: forecast (ADDED).
- Affected code: `lib/weather/*`, the forecast fetch helper, `app/page.tsx`
  location view, `components/forecast/*` (DayCard, HourlyChart [client, dynamic],
  SunTimes, ForecastError), i18n keys.
- Dependencies: add-app-shell (active location), add-comfort-score (badge +
  weekend helpers), and consumes the URL location city-search/map set.
