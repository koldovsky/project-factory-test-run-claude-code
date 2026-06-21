// @trace FR-COMFORT-04
//
// Test-first (RED): written BEFORE `lib/scoring/band.ts` exists. Defines the
// contract for the half-open comfort-band helper (FR-COMFORT-04). Bands are
// half-open so every integer value maps to exactly one band:
//   green  when value >= 70
//   yellow when 40 <= value < 70
//   red    when value < 40
// These tests MUST fail today (module not found / missing export), then drive
// the implementation to green.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./band`:
//   export type ComfortBand = "green" | "yellow" | "red";
//
//   // Pure (TC-PURE-01). Evaluates the half-open bands against the integer
//   // comfort value. Boundaries are exact: 70 -> green, 69 -> yellow,
//   // 40 -> yellow, 39 -> red.
//   export function comfortBand(value: number): ComfortBand
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { comfortBand } from "./band";
import type { ComfortBand } from "./band";

describe("comfortBand — half-open boundary exactness (FR-COMFORT-04)", () => {
  it("70 is green (>= 70, lower edge of green)", () => {
    expect(comfortBand(70)).toBe("green");
  });

  it("69 is yellow (just below the green edge)", () => {
    expect(comfortBand(69)).toBe("yellow");
  });

  it("40 is yellow (>= 40, lower edge of yellow)", () => {
    expect(comfortBand(40)).toBe("yellow");
  });

  it("39 is red (just below the yellow edge)", () => {
    expect(comfortBand(39)).toBe("red");
  });
});

describe("comfortBand — band interiors and full range", () => {
  it("classifies high values as green", () => {
    expect(comfortBand(100)).toBe("green");
    expect(comfortBand(85)).toBe("green");
    expect(comfortBand(71)).toBe("green");
  });

  it("classifies mid values as yellow", () => {
    expect(comfortBand(55)).toBe("yellow");
    expect(comfortBand(41)).toBe("yellow");
  });

  it("classifies low values as red", () => {
    expect(comfortBand(38)).toBe("red");
    expect(comfortBand(1)).toBe("red");
    expect(comfortBand(0)).toBe("red");
  });

  it("maps every integer 0..100 to exactly one of the three bands", () => {
    const allowed: ComfortBand[] = ["green", "yellow", "red"];
    for (let v = 0; v <= 100; v += 1) {
      const band = comfortBand(v);
      expect(allowed.includes(band), `value ${v} produced an unknown band "${band}"`).toBe(true);
      // Cross-check the half-open definition independently of the implementation.
      const expected: ComfortBand = v >= 70 ? "green" : v >= 40 ? "yellow" : "red";
      expect(band, `value ${v} should be ${expected}`).toBe(expected);
    }
  });
});
