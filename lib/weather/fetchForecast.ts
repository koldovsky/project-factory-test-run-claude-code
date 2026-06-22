// Server-side, keyless Open-Meteo forecast fetch + map (FR-FORECAST-01,
// FR-FORECAST-05, TC-DATA-01, TC-STACK-03, NFR-COST-01).
//
// `lib/` framework rule (TC-PURE-01 / AGENTS.md): this fetch wrapper may use the
// `fetch` global but imports NO `next/*`, `react`, or DOM. The request-scoped
// React `cache()` dedup lives OUTSIDE lib (a server module that wraps this), so
// this module stays purely about building the URL, calling Open-Meteo, and
// mapping the body. Coordinates are validated BEFORE any request is issued; an
// out-of-range / NaN coordinate yields a typed failure and never reaches the
// network (no key-like parameter ever exists — Open-Meteo is keyless).
//
// Bounds the scope to the in-scope variables only (no marine/aviation/agriculture
// and no historical range): 7 daily days + 48 hourly temperature, timezone=auto.

import { mapForecast, type MapForecastResult } from "./map";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

// Exactly the daily fields the day cards + comfort badge + sun times need.
const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "weather_code",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "cloud_cover_mean",
  "uv_index_max",
  "sunrise",
  "sunset",
].join(",");

const FORECAST_DAYS = 7;
const FORECAST_HOURS = 48;

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Build the keyless Open-Meteo forecast URL for the given coordinates, scoped to
 * the in-scope variables only. Exported so the request can be inspected/asserted
 * without issuing it.
 */
export function buildForecastUrl(lat: number, lon: number): string {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("hourly", "temperature_2m");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("forecast_hours", String(FORECAST_HOURS));
  url.searchParams.set("timezone", "auto");
  return url.toString();
}

/**
 * Fetch + map the forecast for valid coordinates. Validates coordinates first
 * (no request for out-of-range / NaN input), then issues a single keyless
 * Open-Meteo request and maps the body. Every non-happy outcome — invalid
 * coordinates, network error, non-2xx status, empty/incomplete/malformed body —
 * resolves to a typed `{ ok: false; reason }` so the caller routes it to the
 * calm inline state. Never throws.
 */
export async function fetchForecast(
  lat: number,
  lon: number,
): Promise<MapForecastResult> {
  if (!inRange(lat, LAT_MIN, LAT_MAX)) {
    return { ok: false, reason: "lat-invalid" };
  }
  if (!inRange(lon, LON_MIN, LON_MAX)) {
    return { ok: false, reason: "lon-invalid" };
  }

  try {
    const res = await fetch(buildForecastUrl(lat, lon), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, reason: "upstream" };

    const json: unknown = await res.json();
    return mapForecast(json);
  } catch {
    // Network failure / invalid JSON → typed failure; no driver internals leak.
    return { ok: false, reason: "network" };
  }
}
