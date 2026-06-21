// Pure, framework-free geocoding-response parser (TC-PURE-01, FR-SEARCH-01,
// FR-SEARCH-05).
//
// Tolerant total function over the parsed JSON body of an Open-Meteo geocoding
// response (shape `{ results?: RawGeocodeResult[] }`), or anything malformed.
// Missing/empty/non-array `results` -> [] (the common zero-result case, not an
// error — the UI renders the inline "Nothing found" state). null/undefined or
// primitive input -> []. Each usable object entry is mapped via `toSuggestion`,
// in Open-Meteo order; non-object entries are skipped (never a partial NaN
// suggestion that would crash the list render). Never throws; always returns an
// array. No next/react/DOM imports.

import { toSuggestion, type GeoSuggestion, type RawGeocodeResult } from "./map";

/** True for a non-null, non-array object — a usable geocoding result entry. */
function isResultObject(value: unknown): value is RawGeocodeResult {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse an Open-Meteo geocoding response body into a domain `GeoSuggestion[]`.
 * Tolerant of any malformed input; always returns an array.
 */
export function parseGeocodeResponse(json: unknown): GeoSuggestion[] {
  if (!isResultObject(json)) return [];

  const { results } = json as { results?: unknown };
  if (!Array.isArray(results)) return [];

  const suggestions: GeoSuggestion[] = [];
  for (const entry of results) {
    if (!isResultObject(entry)) continue;
    suggestions.push(toSuggestion(entry));
  }

  return suggestions;
}
