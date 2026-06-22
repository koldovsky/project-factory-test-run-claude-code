# Integrations

Every third-party dependency is **keyless and free** (NFR-COST-01,
[ADR-0001](../adr/ADR-0001-stack.md)). There are exactly two data providers —
Open-Meteo and OpenStreetMap — and **no other third parties**: no analytics, no
trackers, no fonts-with-tracking, no cookies (BC-PRIVACY-01/02/03). See also
[architecture](./architecture.md) · [data-model](./data-model.md).

## Open-Meteo (weather + geocoding)

Keyless, free-tier; the only weather provider (TC-STACK-03). All calls happen
server-side — from Server Components or Route Handlers (TC-DATA-01) — so no
Open-Meteo URL is shipped in the client bundle and no key-like parameter ever
exists. Canonical request/response detail:
[open-meteo-reference](../open-meteo-reference.md).

### Forecast API

- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Called by `lib/weather/fetchForecast.ts` (server) and the
  `app/api/forecast/route.ts` handler (for the compare view, FR-COMPARE-02).
- Request scope (the in-scope variables only — no marine/aviation/agriculture,
  no historical range): `daily=temperature_2m_max,temperature_2m_min,`
  `apparent_temperature_max,weather_code,precipitation_probability_max,`
  `wind_speed_10m_max,cloud_cover_mean,uv_index_max,sunrise,sunset`,
  `hourly=temperature_2m`, `forecast_days=7`, `forecast_hours=48`,
  `timezone=auto`. `timezone=auto` returns location-local timestamps, required so
  weekend/sunrise math is location-local (FR-COMFORT-05, FR-ANIM-02).
- °C is the default and is kept (no °F toggle in MVP).

### Geocoding API (forward only)

- Endpoint: `https://geocoding-api.open-meteo.com/v1/search`
- Called by `app/api/geocode/route.ts` (server proxy) → `lib/geo/parse.ts`.
- Request: `name=<q>`, `count=10`, `language=uk` (Ukrainian labels),
  `format=json`. The handler trims `q`, caps length at 200 chars, and treats an
  empty query as "no search" (no upstream call).
- **No reverse-geocoding endpoint exists.** Map clicks set the location by
  coordinates ([ADR-0004](../adr/ADR-0004-map-click-coordinate-label.md)).

### Error handling

Honest under failure — no external call produces a generic 500 or a silent blank
(NFR-OBS-01, R-01). Every path degrades to a calm inline state:

| Layer | Behavior |
|---|---|
| `fetchForecast` | Validates coordinates before any request; out-of-range/NaN → `{ ok:false, reason:"lat-invalid"/"lon-invalid" }`; non-2xx → `"upstream"`; network/invalid JSON → `"network"`. Never throws. |
| `/api/forecast` | Invalid/out-of-range coords → `400` calm JSON; upstream/network → `502` calm JSON `{ forecast:null, error }`. No driver internals leak. |
| `/api/geocode` | Empty query → `{ suggestions: [] }` (no upstream call); non-2xx → `502 { suggestions:[], error:"upstream" }`; network/invalid JSON → `502 ... "network"`. |
| Zero geocoding results | `results` key omitted by Open-Meteo → `lib/geo/parse.ts` returns `[]` → inline "Нічого не знайдено", no toast (FR-SEARCH-05). |
| UI | `ForecastError`, `Notice`, and per-column compare/search/map inline messages with retry. Graded by the `error-clarity` eval dimension (100; `eval-forecast-error-copy-tone`, [eval-report](../qa/eval-report.md)). |

Coverage: `tests/integration/api-geocode.test.ts` (9),
`tests/integration/api-forecast.test.ts` (18), `lib/weather/map.test.ts` (19),
`lib/geo/parse.test.ts` (14).

## OpenStreetMap (map tiles)

Leaflet + react-leaflet rendering OSM raster tiles only (TC-STACK-04). The map is
client-only (`dynamic({ ssr:false })`, FR-MAP-05; see
[architecture](./architecture.md)).

- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (HTTPS).
- **OSM Tile Usage Policy (TC-MAP-01):** HTTPS, valid attribution, no bulk
  scraping. The app shows "© OpenStreetMap contributors" attribution bottom-right
  at all times (`MapView.tsx`, FR-MAP-04), uses city-level zoom (~z10) with a
  single marker, and issues tile requests only for the viewed area — no scraping.
  Risk and mitigation tracked as R-03.

## No other third parties

- **No analytics / trackers / fingerprinting** (BC-PRIVACY-01) — no such library
  is in `package.json`.
- **No cookies** set by application code (BC-PRIVACY-03).
- **Geolocation** only via the explicit "Моє місцезнаходження" button, never on
  load, silent fallback on denial (FR-SEARCH-06, BC-PRIVACY-02).
- **Footer credits** Open-Meteo and OpenStreetMap with hyperlinks (BC-BRAND-02,
  `components/shell/Footer.tsx`).
- Fonts are self-hosted via `next/font` (Geist), no external font request.
- The runtime needs **zero environment variables**; `.env.example` documents only
  optional public Open-Meteo base-URL overrides for self-hosting
  ([operations](./operations.md)).
