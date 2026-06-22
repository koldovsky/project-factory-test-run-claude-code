// @trace FR-FORECAST-02
//
// Test-first (RED): written BEFORE `lib/weather/weekday.ts` exists. Defines the
// contract for the pure `ukWeekday(localDateStr)` helper that turns a forecast
// day's LOCAL calendar date string ("YYYY-MM-DD" from Open-Meteo `daily.time`,
// already location-local via timezone=auto) into the Ukrainian weekday name shown
// on the day card (FR-FORECAST-02, TC-PURE-01).
//
// The weekday MUST be derived from the LOCAL date string, NOT from
// `new Date(date).toISOString().slice(0,10)` (which shifts to UTC and, near
// midnight or across a date line, names the wrong weekday) and NOT from the
// visitor clock — so the result is timezone-invariant (the same recurring bug
// AGENTS.md warns about for day-bound logic).
//
// These tests MUST fail today (module not found / missing export), then drive the
// implementation to green. Never weaken them to pass.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./weekday`:
//
//   // Pure (TC-PURE-01): no next/*, react, DOM. Parses the LOCAL "YYYY-MM-DD"
//   // string ARITHMETICALLY (never via Date#toISOString / UTC slice, never the
//   // visitor clock) and returns the Ukrainian weekday name. Returns "" for an
//   // unparseable / invalid date string (never throws), so the caller can omit
//   // the label rather than render "undefined".
//   export function ukWeekday(localDateStr: string): string
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { ukWeekday } from "./weekday";

// Reference week (local calendar dates), independent of the host timezone:
//   2026-06-22 Monday … 2026-06-28 Sunday.
const MON = "2026-06-22";
const TUE = "2026-06-23";
const WED = "2026-06-24";
const THU = "2026-06-25";
const FRI = "2026-06-26";
const SAT = "2026-06-27";
const SUN = "2026-06-28";

// The seven canonical Ukrainian weekday names. The helper must return one of
// these forms (this is the accessible/display label the day card shows).
const UK_WEEKDAYS = ["понеділок", "вівторок", "середа", "четвер", "пʼятниця", "субота", "неділя"];

describe("ukWeekday — Ukrainian weekday from the LOCAL date string (FR-FORECAST-02)", () => {
  it("maps Monday..Sunday to the Ukrainian weekday names", () => {
    expect(ukWeekday(MON)).toBe("понеділок");
    expect(ukWeekday(TUE)).toBe("вівторок");
    expect(ukWeekday(WED)).toBe("середа");
    expect(ukWeekday(THU)).toBe("четвер");
    expect(ukWeekday(FRI)).toBe("пʼятниця");
    expect(ukWeekday(SAT)).toBe("субота");
    expect(ukWeekday(SUN)).toBe("неділя");
  });

  it("returns one of the seven canonical Ukrainian weekday names", () => {
    for (const date of [MON, TUE, WED, THU, FRI, SAT, SUN]) {
      expect(UK_WEEKDAYS).toContain(ukWeekday(date));
    }
  });

  it("returns Ukrainian text (Cyrillic), never an English weekday name", () => {
    expect(ukWeekday(MON)).toMatch(/[Ѐ-ӿ]/);
    expect(ukWeekday(MON).toLowerCase()).not.toContain("monday");
  });

  it("carries no exclamation mark and no emoji in the label (BC-BRAND-01)", () => {
    for (const date of [MON, SAT, SUN]) {
      const label = ukWeekday(date);
      expect(label).not.toContain("!");
      expect(label).not.toMatch(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/u);
    }
  });
});

describe("ukWeekday — timezone-invariant, never a UTC slice / visitor clock (FR-FORECAST-02)", () => {
  // The classic bug: `new Date("2026-06-22").toISOString().slice(0,10)` parses to
  // UTC midnight; in a timezone behind UTC that slices back to 2026-06-21 (Sunday)
  // and names the wrong weekday. The helper must read the local string directly.
  it("names the weekday of the given local date, not the UTC-shifted previous day", () => {
    // 2026-06-22 is Monday. A UTC-slice bug in a behind-UTC zone would yield
    // Sunday — assert Monday regardless of the test machine's timezone.
    expect(ukWeekday("2026-06-22")).toBe("понеділок");
  });

  it("returns the same weekday in every host timezone for a fixed date", () => {
    const original = process.env.TZ;
    const labels: string[] = [];
    for (const tz of ["UTC", "Pacific/Kiritimati", "Etc/GMT+12", "Asia/Kolkata", "America/Los_Angeles"]) {
      process.env.TZ = tz;
      labels.push(ukWeekday(SAT));
    }
    process.env.TZ = original;

    expect(new Set(labels).size).toBe(1);
    expect(labels[0]).toBe("субота");
  });

  it("is deterministic — the same date always maps to the same weekday", () => {
    expect(ukWeekday(WED)).toBe(ukWeekday(WED));
  });
});

describe("ukWeekday — total over invalid input, never throws (FR-FORECAST-02)", () => {
  it("returns '' (empty, never 'undefined') for an unparseable date string", () => {
    for (const bad of ["", "not-a-date", "2026/06/22", "2026-13-01", "2026-06-99", "20260622"]) {
      const run = () => ukWeekday(bad);
      expect(run).not.toThrow();
      expect(run()).toBe("");
    }
  });

  it("never throws and never returns the literal string 'undefined'", () => {
    // @ts-expect-error — exercising hostile non-string input for totality.
    expect(() => ukWeekday(undefined)).not.toThrow();
    // @ts-expect-error — exercising hostile non-string input for totality.
    expect(ukWeekday(null)).not.toBe("undefined");
  });
});
