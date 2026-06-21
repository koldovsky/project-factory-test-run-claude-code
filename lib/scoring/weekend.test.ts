// @trace FR-COMFORT-05
//
// Test-first (RED): written BEFORE `lib/scoring/weekend.ts` exists. Defines the
// contract for the upcoming-weekend comfort average (FR-COMFORT-05):
//   - "weekend" = the upcoming Saturday and Sunday by the active location's
//     LOCAL calendar date string (Open-Meteo `daily.time` is already
//     location-local via timezone=auto). It MUST NOT use the visitor clock and
//     MUST NOT use `toISOString().slice(0,10)` (that is UTC and breaks near
//     midnight / across date lines).
//   - The value is the arithmetic mean of the Sat + Sun integer scores, rounded
//     to the nearest integer rounding HALF UP (e.g. mean 70.5 -> 71).
//   - The one-day-only case (only Sat OR only Sun in the window) uses that
//     single day's score and flags it.
// These tests MUST fail today (module not found / missing export), then drive
// the implementation to green.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./weekend`:
//   // One forecast day: a LOCAL ISO date string "YYYY-MM-DD" (from the
//   // forecast's daily.time, already location-local) and that day's integer
//   // comfort value.
//   export interface WeekendDay {
//     date: string;   // "YYYY-MM-DD", LOCAL to the active location
//     value: number;  // integer comfort score 0..100 for that day
//   }
//
//   export interface WeekendComfort {
//     value: number;        // rounded-half-up integer mean of available wknd days
//     dayCount: 1 | 2;      // how many weekend days were found in the window
//     partial: boolean;     // true when only one weekend day was available
//   }
//
//   // Pure (TC-PURE-01). Scans `days` for the UPCOMING Saturday and Sunday by
//   // parsing the LOCAL date string (NOT Date#toISOString / UTC, NOT the
//   // visitor clock). Returns null when neither weekend day is present.
//   export function weekendComfort(days: WeekendDay[]): WeekendComfort | null
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { weekendComfort } from "./weekend";

// A standard upcoming-week window. 2026-06-20 is a Saturday and 2026-06-21 a
// Sunday (local calendar), regardless of the machine's timezone.
const SATURDAY = "2026-06-20";
const SUNDAY = "2026-06-21";

describe("weekendComfort — mean of Saturday and Sunday (FR-COMFORT-05)", () => {
  it("averages the upcoming Saturday and Sunday integer scores", () => {
    const result = weekendComfort([
      { date: "2026-06-18", value: 50 }, // Thu
      { date: "2026-06-19", value: 60 }, // Fri
      { date: SATURDAY, value: 80 },
      { date: SUNDAY, value: 60 },
    ]);

    expect(result).not.toBeNull();
    expect(result!.value).toBe(70); // (80 + 60) / 2 = 70
    expect(result!.dayCount).toBe(2);
    expect(result!.partial).toBe(false);
  });

  it("rounds the mean HALF UP — 71 and 70 average to 71 (mean 70.5 -> 71)", () => {
    const result = weekendComfort([
      { date: SATURDAY, value: 71 },
      { date: SUNDAY, value: 70 },
    ]);

    expect(result!.value).toBe(71);
  });

  it("rounds the mean HALF UP — 40 and 41 average to 41 (mean 40.5 -> 41)", () => {
    const result = weekendComfort([
      { date: SATURDAY, value: 40 },
      { date: SUNDAY, value: 41 },
    ]);

    expect(result!.value).toBe(41);
  });

  it("rounds the mean HALF UP — 0 and 1 average to 1 (mean 0.5 -> 1)", () => {
    const result = weekendComfort([
      { date: SATURDAY, value: 0 },
      { date: SUNDAY, value: 1 },
    ]);

    expect(result!.value).toBe(1);
  });

  it("returns an exact integer mean unchanged", () => {
    const result = weekendComfort([
      { date: SATURDAY, value: 90 },
      { date: SUNDAY, value: 90 },
    ]);

    expect(result!.value).toBe(90);
  });

  it("returns an integer value", () => {
    const result = weekendComfort([
      { date: SATURDAY, value: 55 },
      { date: SUNDAY, value: 66 },
    ]);

    expect(Number.isInteger(result!.value)).toBe(true);
  });
});

describe("weekendComfort — one-day-only window (FR-COMFORT-05)", () => {
  it("uses the lone Saturday when Sunday is outside the window", () => {
    const result = weekendComfort([
      { date: "2026-06-18", value: 30 }, // Thu
      { date: "2026-06-19", value: 40 }, // Fri
      { date: SATURDAY, value: 82 },
    ]);

    expect(result!.value).toBe(82);
    expect(result!.dayCount).toBe(1);
    expect(result!.partial).toBe(true);
  });

  it("uses the lone Sunday when Saturday is outside the window", () => {
    const result = weekendComfort([
      { date: SUNDAY, value: 64 },
      { date: "2026-06-22", value: 70 }, // Mon
    ]);

    expect(result!.value).toBe(64);
    expect(result!.dayCount).toBe(1);
    expect(result!.partial).toBe(true);
  });

  it("returns null when the window contains no weekend day", () => {
    const result = weekendComfort([
      { date: "2026-06-22", value: 70 }, // Mon
      { date: "2026-06-23", value: 71 }, // Tue
      { date: "2026-06-24", value: 72 }, // Wed
    ]);

    expect(result).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(weekendComfort([])).toBeNull();
  });
});

describe("weekendComfort — LOCAL date resolution, never UTC slice / visitor clock (FR-COMFORT-05)", () => {
  // The date strings are the location-local calendar dates. The helper must
  // classify weekend days from these strings directly — NOT by constructing a
  // Date and calling toISOString().slice(0,10) (which shifts to UTC and, near
  // midnight or across a date line, would name the wrong weekday). This case
  // is independent of the machine timezone running the test.
  it("identifies Saturday/Sunday from the local date string, not a UTC slice", () => {
    // Were the implementation to do `new Date(date).toISOString().slice(0,10)`
    // in a timezone behind UTC, the parsed instant (UTC midnight) would slice
    // back to the PREVIOUS day and misclassify the weekday. Assert the local
    // strings are honored as-is.
    const result = weekendComfort([
      { date: "2026-06-19", value: 10 }, // Fri (must NOT be counted)
      { date: SATURDAY, value: 88 }, // Sat
      { date: SUNDAY, value: 90 }, // Sun
      { date: "2026-06-22", value: 12 }, // Mon (must NOT be counted)
    ]);

    expect(result!.dayCount).toBe(2);
    expect(result!.value).toBe(89); // (88 + 90) / 2 = 89
  });

  it("does not depend on the host machine timezone (stable result)", () => {
    const original = process.env.TZ;
    const inputs = [
      { date: SATURDAY, value: 72 },
      { date: SUNDAY, value: 73 },
    ];
    const results: Array<number | null> = [];
    for (const tz of ["UTC", "Pacific/Kiritimati", "Etc/GMT+12", "Asia/Kolkata"]) {
      process.env.TZ = tz;
      const r = weekendComfort(inputs);
      results.push(r ? r.value : null);
    }
    process.env.TZ = original;

    // Same input ⇒ same weekend value in every timezone.
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(73); // (72 + 73) / 2 = 72.5 -> 73 (half up)
  });

  it("picks the FIRST (upcoming) weekend when the window spans two weekends", () => {
    const result = weekendComfort([
      { date: SATURDAY, value: 80 }, // this weekend Sat
      { date: SUNDAY, value: 80 }, // this weekend Sun
      { date: "2026-06-27", value: 20 }, // next weekend Sat
      { date: "2026-06-28", value: 20 }, // next weekend Sun
    ]);

    expect(result!.value).toBe(80);
    expect(result!.dayCount).toBe(2);
    expect(result!.partial).toBe(false);
  });
});
