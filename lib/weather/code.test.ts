// @trace FR-FORECAST-02
//
// Test-first (RED): written BEFORE `lib/weather/code.ts` exists. Defines the
// contract for the pure `weatherCodeToCondition(code)` helper that turns an
// Open-Meteo WMO `weather_code` into an icon key plus a Ukrainian condition name
// for the day card's accessible icon alternative (FR-FORECAST-02, TC-PURE-01).
//
// WMO code groups per docs/open-meteo-reference.md:
//   0 clear · 1-3 mainly clear / partly / overcast · 45,48 fog · 51-57 drizzle ·
//   61-67 rain · 71-77 snow · 80-82 rain showers · 85,86 snow showers ·
//   95 thunderstorm · 96,99 thunderstorm with hail.
//
// The Ukrainian condition name is the icon's accessible text alternative and MUST
// be calm, no exclamation marks, no emoji (BC-BRAND-01). The helper is TOTAL:
// every code (incl. unknown / out-of-range / non-integer) returns a usable
// condition rather than throwing, so the day card always has an alt text.
//
// These tests MUST fail today (module not found / missing export), then drive
// the implementation to green. Never weaken them to pass.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./code`:
//
//   export interface WeatherCondition {
//     // Stable icon key the DayCard maps to an icon asset/component.
//     icon: string;
//     // Ukrainian condition name — the icon's accessible alt text.
//     // Calm, no "!", no emoji (BC-BRAND-01).
//     label: string;
//   }
//
//   // Pure (TC-PURE-01): no next/*, react, DOM. TOTAL: every input (incl.
//   // unknown codes, negatives, non-integers) returns a WeatherCondition;
//   // NEVER throws.
//   export function weatherCodeToCondition(code: number): WeatherCondition
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { weatherCodeToCondition } from "./code";

// A Cyrillic letter is present ⇒ the label is Ukrainian text, not an English
// fallback or an empty string.
const CYRILLIC = /[Ѐ-ӿ]/;

describe("weatherCodeToCondition — representative WMO codes map to icon + UA name (FR-FORECAST-02)", () => {
  const representatives: number[] = [0, 1, 2, 3, 45, 48, 51, 55, 61, 65, 71, 75, 80, 82, 85, 95, 96, 99];

  it.each(representatives)("code %i yields a non-empty icon key and a Ukrainian label", (code) => {
    const condition = weatherCodeToCondition(code);

    expect(typeof condition.icon).toBe("string");
    expect(condition.icon.length).toBeGreaterThan(0);
    expect(typeof condition.label).toBe("string");
    expect(condition.label.length).toBeGreaterThan(0);
    expect(condition.label).toMatch(CYRILLIC);
  });

  it("maps clear sky (0) distinctly from overcast (3)", () => {
    const clear = weatherCodeToCondition(0);
    const overcast = weatherCodeToCondition(3);

    // Different conditions must not collapse to the same icon.
    expect(clear.icon).not.toBe(overcast.icon);
    expect(clear.label).not.toBe(overcast.label);
  });

  it("maps rain (61-67) and snow (71-77) to different icons", () => {
    expect(weatherCodeToCondition(63).icon).not.toBe(weatherCodeToCondition(73).icon);
  });

  it("maps thunderstorm (95) to its own condition, distinct from plain rain (61)", () => {
    expect(weatherCodeToCondition(95).icon).not.toBe(weatherCodeToCondition(61).icon);
  });

  it("maps fog codes 45 and 48 to the same fog condition", () => {
    expect(weatherCodeToCondition(45)).toEqual(weatherCodeToCondition(48));
  });

  it("maps thunderstorm-with-hail codes 96 and 99 to the same condition", () => {
    expect(weatherCodeToCondition(96)).toEqual(weatherCodeToCondition(99));
  });
});

describe("weatherCodeToCondition — labels are calm Ukrainian, no '!' / no emoji (FR-FORECAST-02, BC-BRAND-01)", () => {
  const allCodes: number[] = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];

  it.each(allCodes)("code %i label has no exclamation mark and no emoji", (code) => {
    const { label } = weatherCodeToCondition(code);

    expect(label).not.toContain("!");
    // No emoji / pictographic symbols in the accessible name.
    expect(label).not.toMatch(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/u);
  });
});

describe("weatherCodeToCondition — total over unknown / invalid codes, never throws (FR-FORECAST-02)", () => {
  it("returns a usable Ukrainian condition for an unknown code without throwing", () => {
    const run = () => weatherCodeToCondition(7);
    expect(run).not.toThrow();

    const condition = run();
    expect(condition.icon.length).toBeGreaterThan(0);
    expect(condition.label).toMatch(CYRILLIC);
  });

  it("never throws for negative, huge, NaN, or non-integer codes", () => {
    for (const code of [-1, 1000, NaN, 3.7, Infinity, -Infinity]) {
      const run = () => weatherCodeToCondition(code);
      expect(run).not.toThrow();
      expect(run().label.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic — the same code always maps to the same condition", () => {
    expect(weatherCodeToCondition(61)).toEqual(weatherCodeToCondition(61));
  });
});
