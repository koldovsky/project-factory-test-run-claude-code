// @trace FR-MAP-03
//
// Test-first (RED): these tests are written BEFORE `lib/location/coordinateLabel.ts`
// exists. They define the contract for the pure rounded-coordinate label that a
// map click stores as the active location's `name` (ADR-0004: no reverse
// geocoding, so a click labels its location by its own coordinates). They MUST
// fail today (module not found / missing export), then drive the implementation.
//
// Pure (TC-PURE-01): the module under test imports no react/next/DOM. This test
// runs under the Vitest `node` environment (vitest.config.ts default).
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./coordinateLabel`:
//   // Format a pair of coordinates as the calm, deterministic display name a
//   // map click stores for its location (FR-MAP-03, ADR-0004). Latitude first,
//   // then longitude, separated by a comma + single space: "lat, lon".
//   //
//   //   coordinateLabel(50.4501, 30.5234) === "50.45, 30.5234"   (~4 dp, trimmed)
//   //
//   // Rounds each coordinate to at most 4 decimal places and DROPS trailing
//   // zeros (so "50.45", not "50.4500"). Emits PLAIN decimal notation only —
//   // never exponential ("1e-7") — because the result is round-tripped through
//   // the deep-link serializer (`toLocationQuery` -> `parseLocationParams`),
//   // which rejects exponential strings. Sub-1e-4 magnitudes therefore collapse
//   // to "0". Total and pure: defined for every finite number, never throws.
//   export function coordinateLabel(lat: number, lon: number): string
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { coordinateLabel } from "./coordinateLabel";
import { parseLocationParams, toLocationQuery } from "./url";

describe("coordinateLabel — format and shape", () => {
  it('joins latitude then longitude with a comma and single space ("lat, lon")', () => {
    expect(coordinateLabel(50.45, 30.52)).toBe("50.45, 30.52");
  });

  it("matches the design's worked example", () => {
    // design.md / spec: a map click near Kyiv labels as "50.45, 30.52".
    expect(coordinateLabel(50.45, 30.52)).toBe("50.45, 30.52");
  });

  it("is deterministic — same inputs always produce the same string", () => {
    const a = coordinateLabel(49.8397, 24.0297);
    const b = coordinateLabel(49.8397, 24.0297);
    expect(a).toBe(b);
  });

  it("returns a plain string with exactly one comma separator", () => {
    const label = coordinateLabel(50.45, 30.52);
    expect(typeof label).toBe("string");
    expect(label.split(",")).toHaveLength(2);
  });
});

describe("coordinateLabel — rounding to ~4 dp, trailing zeros dropped", () => {
  it("rounds each coordinate to at most 4 decimal places", () => {
    expect(coordinateLabel(50.123456, 30.987654)).toBe("50.1235, 30.9877");
  });

  it("rounds half away from / to nearest at the 4th decimal place", () => {
    // 50.12345 -> 50.1235 (round to nearest at 4 dp; banker's rounding not used).
    expect(coordinateLabel(50.12345, 30.0)).toBe("50.1235, 30");
  });

  it("drops trailing zeros so a clean value is short", () => {
    expect(coordinateLabel(50.4500, 30.5200)).toBe("50.45, 30.52");
  });

  it("drops the decimal point entirely for whole-number coordinates", () => {
    expect(coordinateLabel(50, 30)).toBe("50, 30");
  });

  it("keeps fewer-than-4 decimals as-is without padding", () => {
    expect(coordinateLabel(50.4, 30.5)).toBe("50.4, 30.5");
  });
});

describe("coordinateLabel — negatives, zero, and boundaries", () => {
  it("preserves negative latitudes and longitudes (southern/western hemisphere)", () => {
    expect(coordinateLabel(-33.8688, -70.6693)).toBe("-33.8688, -70.6693");
  });

  it("handles a negative latitude with a positive longitude", () => {
    expect(coordinateLabel(-33.8688, 151.2093)).toBe("-33.8688, 151.2093");
  });

  it('labels Null Island (0, 0) as "0, 0" — no "-0", no exponential', () => {
    const label = coordinateLabel(0, 0);
    expect(label).toBe("0, 0");
    expect(label).not.toContain("-0");
    expect(label).not.toMatch(/[eE]/);
  });

  it('never emits a signed zero ("-0") after rounding a tiny negative to zero', () => {
    // -0.00001 rounds to 0 at 4 dp; must be "0", not "-0".
    expect(coordinateLabel(-0.00001, -0.00002)).toBe("0, 0");
  });

  it("labels the coordinate boundaries (±90 lat, ±180 lon)", () => {
    expect(coordinateLabel(90, 180)).toBe("90, 180");
    expect(coordinateLabel(-90, -180)).toBe("-90, -180");
  });
});

describe("coordinateLabel — sub-1e-6 and exponential-notation safety", () => {
  it("never produces exponential notation for sub-1e-6 magnitudes", () => {
    // String(0.0000001) === "1e-7"; the label must not leak that, because the
    // result is stored as the `name` query param and round-tripped.
    const label = coordinateLabel(0.0000001, -0.0000005);
    expect(label).not.toMatch(/[eE]/);
  });

  it('collapses sub-1e-4 magnitudes to "0" after 4-dp rounding', () => {
    expect(coordinateLabel(0.0000001, -0.0000005)).toBe("0, 0");
  });

  it("keeps the smallest representable 4-dp value (0.0001) in plain notation", () => {
    const label = coordinateLabel(0.0001, -0.0001);
    expect(label).not.toMatch(/[eE]/);
    expect(label).toBe("0.0001, -0.0001");
  });
});

describe("coordinateLabel — totality (never throws on any finite input)", () => {
  it("is defined for every finite coordinate pair across the valid range", () => {
    for (const lat of [-90, -45.5, -0.0001, 0, 0.0001, 45.5, 90]) {
      for (const lon of [-180, -90.25, 0, 90.25, 180]) {
        expect(() => coordinateLabel(lat, lon)).not.toThrow();
        expect(typeof coordinateLabel(lat, lon)).toBe("string");
      }
    }
  });
});

describe("coordinateLabel — matches what a map click stores (ADR-0004)", () => {
  // A map click navigates to `?lat&lon&name` where name === coordinateLabel(lat, lon).
  // The label is therefore carried as the `name` query param and must survive the
  // deep-link round-trip unchanged, so the popup re-reads the exact same string.
  it("round-trips as the `name` param through toLocationQuery + parseLocationParams", () => {
    const lat = 50.4501;
    const lon = 30.5234;
    const name = coordinateLabel(lat, lon);

    const location = { lat, lon, name };
    const query = toLocationQuery(location);
    const parsed = parseLocationParams(
      Object.fromEntries(new URLSearchParams(query)),
    );

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      // The label survives serialize -> parse unchanged.
      expect(parsed.location.name).toBe(name);
    }
  });

  it("produces a `name` that parseLocationParams accepts as a non-blank name", () => {
    // Even for Null Island the label "0, 0" is a valid, non-blank name.
    const name = coordinateLabel(0, 0);
    const parsed = parseLocationParams({ lat: "0", lon: "0", name });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.location.name).toBe("0, 0");
    }
  });

  it("yields a label whose own coordinates parse back in-range for a click near Kyiv", () => {
    // Simulate a click: raw latlng -> label, and the raw coords are deep-linked.
    const lat = 50.4501;
    const lon = 30.5234;
    const parsed = parseLocationParams({
      lat: String(lat),
      lon: String(lon),
      name: coordinateLabel(lat, lon),
    });
    expect(parsed.ok).toBe(true);
  });
});

describe("coordinateLabel — purity (no exclamation marks, calm label)", () => {
  it("never contains an exclamation mark (BC-BRAND-01)", () => {
    expect(coordinateLabel(50.45, 30.52)).not.toContain("!");
    expect(coordinateLabel(-33.8688, -70.6693)).not.toContain("!");
  });
});
