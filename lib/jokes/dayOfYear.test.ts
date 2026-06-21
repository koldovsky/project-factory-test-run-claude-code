// @trace FR-JOKES-01
//
// Test-first (RED): written BEFORE `lib/jokes/select.ts` exists. These tests
// define the contract for the pure, framework-free `dayOfYear(date)` helper
// (FR-JOKES-01, TC-PURE-01) that turns a calendar date into a stable rotation
// index for the footer joke. They MUST fail today (module not found / missing
// export), then drive the implementation to green.
//
// Per tasks.md §2.3: deterministic day-of-year for fixed dates.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./select`:
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, DOM globals, no
//   // Math.random and no Date.now — it reads ONLY the Date argument.
//   // Deterministic: identical date ⇒ identical integer.
//   // 1-based ordinal day of the local calendar year: 1 for Jan 1,
//   // 365 (or 366 in a leap year) for Dec 31. Uses the date's LOCAL calendar
//   // fields (getFullYear/getMonth/getDate), never toISOString()/UTC, so the
//   // index does not jump a day near midnight (AGENTS.md day-bound rule).
//   export function dayOfYear(date: Date): number
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { dayOfYear } from "./select";

// Build a Date at local noon to keep the assertions away from any DST / UTC
// edge: midday local is the same calendar day in every realistic zone.
function localDate(year: number, month1to12: number, day: number): Date {
  return new Date(year, month1to12 - 1, day, 12, 0, 0, 0);
}

describe("dayOfYear — known ordinals for fixed dates (FR-JOKES-01)", () => {
  it("returns 1 for January 1st", () => {
    expect(dayOfYear(localDate(2026, 1, 1))).toBe(1);
  });

  it("returns 32 for February 1st", () => {
    expect(dayOfYear(localDate(2026, 2, 1))).toBe(32);
  });

  it("returns 365 for December 31st in a non-leap year", () => {
    // 2026 is not a leap year.
    expect(dayOfYear(localDate(2026, 12, 31))).toBe(365);
  });

  it("returns 366 for December 31st in a leap year", () => {
    // 2024 is a leap year.
    expect(dayOfYear(localDate(2024, 12, 31))).toBe(366);
  });

  it("counts the leap day — March 1st is day 61 in a leap year", () => {
    // Jan(31) + Feb(29) + 1 = 61.
    expect(dayOfYear(localDate(2024, 3, 1))).toBe(61);
  });

  it("counts without the leap day — March 1st is day 60 in a non-leap year", () => {
    // Jan(31) + Feb(28) + 1 = 60.
    expect(dayOfYear(localDate(2026, 3, 1))).toBe(60);
  });
});

describe("dayOfYear — purity & determinism (FR-JOKES-01, TC-PURE-01)", () => {
  it("is deterministic — identical date yields the identical ordinal", () => {
    const a = dayOfYear(localDate(2026, 6, 21));
    const b = dayOfYear(localDate(2026, 6, 21));
    expect(a).toBe(b);
  });

  it("returns an integer within [1, 366] for a spread of dates", () => {
    const dates = [
      localDate(2026, 1, 1),
      localDate(2026, 4, 15),
      localDate(2026, 6, 21),
      localDate(2026, 9, 30),
      localDate(2026, 12, 31),
      localDate(2024, 2, 29),
    ];
    for (const d of dates) {
      const n = dayOfYear(d);
      expect(Number.isInteger(n), `dayOfYear(${d.toString()}) should be an integer`).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(366);
    }
  });

  it("does not mutate the input Date", () => {
    const input = localDate(2026, 6, 21);
    const before = input.getTime();
    dayOfYear(input);
    expect(input.getTime()).toBe(before);
  });

  it("advances by exactly 1 between consecutive local days", () => {
    const today = dayOfYear(localDate(2026, 6, 21));
    const tomorrow = dayOfYear(localDate(2026, 6, 22));
    expect(tomorrow - today).toBe(1);
  });
});
