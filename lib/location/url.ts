// Pure deep-link parser/serializer for the active location (TC-PURE-01).
//
// Backs the empty-state-vs-location routing decision (FR-SHELL-03): a complete,
// in-range `?lat&lon&name` becomes the active location; anything missing,
// non-numeric, or out of range falls back to the empty state. No react/next/DOM
// imports — `URLSearchParams` is a standard runtime global, not a framework API.

import type { ActiveLocation, ParseLocationResult } from "./types";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

/**
 * Tolerant numeric parser: accepts trailing zeros ("50.4500") and surrounding
 * whitespace; rejects blank, non-numeric, and "NaN"/"Infinity" input. Returns
 * `null` for anything that is not a finite decimal number.
 */
function parseCoordinate(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // Number("") is 0 and Number(" ") is 0 — guarded above. Number() also accepts
  // hex/exponent forms; coordinates only use plain decimals, so require the
  // string to look like a signed decimal number before trusting Number().
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value;
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Parse a plain record of query parameters (the shape Next.js App Router hands a
 * page, or `Object.fromEntries(new URLSearchParams(...))`) into an active
 * location. Reads exactly the `lat`, `lon`, and `name` keys; all three are
 * required.
 */
export function parseLocationParams(
  params: Record<string, string | undefined>,
): ParseLocationResult {
  const lat = parseCoordinate(params.lat);
  if (lat === null) return { ok: false, reason: "lat-invalid" };
  if (!inRange(lat, LAT_MIN, LAT_MAX)) return { ok: false, reason: "lat-range" };

  const lon = parseCoordinate(params.lon);
  if (lon === null) return { ok: false, reason: "lon-invalid" };
  if (!inRange(lon, LON_MIN, LON_MAX)) return { ok: false, reason: "lon-range" };

  const rawName = params.name;
  if (rawName === undefined) return { ok: false, reason: "name-missing" };
  const name = rawName.trim();
  if (name === "") return { ok: false, reason: "name-blank" };

  return { ok: true, location: { lat, lon, name } };
}

/**
 * Serialize a location to a query string (no leading "?") that round-trips back
 * through {@link parseLocationParams}. `URLSearchParams` handles encoding of
 * spaces and Ukrainian characters.
 */
export function toLocationQuery(location: ActiveLocation): string {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lon),
    name: location.name,
  });
  return params.toString();
}
