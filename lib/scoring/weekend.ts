// Upcoming-weekend comfort average (FR-COMFORT-05).
//
// Pure & framework-free (TC-PURE-01): no next/*, react, or DOM imports.
//
// "Weekend" = the upcoming Saturday and Sunday by each day's LOCAL calendar date
// string (Open-Meteo `daily.time` is already location-local via timezone=auto).
// The weekday is derived ARITHMETICALLY from the "YYYY-MM-DD" string — never via
// `new Date(date).toISOString().slice(0,10)` (which shifts to UTC) and never from
// the visitor clock — so the result is timezone-invariant.

export interface WeekendDay {
  /** "YYYY-MM-DD", LOCAL to the active location. */
  date: string;
  /** Integer comfort score 0..100 for that day. */
  value: number;
}

export interface WeekendComfort {
  /** Rounded-half-up integer mean of the available weekend days. */
  value: number;
  /** How many weekend days were found in the window (1 or 2). */
  dayCount: 1 | 2;
  /** True when only one weekend day was available. */
  partial: boolean;
}

/**
 * Day-of-week (0 = Sunday … 6 = Saturday) for a LOCAL "YYYY-MM-DD" string,
 * computed purely from the parsed integers. `Date.UTC` is used only as a
 * calendar calculator on fixed numbers, so the answer never depends on the host
 * timezone. Returns null for an unparseable string.
 */
function weekdayFromLocalDate(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Round half up to the nearest integer (e.g. 70.5 -> 71, 0.5 -> 1). */
function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

/**
 * Find the upcoming weekend (first Saturday/Sunday in chronological order) and
 * return the round-half-up mean of the available weekend days' integer scores.
 * Returns null when the window contains no weekend day.
 */
export function weekendComfort(days: WeekendDay[]): WeekendComfort | null {
  if (!Array.isArray(days) || days.length === 0) return null;

  // Sort chronologically by the local date string (lexicographic order on
  // zero-padded "YYYY-MM-DD" is chronological) so "upcoming" is unambiguous.
  const ordered = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let saturday: WeekendDay | null = null;
  let sunday: WeekendDay | null = null;

  for (const day of ordered) {
    const weekday = weekdayFromLocalDate(day.date);
    if (weekday === 6) {
      // First Saturday anchors the upcoming weekend.
      if (saturday === null) saturday = day;
    } else if (weekday === 0) {
      if (sunday === null) sunday = day;
    }
    // Once we hold the first Saturday, only its paired (next-day) Sunday counts.
    if (saturday !== null && sunday !== null) break;
  }

  // If we found a Saturday, the matching Sunday must be that Saturday's next
  // day; a Sunday that precedes the first Saturday belongs to an earlier
  // weekend and is ignored. If we only found a Sunday, it stands alone.
  if (saturday !== null && sunday !== null) {
    if (sunday.date < saturday.date) sunday = null;
  }

  const available: WeekendDay[] = [];
  if (saturday !== null) available.push(saturday);
  if (sunday !== null) available.push(sunday);

  if (available.length === 0) return null;

  const sum = available.reduce((acc, d) => acc + d.value, 0);
  const value = roundHalfUp(sum / available.length);
  const dayCount = available.length as 1 | 2;

  return { value, dayCount, partial: dayCount === 1 };
}
