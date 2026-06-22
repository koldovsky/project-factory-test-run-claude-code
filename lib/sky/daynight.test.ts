// @trace FR-ANIM-02
//
// Test-first (RED): written BEFORE `lib/sky/daynight.ts` exists. Defines the
// contract for the pure, framework-free `isDaytime` helper that decides the day
// vs night gradient from the ACTIVE LOCATION's local "now" and today's
// sunrise/sunset, NOT the visitor's device clock and NOT
// `toISOString().slice(0,10)` (FR-ANIM-02, TC-PURE-01).
//
// Sun-time strings are location-local wall-clock values shaped like the forecast
// `sunrise`/`sunset` fields: "YYYY-MM-DDTHH:mm" (see lib/weather/types.ts). The
// "now" passed in is ALSO the active location's local wall clock in the same
// shape. The decision compares wall-clock components directly; it must NEVER
// build a UTC Date and slice it, because that shifts across midnight / date
// lines and would flip day↔night near the boundaries.
//
// The helper is TOTAL / calm (NFR-OBS-01): missing or unparseable sun times
// default to DAY and never throw, so the page renders a calm day gradient rather
// than crashing on incomplete data (FR-ANIM fail-calm).
//
// These tests MUST fail today (module not found / missing export), then drive
// the implementation to green. Never weaken them to pass — strengthen if green.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./daynight`:
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, or DOM globals.
//   // `nowLocal`, `sunrise`, `sunset` are the active location's LOCAL wall-clock
//   // strings "YYYY-MM-DDTHH:mm" (or "YYYY-MM-DDTHH:mm:ss"). Returns true when
//   // `nowLocal` is at/after sunrise and strictly before sunset, false when it
//   // is before sunrise or at/after sunset.
//   // TOTAL: missing / undefined / unparseable sunrise or sunset ⇒ defaults to
//   // DAY (returns true); NEVER throws and never reads the host clock or UTC.
//   export function isDaytime(
//     nowLocal: string,
//     sunrise?: string,
//     sunset?: string,
//   ): boolean
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { isDaytime } from "./daynight";

// A representative summer day for the active location, local wall clock.
const SUNRISE = "2026-06-21T05:48";
const SUNSET = "2026-06-21T21:12";

describe("isDaytime — day between sunrise and sunset (FR-ANIM-02)", () => {
  it("returns true at midday, comfortably between sunrise and sunset", () => {
    expect(isDaytime("2026-06-21T13:00", SUNRISE, SUNSET)).toBe(true);
  });

  it("returns true just after sunrise", () => {
    expect(isDaytime("2026-06-21T05:49", SUNRISE, SUNSET)).toBe(true);
  });

  it("returns true just before sunset", () => {
    expect(isDaytime("2026-06-21T21:11", SUNRISE, SUNSET)).toBe(true);
  });

  it("treats the exact sunrise instant as day (boundary, inclusive)", () => {
    expect(isDaytime("2026-06-21T05:48", SUNRISE, SUNSET)).toBe(true);
  });
});

describe("isDaytime — night before sunrise or after sunset (FR-ANIM-02)", () => {
  it("returns false in the early hours, before sunrise", () => {
    expect(isDaytime("2026-06-21T03:00", SUNRISE, SUNSET)).toBe(false);
  });

  it("returns false just before sunrise", () => {
    expect(isDaytime("2026-06-21T05:47", SUNRISE, SUNSET)).toBe(false);
  });

  it("returns false late at night, after sunset", () => {
    expect(isDaytime("2026-06-21T23:30", SUNRISE, SUNSET)).toBe(false);
  });

  it("treats the exact sunset instant as night (boundary, exclusive)", () => {
    expect(isDaytime("2026-06-21T21:12", SUNRISE, SUNSET)).toBe(false);
  });
});

describe("isDaytime — follows the active location, not the visitor clock (FR-ANIM-02)", () => {
  // The active location is in daytime per its OWN local now + sun times. The
  // visitor could be anywhere; the helper is given only the location-local
  // strings and must decide from those alone. There is no device-clock input to
  // read, so a correct implementation cannot accidentally consult it.
  it("renders day when the location's local now is daytime, regardless of host TZ", () => {
    const original = process.env.TZ;
    const results: boolean[] = [];
    for (const tz of ["UTC", "Pacific/Kiritimati", "Etc/GMT+12", "Asia/Kolkata"]) {
      process.env.TZ = tz;
      results.push(isDaytime("2026-06-21T13:00", SUNRISE, SUNSET));
    }
    process.env.TZ = original;

    // Same location-local inputs ⇒ same answer in every host timezone.
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(true);
  });

  it("renders night when the location's local now is night, regardless of host TZ", () => {
    const original = process.env.TZ;
    const results: boolean[] = [];
    for (const tz of ["UTC", "Pacific/Kiritimati", "Etc/GMT+12", "Asia/Kolkata"]) {
      process.env.TZ = tz;
      results.push(isDaytime("2026-06-21T02:30", SUNRISE, SUNSET));
    }
    process.env.TZ = original;

    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(false);
  });

  it("does not flip at a wall-clock boundary that a UTC slice would shift", () => {
    // 23:30 local is unambiguously night. An implementation that built a UTC
    // Date from the bare wall-clock string and sliced it could, in a behind-UTC
    // host zone, roll the comparison into the next/previous day and mislabel it.
    // The local wall-clock comparison must hold steady.
    const original = process.env.TZ;
    process.env.TZ = "Etc/GMT+12"; // far behind UTC
    const late = isDaytime("2026-06-21T23:30", SUNRISE, SUNSET);
    const early = isDaytime("2026-06-21T00:30", SUNRISE, SUNSET);
    process.env.TZ = original;

    expect(late).toBe(false);
    expect(early).toBe(false);
  });
});

describe("isDaytime — missing sun times default to day, never throws (FR-ANIM-02, NFR-OBS-01)", () => {
  it("defaults to day when both sun times are undefined", () => {
    let out: boolean | undefined;
    expect(() => {
      out = isDaytime("2026-06-21T02:30");
    }).not.toThrow();
    expect(out).toBe(true);
  });

  it("defaults to day when sunrise is missing", () => {
    expect(() => isDaytime("2026-06-21T23:30", undefined, SUNSET)).not.toThrow();
    expect(isDaytime("2026-06-21T23:30", undefined, SUNSET)).toBe(true);
  });

  it("defaults to day when sunset is missing", () => {
    expect(() => isDaytime("2026-06-21T02:30", SUNRISE, undefined)).not.toThrow();
    expect(isDaytime("2026-06-21T02:30", SUNRISE, undefined)).toBe(true);
  });

  it("defaults to day for empty-string sun times", () => {
    expect(() => isDaytime("2026-06-21T02:30", "", "")).not.toThrow();
    expect(isDaytime("2026-06-21T02:30", "", "")).toBe(true);
  });

  it("defaults to day for unparseable sun-time strings, without throwing", () => {
    expect(() => isDaytime("2026-06-21T02:30", "not-a-time", "also-bad")).not.toThrow();
    expect(isDaytime("2026-06-21T02:30", "not-a-time", "also-bad")).toBe(true);
  });

  it("is deterministic — identical inputs yield the identical result", () => {
    expect(isDaytime("2026-06-21T13:00", SUNRISE, SUNSET)).toBe(
      isDaytime("2026-06-21T13:00", SUNRISE, SUNSET),
    );
  });
});
