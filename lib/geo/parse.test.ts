// @trace FR-SEARCH-01, FR-SEARCH-05
//
// Test-first (RED): written BEFORE `lib/geo/parse.ts` exists. These tests define
// the contract for the pure, framework-free `parseGeocodeResponse(json)` mapper
// that turns a raw Open-Meteo geocoding response into a `GeoSuggestion[]`
// (FR-SEARCH-01). It is TOLERANT: an omitted/empty `results` array yields []
// (zero results, no throw) so the UI can render the inline "Nothing found" state
// instead of crashing (FR-SEARCH-05). They MUST fail today (module not found /
// missing export), then drive the implementation to green.
//
// Per tasks.md §2.3: maps a results array; omitted/empty `results` → [] (zero
// results, no throw).
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./parse` (re-exported by `lib/geo/index.ts`):
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, DOM globals.
//   // Tolerant total function: accepts the parsed JSON body of an Open-Meteo
//   // geocoding response (shape `{ results?: RawGeocodeResult[] }`), or anything
//   // malformed, and returns a domain GeoSuggestion[]. Missing/empty/non-array
//   // `results` → []. Each element is mapped via `toSuggestion`. Entries that are
//   // not usable objects are skipped (never throws, never yields a partial NaN
//   // suggestion that would crash the list render).
//   export function parseGeocodeResponse(json: unknown): GeoSuggestion[]
//
// (`GeoSuggestion` and `toSuggestion` are defined in `./map`.)
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { parseGeocodeResponse } from "./parse";

describe("parseGeocodeResponse — maps a results array (FR-SEARCH-01)", () => {
  it("maps a single result to a one-element GeoSuggestion array", () => {
    const json = {
      results: [
        {
          name: "Kyiv",
          admin1: "Kyiv City",
          country: "Ukraine",
          country_code: "UA",
          latitude: 50.45,
          longitude: 30.52,
        },
      ],
    };

    expect(parseGeocodeResponse(json)).toEqual([
      {
        name: "Kyiv",
        admin1: "Kyiv City",
        country: "Ukraine",
        countryCode: "UA",
        lat: 50.45,
        lon: 30.52,
      },
    ]);
  });

  it("maps several results preserving Open-Meteo order", () => {
    const json = {
      results: [
        { name: "Lviv", country: "Ukraine", country_code: "UA", latitude: 49.84, longitude: 24.03 },
        { name: "Lyon", country: "France", country_code: "FR", latitude: 45.75, longitude: 4.85 },
        { name: "Liverpool", country: "United Kingdom", country_code: "GB", latitude: 53.41, longitude: -2.98 },
      ],
    };

    const result = parseGeocodeResponse(json);

    expect(result).toHaveLength(3);
    expect(result.map((s) => s.name)).toEqual(["Lviv", "Lyon", "Liverpool"]);
    expect(result.map((s) => s.countryCode)).toEqual(["UA", "FR", "GB"]);
  });

  it("degrades each element gracefully (missing admin1/country_code omitted)", () => {
    const json = {
      results: [
        { name: "Open Sea", latitude: 0, longitude: 0 },
      ],
    };

    const [only] = parseGeocodeResponse(json);

    expect(only).toEqual({ name: "Open Sea", country: "", lat: 0, lon: 0 });
    expect(only).not.toHaveProperty("admin1");
    expect(only).not.toHaveProperty("countryCode");
  });
});

describe("parseGeocodeResponse — zero results never throw (FR-SEARCH-05)", () => {
  it("returns [] when `results` is omitted (Open-Meteo zero-result body)", () => {
    // Open-Meteo returns `{ generationtime_ms: ... }` with NO `results` key when
    // nothing matches — this is the common zero-result case, not an error.
    expect(parseGeocodeResponse({ generationtime_ms: 0.12 })).toEqual([]);
  });

  it("returns [] for an empty results array", () => {
    expect(parseGeocodeResponse({ results: [] })).toEqual([]);
  });

  it("returns [] for an empty object", () => {
    expect(parseGeocodeResponse({})).toEqual([]);
  });
});

describe("parseGeocodeResponse — malformed input is tolerated (FR-SEARCH-05)", () => {
  it("returns [] for null", () => {
    expect(parseGeocodeResponse(null)).toEqual([]);
  });

  it("returns [] for undefined", () => {
    expect(parseGeocodeResponse(undefined)).toEqual([]);
  });

  it("returns [] when `results` is not an array", () => {
    expect(parseGeocodeResponse({ results: "nope" })).toEqual([]);
    expect(parseGeocodeResponse({ results: 42 })).toEqual([]);
    expect(parseGeocodeResponse({ results: { name: "not-an-array" } })).toEqual([]);
  });

  it("returns [] for primitive (non-object) input", () => {
    expect(parseGeocodeResponse("string")).toEqual([]);
    expect(parseGeocodeResponse(123)).toEqual([]);
    expect(parseGeocodeResponse(true)).toEqual([]);
  });

  it("never throws across a spread of malformed bodies", () => {
    for (const bad of [null, undefined, 0, "", [], NaN, { results: null }, { results: [null] }]) {
      expect(() => parseGeocodeResponse(bad)).not.toThrow();
    }
  });

  it("skips non-object entries inside the results array (no partial NaN suggestion)", () => {
    const json = {
      results: [
        null,
        "garbage",
        { name: "Kyiv", country: "Ukraine", country_code: "UA", latitude: 50.45, longitude: 30.52 },
      ],
    };

    const result = parseGeocodeResponse(json);

    // Only the one usable object survives; the junk entries are dropped, not
    // turned into NaN-coordinate suggestions that would break the list.
    expect(result).toEqual([
      { name: "Kyiv", country: "Ukraine", countryCode: "UA", lat: 50.45, lon: 30.52 },
    ]);
  });
});

describe("parseGeocodeResponse — purity & determinism (FR-SEARCH-01, TC-PURE-01)", () => {
  it("is deterministic — identical input yields a deep-equal array", () => {
    const json = {
      results: [
        { name: "Kyiv", country: "Ukraine", country_code: "UA", latitude: 50.45, longitude: 30.52 },
      ],
    };

    expect(parseGeocodeResponse(json)).toEqual(parseGeocodeResponse(json));
  });

  it("always returns an array, never undefined or null", () => {
    expect(Array.isArray(parseGeocodeResponse({ results: [] }))).toBe(true);
    expect(Array.isArray(parseGeocodeResponse(null))).toBe(true);
    expect(Array.isArray(parseGeocodeResponse(undefined))).toBe(true);
  });
});
