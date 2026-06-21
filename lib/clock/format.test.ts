// @trace FR-CLOCK-01
//
// Test-first (RED): written BEFORE `lib/clock/format.ts` exists. These tests
// define the contract for the pure, framework-free clock-formatting helper
// (FR-CLOCK-01, TC-PURE-01) and its calm, non-throwing fallback (NFR-OBS-01).
// They MUST fail today (module not found / missing export), then drive the
// implementation to green. Per tasks.md §2.1: a deterministic exact-string
// assertion for a fixed instant + locale + timeZone; a different timeZone
// yields a different time; and a calm fallback (no throw) for an invalid
// locale/timeZone.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./format`:
//
//   export interface FormatClockOptions {
//     locale?: string;    // BCP-47 tag, e.g. "uk-UA"; defaults to a safe locale
//     timeZone?: string;  // IANA zone, e.g. "Europe/Kyiv"; defaults to a safe zone
//   }
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, or DOM globals — only the
//   // standard `Intl.DateTimeFormat` runtime global.
//   // Deterministic: identical (date, locale, timeZone) ⇒ identical string.
//   // Total / calm (NFR-OBS-01): never throws; an unresolvable locale or
//   // timeZone falls back to a safe default format rather than crashing.
//   export function formatClock(date: Date, opts?: FormatClockOptions): string
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { formatClock } from "./format";

// A fixed instant: 2026-06-21T09:05:07Z. Chosen so the local time differs
// clearly across the two test zones (Kyiv is UTC+3 in June; Tokyo is UTC+9),
// and so hour/minute have stable, assertable values.
const FIXED_INSTANT = new Date("2026-06-21T09:05:07.000Z");

// Helper: digits-only view of a formatted string, to compare time content
// independent of locale separators (":", ".", narrow spaces, AM/PM markers).
function digits(value: string): string {
  return value.replace(/\D+/g, "");
}

describe("formatClock — deterministic, exact format (FR-CLOCK-01)", () => {
  it("formats a fixed instant for a fixed locale + timeZone to an exact string", () => {
    // 09:05:07Z in Europe/Kyiv (UTC+3 in June) = 12:05 local.
    const out = formatClock(FIXED_INSTANT, {
      locale: "uk-UA",
      timeZone: "Europe/Kyiv",
    });
    // Exact match: the helper must produce a stable HH:MM (24-hour) string for
    // uk-UA in this zone. This pins the format, not just "contains a time".
    expect(out).toBe("12:05");
  });

  it("is deterministic — identical inputs yield the identical string", () => {
    const a = formatClock(FIXED_INSTANT, { locale: "uk-UA", timeZone: "Europe/Kyiv" });
    const b = formatClock(FIXED_INSTANT, { locale: "uk-UA", timeZone: "Europe/Kyiv" });
    expect(a).toBe(b);
  });

  it("does not mutate the input Date", () => {
    const input = new Date(FIXED_INSTANT.getTime());
    const before = input.getTime();
    formatClock(input, { locale: "uk-UA", timeZone: "Europe/Kyiv" });
    expect(input.getTime()).toBe(before);
  });
});

describe("formatClock — timeZone changes the displayed time (FR-CLOCK-01)", () => {
  it("renders a DIFFERENT time for a different timeZone on the same instant", () => {
    const kyiv = formatClock(FIXED_INSTANT, { locale: "uk-UA", timeZone: "Europe/Kyiv" });
    const tokyo = formatClock(FIXED_INSTANT, { locale: "uk-UA", timeZone: "Asia/Tokyo" });
    expect(tokyo).not.toBe(kyiv);
  });

  it("uses the requested zone's wall-clock value, not UTC", () => {
    // Tokyo is UTC+9: 09:05Z = 18:05 local.
    const tokyo = formatClock(FIXED_INSTANT, { locale: "uk-UA", timeZone: "Asia/Tokyo" });
    expect(digits(tokyo)).toBe("1805");
  });
});

describe("formatClock — calm fallback, never throws (FR-CLOCK-01, NFR-OBS-01)", () => {
  it("does not throw for an invalid timeZone, returns a readable time string", () => {
    let out: string | undefined;
    expect(() => {
      out = formatClock(FIXED_INSTANT, { locale: "uk-UA", timeZone: "Not/AZone" });
    }).not.toThrow();
    expect(typeof out).toBe("string");
    expect(out!.trim().length).toBeGreaterThan(0);
    // Fallback must still surface a time, not a blank or an error token.
    expect(digits(out!).length).toBeGreaterThanOrEqual(3);
  });

  it("does not throw for an invalid locale, returns a readable time string", () => {
    let out: string | undefined;
    expect(() => {
      out = formatClock(FIXED_INSTANT, {
        locale: "not-a-locale-#$%",
        timeZone: "Europe/Kyiv",
      });
    }).not.toThrow();
    expect(typeof out).toBe("string");
    expect(out!.trim().length).toBeGreaterThan(0);
    expect(digits(out!).length).toBeGreaterThanOrEqual(3);
  });

  it("does not throw when both locale and timeZone are invalid", () => {
    let out: string | undefined;
    expect(() => {
      out = formatClock(FIXED_INSTANT, { locale: "@@bad@@", timeZone: "Bad/Zone" });
    }).not.toThrow();
    expect(typeof out).toBe("string");
    expect(out!.trim().length).toBeGreaterThan(0);
  });

  it("does not throw when options are omitted entirely", () => {
    let out: string | undefined;
    expect(() => {
      out = formatClock(FIXED_INSTANT);
    }).not.toThrow();
    expect(typeof out).toBe("string");
    expect(out!.trim().length).toBeGreaterThan(0);
    expect(digits(out!).length).toBeGreaterThanOrEqual(3);
  });
});
