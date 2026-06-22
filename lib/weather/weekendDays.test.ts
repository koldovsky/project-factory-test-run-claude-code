// @trace FR-COMPARE-02
//
// Test-first (RED): written BEFORE `lib/weather/weekendDays.ts` exists. Defines
// the contract for the pure `weekendDays(days)` helper that, given one city's
// mapped forecast days, returns the UPCOMING Saturday and Sunday picked by each
// day's LOCAL calendar date string (Open-Meteo `daily.time` is already
// location-local via timezone=auto). The compare table (FR-COMPARE-02) renders
// one column per pinned city and derives that column's Sat/Sun rows from THIS
// helper applied to the column's OWN forecast — so two cities in different time
// zones resolve to their own correct weekend days.
//
// The weekend days MUST be derived from the LOCAL "YYYY-MM-DD" string directly
// (parsed arithmetically), NOT from `new Date(date).toISOString().slice(0,10)`
// (which shifts to UTC and, near midnight / across a date line, names the wrong
// weekday) and NOT from the visitor clock — so the result is timezone-invariant
// (the recurring day-bound bug AGENTS.md warns about).
//
// These tests MUST fail today (module not found / missing export), then drive
// the implementation to green. Never weaken them to pass.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./types` (already defined):
//   export interface DailyForecast {
//     date: string;            // "YYYY-MM-DD", location-local
//     hiC: number; loC: number; weatherCode: number;
//     feelsLikeMaxC: number | null;
//     precipProbability: number | null;
//     windKmh: number | null;
//     cloudCover: number | null;
//     uvIndex: number | null;
//   }
//
// From `./weekendDays`:
//   // Pure (TC-PURE-01): no next/*, react, DOM. Scans `days` for the UPCOMING
//   // Saturday and Sunday by parsing each day's LOCAL "YYYY-MM-DD" string
//   // (NEVER Date#toISOString / a UTC slice, NEVER the visitor clock). The
//   // "upcoming" weekend is the FIRST Saturday in chronological order and the
//   // Sunday that immediately follows it (a Sunday that precedes the first
//   // Saturday belongs to an earlier weekend and is ignored). When only one of
//   // the two weekend days is present in the window, the other is null. Returns
//   // both null when the window contains no weekend day. Never throws; tolerates
//   // an empty list, a non-array, and malformed/missing date strings.
//   export function weekendDays(days: DailyForecast[]): {
//     saturday: DailyForecast | null;
//     sunday: DailyForecast | null;
//   }
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import type { DailyForecast } from "./types";
import { weekendDays } from "./weekendDays";

// Reference window (LOCAL calendar dates), independent of the host timezone:
//   2026-06-18 Thu, 06-19 Fri, 06-20 Sat, 06-21 Sun, 06-22 Mon.
const THU = "2026-06-18";
const FRI = "2026-06-19";
const SATURDAY = "2026-06-20";
const SUNDAY = "2026-06-21";
const MON = "2026-06-22";

/** Build a minimal-but-complete DailyForecast for `date`; fields are tagged so
 *  a test can assert the RIGHT day object was returned (not a fresh/empty one). */
function day(date: string, overrides: Partial<DailyForecast> = {}): DailyForecast {
  return {
    date,
    hiC: 20,
    loC: 10,
    weatherCode: 1,
    feelsLikeMaxC: 19,
    precipProbability: 15,
    windKmh: 8,
    cloudCover: 40,
    uvIndex: 3,
    ...overrides,
  };
}

describe("weekendDays — upcoming Saturday and Sunday by LOCAL date (FR-COMPARE-02)", () => {
  it("returns the upcoming Saturday and Sunday from a full-week window", () => {
    const sat = day(SATURDAY, { hiC: 28, loC: 17, precipProbability: 10 });
    const sun = day(SUNDAY, { hiC: 24, loC: 15, precipProbability: 40 });
    const result = weekendDays([day(THU), day(FRI), sat, sun, day(MON)]);

    expect(result.saturday).toEqual(sat);
    expect(result.sunday).toEqual(sun);
  });

  it("returns the exact day objects (preserving hi/lo, precip %, comfort inputs)", () => {
    const sat = day(SATURDAY, { hiC: 31, loC: 19, precipProbability: 5, feelsLikeMaxC: 30 });
    const sun = day(SUNDAY, { hiC: 22, loC: 12, precipProbability: 80, feelsLikeMaxC: 21 });
    const result = weekendDays([sat, sun]);

    // Same identity the table cell needs for hi/lo, precip %, and comfortScore.
    expect(result.saturday).toBe(sat);
    expect(result.sunday).toBe(sun);
  });

  it("ignores weekdays around the weekend", () => {
    const result = weekendDays([day(THU), day(FRI), day(MON)]);
    expect(result.saturday).toBeNull();
    expect(result.sunday).toBeNull();
  });
});

describe("weekendDays — one-day-only window (FR-COMPARE-02)", () => {
  it("returns the lone Saturday with sunday=null when Sunday is outside the window", () => {
    const sat = day(SATURDAY, { hiC: 27 });
    const result = weekendDays([day(THU), day(FRI), sat]);

    expect(result.saturday).toEqual(sat);
    expect(result.sunday).toBeNull();
  });

  it("returns the lone Sunday with saturday=null when Saturday is outside the window", () => {
    const sun = day(SUNDAY, { hiC: 23 });
    const result = weekendDays([sun, day(MON)]);

    expect(result.saturday).toBeNull();
    expect(result.sunday).toEqual(sun);
  });
});

describe("weekendDays — none-in-window and degenerate input (FR-COMPARE-02)", () => {
  it("returns both null when the window contains no weekend day", () => {
    const result = weekendDays([day(MON), day("2026-06-23"), day("2026-06-24")]);
    expect(result).toEqual({ saturday: null, sunday: null });
  });

  it("returns both null for an empty list (never throws)", () => {
    const run = () => weekendDays([]);
    expect(run).not.toThrow();
    expect(run()).toEqual({ saturday: null, sunday: null });
  });

  it("never throws on a non-array input and returns both null", () => {
    // @ts-expect-error — exercising hostile non-array input for totality.
    const run = () => weekendDays(undefined);
    expect(run).not.toThrow();
    expect(run()).toEqual({ saturday: null, sunday: null });
  });

  it("never throws on malformed/missing date strings and skips them", () => {
    const sat = day(SATURDAY);
    const run = () =>
      weekendDays([
        day("not-a-date"),
        day("2026/06/20"),
        // @ts-expect-error — exercising hostile non-string date for totality.
        day(undefined),
        sat,
      ]);
    expect(run).not.toThrow();
    const result = run();
    expect(result.saturday).toEqual(sat);
    expect(result.sunday).toBeNull();
  });
});

describe("weekendDays — pairs the Sunday that follows the first Saturday (FR-COMPARE-02)", () => {
  it("picks the FIRST upcoming weekend when the window spans two weekends", () => {
    const thisSat = day(SATURDAY, { hiC: 28 });
    const thisSun = day(SUNDAY, { hiC: 26 });
    const nextSat = day("2026-06-27", { hiC: 18 });
    const nextSun = day("2026-06-28", { hiC: 17 });
    const result = weekendDays([thisSat, thisSun, nextSat, nextSun]);

    expect(result.saturday).toEqual(thisSat);
    expect(result.sunday).toEqual(thisSun);
  });

  it("ignores a Sunday that precedes the first Saturday (earlier weekend)", () => {
    // A standalone earlier Sunday must NOT be paired with a later Saturday.
    const earlierSun = day("2026-06-14"); // Sunday of the previous week
    const sat = day(SATURDAY);
    const sun = day(SUNDAY);
    const result = weekendDays([earlierSun, sat, sun]);

    expect(result.saturday).toEqual(sat);
    expect(result.sunday).toEqual(sun);
  });

  it("resolves the same weekend regardless of input order", () => {
    const sat = day(SATURDAY);
    const sun = day(SUNDAY);
    const ordered = weekendDays([day(THU), sat, sun, day(MON)]);
    const shuffled = weekendDays([day(MON), sun, day(THU), sat]);

    expect(shuffled.saturday).toEqual(ordered.saturday);
    expect(shuffled.sunday).toEqual(ordered.sunday);
  });
});

describe("weekendDays — timezone-invariant, never a UTC slice / visitor clock (FR-COMPARE-02)", () => {
  // The classic bug: `new Date("2026-06-20").toISOString().slice(0,10)` parses
  // to UTC midnight; in a timezone behind UTC that slices back to 2026-06-19
  // (Friday) and misclassifies the weekend. The helper must read the local
  // strings directly so each city's weekend is correct in any host timezone.
  it("classifies Sat/Sun from the local date string, not a UTC-shifted slice", () => {
    const sat = day(SATURDAY);
    const sun = day(SUNDAY);
    const result = weekendDays([day(FRI), sat, sun, day(MON)]);

    expect(result.saturday).toEqual(sat);
    expect(result.sunday).toEqual(sun);
  });

  it("returns the same weekend in every host timezone for a fixed window", () => {
    const original = process.env.TZ;
    const sat = day(SATURDAY);
    const sun = day(SUNDAY);
    const input = [day(FRI), sat, sun, day(MON)];
    const dates: Array<string> = [];
    for (const tz of ["UTC", "Pacific/Kiritimati", "Etc/GMT+12", "Asia/Kolkata", "America/Los_Angeles"]) {
      process.env.TZ = tz;
      const r = weekendDays(input);
      dates.push(`${r.saturday?.date ?? "none"}|${r.sunday?.date ?? "none"}`);
    }
    process.env.TZ = original;

    expect(new Set(dates).size).toBe(1);
    expect(dates[0]).toBe(`${SATURDAY}|${SUNDAY}`);
  });

  it("does not mutate the input array or its day objects", () => {
    const sat = day(SATURDAY);
    const sun = day(SUNDAY);
    const input = [day(THU), sat, sun, day(MON)];
    const snapshot = JSON.stringify(input);

    weekendDays(input);

    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
