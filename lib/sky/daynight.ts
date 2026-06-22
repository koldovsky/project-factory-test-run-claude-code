// Pure day/night decision from the ACTIVE LOCATION's local wall clock
// (FR-ANIM-02, TC-PURE-01). Framework-free: no next/*, react, or DOM imports,
// and — critically — no `Date` construction from the wall-clock strings and no
// `toISOString().slice(...)`. The host/visitor clock and timezone are never
// read, so the result is host-timezone-independent.
//
// All three inputs are the location's LOCAL wall-clock strings shaped like the
// forecast `sunrise`/`sunset` fields: "YYYY-MM-DDTHH:mm" (optionally with ":ss").
// The decision compares wall-clock components directly: it converts each string
// to a single comparable ordinal (… → days → minutes) without ever touching a
// timezone, so a string like "2026-06-21T23:30" can never roll into an adjacent
// calendar day the way a UTC-built Date in a behind-UTC host would.

const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Convert a local "YYYY-MM-DDTHH:mm[:ss]" string into a single monotonically
 * increasing ordinal (in minutes from a fixed epoch) for direct comparison.
 * Returns `null` for any missing / empty / malformed string. Pure arithmetic on
 * the parsed components — no Date, no timezone, never throws.
 */
function toOrdinalMinutes(value: string | undefined): number | null {
  if (typeof value !== "string") return null;
  const match = DATE_TIME.exec(value.trim());
  if (match === null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  // Reject impossible component ranges (e.g. month 13, hour 24) so a malformed
  // but regex-shaped value falls back to DAY rather than skewing the ordinal.
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour > 23) return null;
  if (minute > 59) return null;

  // A coarse year/month/day ordinal is sufficient: comparisons only ever happen
  // among same-day values, and a non-overlapping month stride keeps ordering
  // total even across month/year boundaries. Seconds are intentionally ignored
  // (sun times and "now" compare at minute resolution).
  const dayOrdinal = (year * 12 + (month - 1)) * 31 + (day - 1);
  return dayOrdinal * 24 * 60 + hour * 60 + minute;
}

/**
 * True when `nowLocal` is at/after sunrise and strictly before sunset
 * (sunrise inclusive, sunset exclusive), using the active location's local
 * wall-clock strings only.
 *
 * TOTAL / fail-calm (NFR-OBS-01): missing, empty, or unparseable sun times — or
 * an unparseable `nowLocal` — default to DAY (true). Never throws, never reads
 * the host clock or UTC.
 */
export function isDaytime(
  nowLocal: string,
  sunrise?: string,
  sunset?: string,
): boolean {
  const sunriseOrdinal = toOrdinalMinutes(sunrise);
  const sunsetOrdinal = toOrdinalMinutes(sunset);

  // Missing / unparseable sun times → default DAY (fail-calm).
  if (sunriseOrdinal === null || sunsetOrdinal === null) return true;

  const nowOrdinal = toOrdinalMinutes(nowLocal);
  // Unparseable "now" → default DAY rather than guessing night.
  if (nowOrdinal === null) return true;

  return nowOrdinal >= sunriseOrdinal && nowOrdinal < sunsetOrdinal;
}
