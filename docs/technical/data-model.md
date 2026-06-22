# Data model

There is **no database** ([ADR-0001](../adr/ADR-0001-stack.md)): no tables, no
ORM, no migrations, no server-side persistence. This page documents the **pure
domain types** the app maps external responses into, the Open-Meteo response
shapes those types are derived from (canonical reference:
[open-meteo-reference](../open-meteo-reference.md)), and the **only persisted
state — the URL**. All types live in framework-free `lib/` (TC-PURE-01) and
carry inline notes mapping each domain field to its Open-Meteo source so the
mappers and the cards can never drift.

See also: [architecture](./architecture.md) · [integrations](./integrations.md).

## The only persisted state: the URL

The active location lives entirely in the query string `?lat&lon&name` — no
cookies, no `localStorage`, no server state (BC-PRIVACY-03). This makes every
view shareable and deep-linkable (FR-SEARCH-03), and means a reload reconstructs
state from the URL alone.

- `lib/location/url.ts` — `parseLocationParams` (URL → `ParseLocationResult`,
  range-validated) and `toLocationQuery` (location → query string). Round-trip
  unit-tested (`lib/location/url.test.ts`, 24 tests; `@trace FR-SHELL-03`).
- Pinned-compare cities are **client React state only** (`lib/compare/pins.ts`),
  never persisted (BC-PRIVACY-03).

## Domain types

### Active location (`lib/location/types.ts`)

```ts
interface ActiveLocation { lat: number; lon: number; name: string }
type ParseLocationResult =
  | { ok: true; location: ActiveLocation }
  | { ok: false; reason: string }   // reason is an internal diagnostic; UI copy comes from lib/i18n
```

Shared contract for every later slice (search, forecast, map, compare). Map-click
points are labeled by rounded coordinates rather than a city name
([ADR-0004](../adr/ADR-0004-map-click-coordinate-label.md);
`lib/location/coordinateLabel.ts`).

### Geocoding suggestion (`lib/geo/map.ts`)

```ts
interface RawGeocodeResult {   // subset of the Open-Meteo geocoding result we read
  name: string; latitude: number; longitude: number;
  country?: string; country_code?: string; admin1?: string; [k: string]: unknown
}
interface GeoSuggestion {
  name: string; admin1?: string; country: string;   // country always a string ("" when absent)
  countryCode?: string;                              // omitted when blank → no placeholder flag
  lat: number; lon: number
}
```

`toSuggestion` omits blank optional fields (never an `undefined`-valued key) so
the UI never renders "undefined" or an empty separator (FR-SEARCH-02). Country
code → flag emoji via `lib/geo/flag.ts`.

### Forecast (`lib/weather/types.ts`)

```ts
interface DailyForecast {
  date: string;                 // "YYYY-MM-DD" location-local (daily.time)
  hiC: number; loC: number;     // temperature_2m_max / _min
  weatherCode: number;          // weather_code (WMO)
  feelsLikeMaxC: number | null; // apparent_temperature_max
  precipProbability: number | null; // precipitation_probability_max (null beyond horizon)
  windKmh: number | null;       // wind_speed_10m_max
  cloudCover: number | null;    // cloud_cover_mean
  uvIndex: number | null;       // uv_index_max (null beyond horizon)
}
interface Forecast {
  days: DailyForecast[];                          // one per well-formed day, chronological
  hourly: { time: string[]; tempC: number[] };    // next 48h, parallel arrays
  sunrise: string; sunset: string;                // today, location-local "YYYY-MM-DDTHH:mm"
  timezone: string;                               // IANA name, e.g. "Europe/Kyiv"
}
```

A day renders as long as its core fields (date, hi/lo, weather code) are present;
the rest are `number | null` because Open-Meteo returns null for precip/UV beyond
their horizon (R-04). Missing values show a calm placeholder and `comfortScore`
falls back to neutral defaults — they never drop a day or fail the forecast.

### Comfort (`lib/scoring/comfort.ts`)

```ts
interface DailyComfortInput {  // all optional — the function is total
  feelsLikeC?: number; precipProbability?: number; windKmh?: number;
  cloudCover?: number; uvIndex?: number
}
interface ComfortResult { value: number; rationale: string } // 0..100 integer; UA sentence ≤80 chars, no "!"/emoji
```

Pure, total, never throws; weights sum to 1.0 (feels-like 0.4, precip 0.25, wind
0.2, uv 0.1, cloud 0.05). Band helper (`lib/scoring/band.ts`): green ≥70 /
yellow 40–69 / red <40 (FR-COMFORT-04). Weekend average over the location-local
upcoming Sat+Sun (`lib/scoring/weekend.ts`, `lib/weather/weekendDays.ts`,
FR-COMFORT-05).

### Sky scene (`lib/sky/types.ts`)

```ts
type Particle = "rain" | "snow" | "cloud" | "none";
interface ConditionScene { gradientKey: string; particle: Particle }   // before day/night
interface SkySceneInput { weatherCode?: number; sunrise?: string; sunset?: string; nowLocal?: string }
interface SkyScene { gradient: string; particle: Particle }            // fully resolved, day vs night
```

`sceneForWeatherCode` + `skyScene` are total: unknown/missing inputs resolve to
the neutral static gradient with no particles (fail-calm, FR-ANIM; NFR-OBS-01).

### Pins (`lib/compare/pins.ts`)

```ts
const MAX_PINS = 3;
interface PinResult { pins: ActiveLocation[]; atLimit: boolean }
```

Pure reducer: identity by lat/lon (name-independent), max 3, always a fresh array,
never mutates, never throws. `atLimit` flags a full-list rejection so the UI shows
the calm limit message (FR-COMPARE-01).

## Open-Meteo response shapes (source of the mappers)

Verified against open-meteo.com (2026-06-21); full detail in
[open-meteo-reference](../open-meteo-reference.md).

- **Forecast:** `{ daily: { time[], temperature_2m_max[], temperature_2m_min[],
  apparent_temperature_max[], weather_code[], precipitation_probability_max[],
  wind_speed_10m_max[], cloud_cover_mean[], uv_index_max[], sunrise[], sunset[] },
  hourly: { time[], temperature_2m[] }, timezone, utc_offset_seconds, ... }`.
  Modern snake_case (`weather_code`, not legacy `weathercode`); `timezone=auto`
  returns location-local timestamps so "today"/weekend/sunrise math is
  location-local (FR-COMFORT-05, FR-ANIM-02). Mapped by `lib/weather/map.ts`.
- **Geocoding (forward only):** `{ results: [ { name, latitude, longitude,
  country, country_code, admin1, ... } ] }`. **Zero results omit the `results`
  key** — `lib/geo/parse.ts` treats missing/empty `results` as zero results →
  inline "Nothing found" (FR-SEARCH-05), never a throw.
- **Reverse geocoding:** not provided by Open-Meteo. Map clicks set the location
  by coordinates and label by rounded coordinates
  ([ADR-0004](../adr/ADR-0004-map-click-coordinate-label.md)).
