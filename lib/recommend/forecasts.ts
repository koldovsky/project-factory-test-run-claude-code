// Batch forecast fetch for the recommendation brain (docs/day-03-skills-demo.md).
//
// WHY THIS EXISTS: scoring 22 cities by firing 22 concurrent single-city
// requests intermittently rate-limits / times out on Open-Meteo (observed
// 11–22 successes out of 22). Open-Meteo accepts MANY coordinates in ONE request
// (comma-separated latitude/longitude → a JSON array of per-location bodies), so
// one call is both faster and reliable.
//
// It still reuses the app's real parser — `mapForecast` maps each array element
// exactly as the single-city path does. Only the URL is new (multi-coordinate),
// kept deliberately in sync with `lib/weather/fetchForecast`.
//
// Framework-free except `fetch`; never throws (every failure → typed result).

import { mapForecast, type MapForecastResult } from "../weather/map";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

// Mirrors lib/weather/fetchForecast DAILY_FIELDS — keep in sync.
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
const FETCH_TIMEOUT_MS = 10000;

export interface Coord {
  lat: number;
  lon: number;
}

/** Build the keyless multi-coordinate Open-Meteo URL (exported for assertions). */
export function buildBatchUrl(coords: Coord[]): string {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("latitude", coords.map((c) => c.lat).join(","));
  url.searchParams.set("longitude", coords.map((c) => c.lon).join(","));
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("hourly", "temperature_2m");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("forecast_hours", String(FORECAST_HOURS));
  url.searchParams.set("timezone", "auto");
  return url.toString();
}

/**
 * Fetch forecasts for many coordinates in a SINGLE request. Returns one
 * index-aligned result per input coordinate; a failed request yields an
 * all-failed array (the caller skips those cities). Never throws.
 */
export async function fetchForecasts(coords: Coord[]): Promise<MapForecastResult[]> {
  if (coords.length === 0) return [];
  try {
    const res = await fetch(buildBatchUrl(coords), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return coords.map(() => ({ ok: false, reason: "upstream" }));
    const json: unknown = await res.json();
    // Multi-coordinate → array; a single coordinate would be a bare object.
    const arr = Array.isArray(json) ? json : [json];
    return coords.map((_, i) => mapForecast(arr[i]));
  } catch {
    return coords.map(() => ({ ok: false, reason: "network" }));
  }
}
