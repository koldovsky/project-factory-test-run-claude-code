// Keyless per-city forecast route handler for the weekend compare table
// (FR-COMPARE-02, TC-DATA-01, NFR-COST-01, NFR-OBS-01).
//
// The compare view is client-side (interactive pin/toggle), but Open-Meteo must
// be called server-side (TC-DATA-01). The client fetches `/api/forecast?lat&lon`
// once per pinned city; this handler validates the coordinates, calls the shared
// `fetchForecast` (keyless), and returns the mapped `Forecast` JSON. Every
// non-happy outcome — missing/non-numeric/out-of-range coords, upstream or
// network failure, empty/malformed body — degrades to a calm non-2xx JSON body
// the client surfaces as that column's inline message + retry. Never throws a
// raw 500; no driver internals leak.

import { fetchForecast, type Forecast } from "@/lib/weather";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

/** Consistent calm error shape across every failure branch. */
interface ForecastResponseBody {
  forecast: Forecast | null;
  error?: string;
}

/**
 * Tolerant coordinate parse: accepts trailing zeros and surrounding whitespace;
 * rejects blank, non-numeric, and "NaN"/"Infinity". Returns null otherwise.
 */
function parseCoordinate(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function calmError(reason: string, status: number): Response {
  return Response.json(
    { forecast: null, error: reason } satisfies ForecastResponseBody,
    { status },
  );
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  const lat = parseCoordinate(url.searchParams.get("lat"));
  const lon = parseCoordinate(url.searchParams.get("lon"));

  // Invalid / out-of-range coordinates never reach the network (400, not 500).
  if (lat === null || !inRange(lat, LAT_MIN, LAT_MAX)) {
    return calmError("lat-invalid", 400);
  }
  if (lon === null || !inRange(lon, LON_MIN, LON_MAX)) {
    return calmError("lon-invalid", 400);
  }

  // `fetchForecast` already catches network/non-2xx/malformed and never throws.
  const result = await fetchForecast(lat, lon);
  if (!result.ok) {
    return calmError(result.reason, 502);
  }

  return Response.json({
    forecast: result.forecast,
  } satisfies ForecastResponseBody);
}
