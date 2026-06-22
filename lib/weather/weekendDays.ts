// Pure selection of the UPCOMING Saturday and Sunday from one city's mapped
// forecast days (FR-COMPARE-02, TC-PURE-01).
//
// Framework-free: no next/*, react, or DOM. The weekday is derived
// ARITHMETICALLY from each day's LOCAL "YYYY-MM-DD" string via `Date.UTC` used
// purely as a calendar calculator on fixed integers — never
// `new Date(s).toISOString().slice(0,10)` (which parses the string in UTC and,
// in a timezone behind UTC, shifts the day) and never the visitor clock. The
// result is therefore timezone-invariant under every `process.env.TZ`.
//
// The "upcoming" weekend is the FIRST Saturday in chronological order and the
// Sunday that immediately follows it: a Sunday that precedes the first Saturday
// belongs to an earlier weekend and is ignored, and a lone Saturday or lone
// Sunday returns the other side as null. Returns both null when the window holds
// no weekend day. Pure and TOTAL — tolerates an empty list, a non-array, and
// malformed/missing date strings; never throws; never mutates the input.

import type { DailyForecast } from "./types";

// `getUTCDay()` order: 0 = Sunday … 6 = Saturday.
const SATURDAY = 6;
const SUNDAY = 0;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Parse a strict local "YYYY-MM-DD" string into the comparable parts the
 * selection needs: its weekday (0..6) and a chronological sort key (the day
 * count since the epoch). Returns null for any malformed / invalid / non-string
 * input so the caller skips it rather than throwing.
 */
function parseLocalDate(
  value: unknown,
): { weekday: number; order: number } | null {
  if (typeof value !== "string") return null;

  // Strict "YYYY-MM-DD": reject "2026/06/20", "20260620", trailing time, etc.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  if (day < 1 || day > maxDay) return null;

  // `Date.UTC` is a pure calendar calculator on these fixed integers, so neither
  // the weekday nor the ordering depends on the host timezone.
  const utc = Date.UTC(year, month - 1, day);
  return {
    weekday: new Date(utc).getUTCDay(),
    order: Math.floor(utc / 86_400_000),
  };
}

/**
 * Find the upcoming Saturday and the Sunday immediately after it from a city's
 * own local forecast dates. Returns the SAME day-object references passed in
 * (never copies) so the caller can read hi/lo, precip %, and feed `comfortScore`.
 */
export function weekendDays(days: DailyForecast[]): {
  saturday: DailyForecast | null;
  sunday: DailyForecast | null;
} {
  if (!Array.isArray(days)) return { saturday: null, sunday: null };

  // First Saturday in chronological order (input may be unordered): track the
  // smallest ordering key among Saturdays and the day object that owns it.
  let saturday: DailyForecast | null = null;
  let saturdayOrder = Number.POSITIVE_INFINITY;

  for (const day of days) {
    const parsed = parseLocalDate(day?.date);
    if (parsed === null || parsed.weekday !== SATURDAY) continue;
    if (parsed.order < saturdayOrder) {
      saturday = day;
      saturdayOrder = parsed.order;
    }
  }

  if (saturday === null) {
    // No Saturday in the window: the only weekend day we can offer is the first
    // chronological Sunday (a lone Sunday). None → both null.
    let sunday: DailyForecast | null = null;
    let sundayOrder = Number.POSITIVE_INFINITY;
    for (const day of days) {
      const parsed = parseLocalDate(day?.date);
      if (parsed === null || parsed.weekday !== SUNDAY) continue;
      if (parsed.order < sundayOrder) {
        sunday = day;
        sundayOrder = parsed.order;
      }
    }
    return { saturday: null, sunday };
  }

  // The Sunday that immediately follows the chosen Saturday is exactly one day
  // later (order + 1); a Sunday before it belongs to an earlier weekend.
  let sunday: DailyForecast | null = null;
  for (const day of days) {
    const parsed = parseLocalDate(day?.date);
    if (parsed === null || parsed.weekday !== SUNDAY) continue;
    if (parsed.order === saturdayOrder + 1) {
      sunday = day;
      break;
    }
  }

  return { saturday, sunday };
}
