// Pure, total Ukrainian weekday from a LOCAL "YYYY-MM-DD" date string
// (FR-FORECAST-02, TC-PURE-01, BC-BRAND-01).
//
// Framework-free: no next/*, react, or DOM. The weekday is derived
// ARITHMETICALLY from the parsed integers via `Date.UTC` used purely as a
// calendar calculator on fixed numbers — never `new Date(s).toISOString()`
// (which would parse the string in UTC and shift the day) and never the visitor
// clock. The result is therefore timezone-invariant under every `process.env.TZ`.
//
// Returns "" (never the literal "undefined") for an unparseable / invalid date
// string or hostile non-string input, so the caller can omit the label rather
// than render "undefined". Never throws.

// `getUTCDay()` order: 0 = Sunday … 6 = Saturday. `пʼятниця` uses U+02BC
// (modifier letter apostrophe), the canonical Ukrainian orthography.
const UK_WEEKDAYS = [
  "неділя", // 0 Sunday
  "понеділок", // 1 Monday
  "вівторок", // 2 Tuesday
  "середа", // 3 Wednesday
  "четвер", // 4 Thursday
  "пʼятниця", // 5 Friday
  "субота", // 6 Saturday
] as const;

// Days per month; February handled with a leap-year check below.
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function ukWeekday(localDateStr: string): string {
  if (typeof localDateStr !== "string") return "";

  // Strict "YYYY-MM-DD": reject "2026/06/22", "20260622", trailing time, etc.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDateStr);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return "";
  const maxDay =
    month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  if (day < 1 || day > maxDay) return "";

  // `Date.UTC` is a pure calendar calculator on these fixed integers, so the
  // answer never depends on the host timezone.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return UK_WEEKDAYS[weekday] ?? "";
}
