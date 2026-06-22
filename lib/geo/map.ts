// Pure, framework-free geocoding result mapper (TC-PURE-01, FR-SEARCH-02).
//
// Turns one raw Open-Meteo geocoding result into the deterministic domain
// `GeoSuggestion` shape. Optional fields (admin1, countryCode) are OMITTED —
// never set to an `undefined`-valued key — when the raw value is absent or
// blank, so the UI never renders "undefined", an empty separator, or a
// placeholder flag box (FR-SEARCH-02). `country` is always a string ("" when
// absent) so it can be shown as text without the flag. No next/react/DOM
// imports; deterministic and non-mutating.

/**
 * Raw shape as returned by the Open-Meteo geocoding API per result. Only the
 * fields the mapper reads are required; unknown extra fields are tolerated and
 * ignored.
 */
export interface RawGeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  /** ISO 3166-1 alpha-2, e.g. "UA". */
  country_code?: string;
  /** Administrative region, e.g. "Lviv Oblast". */
  admin1?: string;
  /** Tolerate unknown extra fields (id, population, timezone, ...). */
  [key: string]: unknown;
}

/**
 * Deterministic domain shape. Optional fields are omitted when the raw value is
 * absent/blank, so no "undefined" or empty separator ever renders.
 */
export interface GeoSuggestion {
  name: string;
  admin1?: string;
  /** Always a string; "" when the raw country is absent. */
  country: string;
  /** Present only when a non-blank ISO 3166-1 alpha-2 code exists. */
  countryCode?: string;
  /** From raw `latitude`. */
  lat: number;
  /** From raw `longitude`. */
  lon: number;
}

/** Return the trimmed string when it carries content, otherwise `undefined`. */
function nonBlank(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Map a raw Open-Meteo geocoding result to the domain `GeoSuggestion`. Pure and
 * deterministic; does not mutate `raw`.
 */
export function toSuggestion(raw: RawGeocodeResult): GeoSuggestion {
  const suggestion: GeoSuggestion = {
    name: raw.name,
    country: typeof raw.country === "string" ? raw.country : "",
    lat: raw.latitude,
    lon: raw.longitude,
  };

  const admin1 = nonBlank(raw.admin1);
  if (admin1 !== undefined) suggestion.admin1 = admin1;

  const countryCode = nonBlank(raw.country_code);
  if (countryCode !== undefined) suggestion.countryCode = countryCode;

  return suggestion;
}
