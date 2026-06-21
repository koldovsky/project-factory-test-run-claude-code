// @trace FR-SHELL-03
//
// Test-first (RED): these tests are written BEFORE `lib/location/url.ts` exists.
// They define the contract for the pure deep-link parser/serializer that backs
// the empty-state-vs-location routing decision (FR-SHELL-03). They MUST fail
// today (module not found / missing exports), then drive the implementation.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./types`:
//   export interface ActiveLocation { lat: number; lon: number; name: string }
//   export type ParseLocationResult =
//     | { ok: true; location: ActiveLocation }
//     | { ok: false; reason: string }
//
// From `./url`:
//   // INPUT SHAPE DECISION: parseLocationParams accepts a plain record of
//   // `string | undefined` keyed by param name — i.e. the shape you get from
//   // `Object.fromEntries(new URLSearchParams(...))` or Next.js
//   // `searchParams`. Chosen over a raw URLSearchParams because the App Router
//   // hands pages a record, and a record is trivially constructed in tests.
//   // The implementer reads exactly the `lat`, `lon`, `name` keys.
//   export function parseLocationParams(
//     params: Record<string, string | undefined>,
//   ): ParseLocationResult
//
//   // Serializes a location back to a URLSearchParams query string (no leading
//   // "?"), suitable for round-tripping through parseLocationParams.
//   export function toLocationQuery(location: ActiveLocation): string
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { parseLocationParams, toLocationQuery } from "./url";

describe("parseLocationParams — valid deep links", () => {
  it("parses a complete, in-range deep link to ok:true with numeric coords", () => {
    const result = parseLocationParams({ lat: "50.45", lon: "30.52", name: "Kyiv" });

    expect(result).toEqual({
      ok: true,
      location: { lat: 50.45, lon: 30.52, name: "Kyiv" },
    });
  });

  it("trims surrounding whitespace from the name", () => {
    const result = parseLocationParams({ lat: "50.45", lon: "30.52", name: "  Kyiv  " });

    expect(result.ok).toBe(true);
    // Discriminated-union narrowing: only read .location when ok.
    if (result.ok) {
      expect(result.location.name).toBe("Kyiv");
    }
  });

  it("accepts numeric strings with trailing zeros and parses them as numbers", () => {
    const result = parseLocationParams({ lat: "50.4500", lon: "30.5200", name: "Kyiv" });

    expect(result).toEqual({
      ok: true,
      location: { lat: 50.45, lon: 30.52, name: "Kyiv" },
    });
  });

  it("accepts boundary coordinates (lat ±90, lon ±180)", () => {
    expect(parseLocationParams({ lat: "90", lon: "180", name: "Pole" }).ok).toBe(true);
    expect(parseLocationParams({ lat: "-90", lon: "-180", name: "Antipode" }).ok).toBe(true);
  });

  it("accepts zero coordinates (Null Island)", () => {
    const result = parseLocationParams({ lat: "0", lon: "0", name: "Null Island" });

    expect(result).toEqual({
      ok: true,
      location: { lat: 0, lon: 0, name: "Null Island" },
    });
  });
});

describe("parseLocationParams — incomplete deep links fall back to empty state", () => {
  it("returns ok:false when lat is missing", () => {
    expect(parseLocationParams({ lon: "30.52", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false when lon is missing", () => {
    expect(parseLocationParams({ lat: "50.45", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false when name is missing", () => {
    expect(parseLocationParams({ lat: "50.45", lon: "30.52" }).ok).toBe(false);
  });

  it("returns ok:false for an entirely empty param set (first load)", () => {
    expect(parseLocationParams({}).ok).toBe(false);
  });

  it("returns ok:false when name is present but blank/whitespace-only", () => {
    expect(parseLocationParams({ lat: "50.45", lon: "30.52", name: "   " }).ok).toBe(false);
  });
});

describe("parseLocationParams — invalid coordinates fall back to empty state", () => {
  it("returns ok:false for a non-numeric lat", () => {
    expect(parseLocationParams({ lat: "abc", lon: "30.52", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for a non-numeric lon", () => {
    expect(parseLocationParams({ lat: "50.45", lon: "xyz", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for a blank lat string", () => {
    expect(parseLocationParams({ lat: "", lon: "30.52", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for NaN-producing input", () => {
    expect(parseLocationParams({ lat: "NaN", lon: "30.52", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for a lat above the valid range", () => {
    expect(parseLocationParams({ lat: "999", lon: "30.52", name: "Kyiv" }).ok).toBe(false);
    expect(parseLocationParams({ lat: "90.0001", lon: "30.52", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for a lat below the valid range", () => {
    expect(parseLocationParams({ lat: "-91", lon: "30.52", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for a lon above the valid range", () => {
    expect(parseLocationParams({ lat: "50.45", lon: "181", name: "Kyiv" }).ok).toBe(false);
    expect(parseLocationParams({ lat: "50.45", lon: "180.0001", name: "Kyiv" }).ok).toBe(false);
  });

  it("returns ok:false for a lon below the valid range", () => {
    expect(parseLocationParams({ lat: "50.45", lon: "-200", name: "Kyiv" }).ok).toBe(false);
  });
});

describe("toLocationQuery — serialize and round-trip", () => {
  it("produces a query string that round-trips back to the same location", () => {
    const location = { lat: 50.45, lon: 30.52, name: "Kyiv" };

    const query = toLocationQuery(location);
    const roundTripped = parseLocationParams(
      Object.fromEntries(new URLSearchParams(query)),
    );

    expect(roundTripped).toEqual({ ok: true, location });
  });

  it("does not emit a leading question mark", () => {
    const query = toLocationQuery({ lat: 50.45, lon: 30.52, name: "Kyiv" });

    expect(query.startsWith("?")).toBe(false);
  });

  it("encodes the lat, lon, and name parameters", () => {
    const query = toLocationQuery({ lat: 50.45, lon: 30.52, name: "Kyiv" });
    const params = new URLSearchParams(query);

    expect(params.get("lat")).toBe("50.45");
    expect(params.get("lon")).toBe("30.52");
    expect(params.get("name")).toBe("Kyiv");
  });

  it("round-trips names containing spaces and Ukrainian characters", () => {
    const location = { lat: 49.84, lon: 24.03, name: "Львів" };

    const roundTripped = parseLocationParams(
      Object.fromEntries(new URLSearchParams(toLocationQuery(location))),
    );

    expect(roundTripped).toEqual({ ok: true, location });
  });

  // Regression (review-gate): parseLocationParams trims the name, so the
  // serializer must trim too, or a padded name fails the documented round-trip.
  it("trims a padded name so it round-trips to the trimmed value", () => {
    const query = toLocationQuery({ lat: 49.84, lon: 24.03, name: "  Львів  " });

    expect(
      parseLocationParams(Object.fromEntries(new URLSearchParams(query))),
    ).toEqual({ ok: true, location: { lat: 49.84, lon: 24.03, name: "Львів" } });
  });

  // Regression (review-gate): String(1e-7) === "1e-7" (exponential) which the
  // coordinate parser rejects, so small-magnitude coordinates near the equator /
  // prime meridian must still round-trip. The map slice stores raw clicked
  // coordinates (ADR-0004), so this path goes live there.
  it("round-trips small-magnitude coordinates without exponential notation", () => {
    for (const location of [
      { lat: 0.0000001, lon: 30.52, name: "Near equator" },
      { lat: 50.45, lon: -0.0000005, name: "Near prime meridian" },
      { lat: 0.0000001, lon: -0.0000005, name: "Near Null Island" },
    ]) {
      const query = toLocationQuery(location);
      const params = new URLSearchParams(query);
      // The serialized coordinate values must not use exponential notation
      // (checked on lat/lon only — the name may legitimately contain "e").
      expect(params.get("lat")).not.toMatch(/[eE]/);
      expect(params.get("lon")).not.toMatch(/[eE]/);
      expect(
        parseLocationParams(Object.fromEntries(params)),
      ).toEqual({ ok: true, location });
    }
  });
});
