# Open-Meteo API reference (for lib/weather + lib/geo)

> Canonical request/response shapes verified against open-meteo.com (2026-06-21).
> Keyless and free-tier (NFR-COST-01). All calls from Server Components / Route
> Handlers where possible (TC-DATA-01). This is dynamic-layer reference: read it
> when working in the forecast/map/search domains.

## Forecast API

Base: `https://api.open-meteo.com/v1/forecast`

Example (7-day daily + 48h hourly, location-local times):

```
https://api.open-meteo.com/v1/forecast
  ?latitude=50.45&longitude=30.52
  &daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,weather_code,precipitation_probability_max,wind_speed_10m_max,cloud_cover_mean,uv_index_max,sunrise,sunset
  &hourly=temperature_2m
  &forecast_days=7
  &forecast_hours=48
  &timezone=auto
```

Key parameter/field names (modern snake_case — NOT the legacy `weathercode`):

- Daily array fields (under `daily`, parallel to `daily.time` `YYYY-MM-DD`):
  `temperature_2m_max`, `temperature_2m_min`, `apparent_temperature_max`
  (feels-like, FR-COMFORT-02), `weather_code` (WMO code → icon, FR-FORECAST-02),
  `precipitation_probability_max` (%), `wind_speed_10m_max`, `cloud_cover_mean`
  (%, FR-COMFORT-02), `uv_index_max` (FR-COMFORT-02), `sunrise`/`sunset`
  (`YYYY-MM-DDTHH:mm`, location-local with `timezone=auto`, FR-FORECAST-04, FR-ANIM-02).
- Hourly (under `hourly`, parallel to `hourly.time` `YYYY-MM-DDTHH:mm`):
  `temperature_2m` (FR-FORECAST-03, plot next 48h).
- Units params: `temperature_unit` (default celsius — keep °C), `wind_speed_unit`
  (default kmh), `timezone=auto` (returns location-local timestamps — required so
  "today"/weekend/sunrise math is location-local, FR-COMFORT-05, FR-ANIM-02).

Response shape: `{ daily: { time: [], temperature_2m_max: [], ... }, daily_units: {}, hourly: { time: [], temperature_2m: [] }, hourly_units: {}, timezone, utc_offset_seconds, ... }`.

WMO `weather_code` groups (for icon + animated-bg particle type):
0 clear · 1-3 mainly clear/partly/overcast · 45,48 fog · 51-57 drizzle ·
61-67 rain · 71-77 snow · 80-82 rain showers · 85,86 snow showers ·
95 thunderstorm · 96,99 thunderstorm with hail.

## Geocoding API (forward only)

Base: `https://geocoding-api.open-meteo.com/v1/search`

Example: `...?name=Kyiv&count=10&language=uk&format=json`

- Params: `name` (>=2 chars exact, 3+ fuzzy), `count` (default 10), `language`
  (use `uk` for Ukrainian-localized names), `countryCode` (optional filter).
- Response: `{ results: [ { id, name, latitude, longitude, elevation, timezone,
  feature_code, country_code, country, admin1, admin2, population, ... } ] }`
  — `admin1` = region (FR-SEARCH-02); `country_code` → flag emoji (FR-SEARCH-02).
- **Zero results:** the `results` key is OMITTED (the body is `{}` / `generationtime_ms` only).
  `lib/geo` MUST treat a missing/empty `results` as zero results → inline
  "Nothing found" (FR-SEARCH-05), never throw.

## Reverse geocoding — NOT available from Open-Meteo

Open-Meteo has **no reverse-geocoding endpoint** (forward search only). This
contradicts FR-MAP-03's literal wording ("reverse-geocoded via Open-Meteo").
**Resolved at Checkpoint 2 (ADR-0004):** on map click, set the active location to
the clicked lat/lon and re-fetch the forecast (works fully from coordinates);
label the point by rounded coordinates (e.g. `50.45, 30.52`). No second provider
is added. The forecast/comfort/map/animated-bg all function from lat/lon; only
the human-readable city name is unavailable for arbitrary clicked points (named
cities still come from forward geocoding search). FR-MAP-03 and the `map` spec
were amended to match.
