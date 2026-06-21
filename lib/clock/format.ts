// Pure, framework-free clock-time formatter (FR-CLOCK-01, TC-PURE-01).
//
// No next/*, no react, no DOM globals — only the standard `Intl.DateTimeFormat`
// runtime global. Deterministic for identical inputs and total (NFR-OBS-01): it
// never throws and never returns a blank value. An unresolvable locale or
// timeZone falls back to a safe default rather than crashing, so the clock can
// always render a readable time.

export interface FormatClockOptions {
  /** BCP-47 tag, e.g. "uk-UA". Defaults to a safe locale. */
  locale?: string;
  /** IANA zone, e.g. "Europe/Kyiv". Defaults to a safe zone. */
  timeZone?: string;
}

// Safe defaults used both as the standing default and as the calm fallback when
// a caller-supplied locale/timeZone cannot be resolved. `undefined` lets the
// runtime pick its own default (the host locale / zone), which is always valid.
const SAFE_LOCALE: string | undefined = "uk-UA";
const SAFE_TIME_ZONE: string | undefined = undefined;

// Fixed display options: 24-hour HH:MM, no seconds. `hour12: false` ensures
// "12:05" (not "12:05 PM") for uk-UA in Europe/Kyiv at 09:05:07Z.
const BASE_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/**
 * Format `date` as a 24-hour HH:MM wall-clock string for the given locale and
 * timeZone. Pure and total: identical inputs yield an identical string, the
 * input Date is never mutated, and the call never throws.
 */
export function formatClock(date: Date, opts?: FormatClockOptions): string {
  const locale = opts?.locale;
  const timeZone = opts?.timeZone;

  // 1. Try exactly what the caller asked for.
  const exact = tryFormat(date, locale, timeZone);
  if (exact !== null) return exact;

  // 2. The locale and/or timeZone was unresolvable. Fall back to safe defaults,
  //    preserving any caller value that on its own resolves (so a bad timeZone
  //    does not discard a good locale, and vice versa).
  const safeLocale = tryFormat(date, locale, SAFE_TIME_ZONE) !== null
    ? locale
    : SAFE_LOCALE;
  const safeTimeZone = tryFormat(date, SAFE_LOCALE, timeZone) !== null
    ? timeZone
    : SAFE_TIME_ZONE;

  const fallback = tryFormat(date, safeLocale, safeTimeZone);
  if (fallback !== null) return fallback;

  // 3. Last resort: the runtime default locale and zone, which are always valid.
  const runtimeDefault = tryFormat(date, undefined, undefined);
  return runtimeDefault ?? "--:--";
}

/**
 * Attempt one `Intl.DateTimeFormat` pass. Returns the formatted string, or
 * `null` if the locale/timeZone is unresolvable. Never throws.
 */
function tryFormat(
  date: Date,
  locale: string | undefined,
  timeZone: string | undefined,
): string | null {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      ...BASE_OPTIONS,
      ...(timeZone ? { timeZone } : {}),
    });
    return formatter.format(date);
  } catch {
    return null;
  }
}
