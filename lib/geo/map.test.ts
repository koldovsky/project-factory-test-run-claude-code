// @trace FR-SEARCH-02
//
// Test-first (RED): written BEFORE `lib/geo/map.ts` exists. These tests define
// the contract for the pure, framework-free `toSuggestion(raw)` mapper that
// turns one raw Open-Meteo geocoding result into the deterministic domain
// `GeoSuggestion` shape (FR-SEARCH-02, TC-PURE-01, TC-DATA-01). They MUST fail
// today (module not found / missing exports), then drive the implementation to
// green. Never weaken these to pass — strengthen if they go green too easily.
//
// Per tasks.md §2.1: deterministic domain shape from a raw Open-Meteo result;
// missing admin1/country_code degrade (no "undefined", no empty separator).
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./map` (re-exported by `lib/geo/index.ts`):
//
//   // Raw shape as returned by the Open-Meteo geocoding API per result.
//   // Only the fields the mapper reads are required; extra fields are ignored.
//   export interface RawGeocodeResult {
//     name: string;
//     latitude: number;
//     longitude: number;
//     country?: string;
//     country_code?: string;   // ISO 3166-1 alpha-2, e.g. "UA"
//     admin1?: string;          // administrative region, e.g. "Lviv Oblast"
//     [key: string]: unknown;   // tolerate unknown extra fields
//   }
//
//   // Deterministic domain shape. Optional fields are OMITTED (not set to
//   // undefined-valued keys) when the raw value is absent/blank, so the UI never
//   // renders "undefined", an empty separator, or a placeholder flag box.
//   export interface GeoSuggestion {
//     name: string;
//     admin1?: string;
//     country: string;          // always a string; "" when raw country absent
//     countryCode?: string;     // present only when a non-blank code exists
//     lat: number;
//     lon: number;
//   }
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, DOM globals, no
//   // Math.random / Date.now. Deterministic: identical input ⇒ deep-equal output.
//   export function toSuggestion(raw: RawGeocodeResult): GeoSuggestion
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { toSuggestion } from "./map";

describe("toSuggestion — full result maps to the domain shape (FR-SEARCH-02)", () => {
  it("maps name, admin1, country, countryCode, lat, lon from a complete result", () => {
    const result = toSuggestion({
      name: "Lviv",
      admin1: "Lviv Oblast",
      country: "Ukraine",
      country_code: "UA",
      latitude: 49.84,
      longitude: 24.03,
    });

    expect(result).toEqual({
      name: "Lviv",
      admin1: "Lviv Oblast",
      country: "Ukraine",
      countryCode: "UA",
      lat: 49.84,
      lon: 24.03,
    });
  });

  it("renames latitude→lat and longitude→lon (domain uses short keys)", () => {
    const result = toSuggestion({
      name: "Kyiv",
      country: "Ukraine",
      country_code: "UA",
      latitude: 50.45,
      longitude: 30.52,
    });

    expect(result.lat).toBe(50.45);
    expect(result.lon).toBe(30.52);
    // The raw long keys must not leak into the domain shape.
    expect(result).not.toHaveProperty("latitude");
    expect(result).not.toHaveProperty("longitude");
  });

  it("ignores unknown extra fields on the raw result", () => {
    const result = toSuggestion({
      name: "Odesa",
      admin1: "Odesa Oblast",
      country: "Ukraine",
      country_code: "UA",
      latitude: 46.48,
      longitude: 30.73,
      id: 698740,
      population: 1010000,
      timezone: "Europe/Kyiv",
    });

    expect(result).toEqual({
      name: "Odesa",
      admin1: "Odesa Oblast",
      country: "Ukraine",
      countryCode: "UA",
      lat: 46.48,
      lon: 30.73,
    });
  });
});

describe("toSuggestion — missing fields degrade gracefully (FR-SEARCH-02)", () => {
  it("omits admin1 entirely when admin1 is absent (no undefined value, no empty key text)", () => {
    const result = toSuggestion({
      name: "Vatican City",
      country: "Vatican",
      country_code: "VA",
      latitude: 41.9,
      longitude: 12.45,
    });

    expect(result).not.toHaveProperty("admin1");
    expect(result.name).toBe("Vatican City");
    expect(result.country).toBe("Vatican");
  });

  it("omits admin1 when it is a blank/whitespace-only string", () => {
    const result = toSuggestion({
      name: "Somewhere",
      admin1: "   ",
      country: "Ukraine",
      country_code: "UA",
      latitude: 50,
      longitude: 30,
    });

    expect(result).not.toHaveProperty("admin1");
  });

  it("omits countryCode entirely when country_code is absent", () => {
    const result = toSuggestion({
      name: "Mystery Town",
      country: "Nowhereland",
      latitude: 10,
      longitude: 20,
    });

    expect(result).not.toHaveProperty("countryCode");
    // Country text must still be carried so the UI shows it without a flag.
    expect(result.country).toBe("Nowhereland");
  });

  it("omits countryCode when country_code is a blank/whitespace-only string", () => {
    const result = toSuggestion({
      name: "Mystery Town",
      country: "Nowhereland",
      country_code: "  ",
      latitude: 10,
      longitude: 20,
    });

    expect(result).not.toHaveProperty("countryCode");
  });

  it("yields country = '' (a string, never undefined) when country is absent", () => {
    const result = toSuggestion({
      name: "Open Sea",
      latitude: 0,
      longitude: 0,
    });

    // country is non-optional in the domain shape so the UI never stringifies
    // `undefined`; it degrades to an empty string the UI can treat as absent.
    expect(result.country).toBe("");
    expect(typeof result.country).toBe("string");
  });

  it("never produces the literal string 'undefined' anywhere in the suggestion", () => {
    const result = toSuggestion({
      name: "Edge",
      latitude: 1.5,
      longitude: 2.5,
    });

    for (const value of Object.values(result)) {
      expect(value).not.toBe("undefined");
    }
  });

  it("keeps the city name and coordinates with no admin1 and no countryCode", () => {
    const result = toSuggestion({
      name: "Lonely Rock",
      latitude: 12.5,
      longitude: -34.25,
    });

    expect(result).toEqual({
      name: "Lonely Rock",
      country: "",
      lat: 12.5,
      lon: -34.25,
    });
  });
});

describe("toSuggestion — purity & determinism (FR-SEARCH-02, TC-PURE-01)", () => {
  it("is deterministic — identical input yields a deep-equal result", () => {
    const raw = {
      name: "Kharkiv",
      admin1: "Kharkiv Oblast",
      country: "Ukraine",
      country_code: "UA",
      latitude: 49.99,
      longitude: 36.23,
    };

    expect(toSuggestion(raw)).toEqual(toSuggestion(raw));
  });

  it("does not mutate the raw input object", () => {
    const raw = {
      name: "Dnipro",
      admin1: "Dnipropetrovsk Oblast",
      country: "Ukraine",
      country_code: "UA",
      latitude: 48.46,
      longitude: 35.04,
    };
    const snapshot = JSON.stringify(raw);

    toSuggestion(raw);

    expect(JSON.stringify(raw)).toBe(snapshot);
  });

  it("preserves coordinate precision including trailing-zero-free numbers", () => {
    const result = toSuggestion({
      name: "Precise",
      country: "Ukraine",
      country_code: "UA",
      latitude: 49.8400001,
      longitude: 24.0299999,
    });

    expect(result.lat).toBe(49.8400001);
    expect(result.lon).toBe(24.0299999);
  });
});
