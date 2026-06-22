// Derive the active location's local "now" wall-clock string for the scene
// resolver (FR-ANIM-02, TC-PURE-01). Framework-free: no next/*, react, or DOM
// imports — only the standard `Intl.DateTimeFormat` runtime global.
//
// The caller supplies the current instant (a `Date`) plus the location's IANA
// timezone (the forecast `timezone`, e.g. "Europe/Kyiv"). We format that single
// instant INTO the location's timezone to get its local wall clock — this is the
// active location's "now", independent of the visitor's own timezone. We never
// use `toISOString().slice(...)` (which would yield UTC, not the location).
//
// TOTAL / fail-calm (NFR-OBS-01): an unresolvable timezone returns `undefined`
// so `skyScene` falls back to its DAY default rather than throwing.

const PARTS_OPTIONS_BASE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/**
 * Format `instant` as the location-local "YYYY-MM-DDTHH:mm" wall-clock string
 * for `timeZone`. Returns `undefined` for an unresolvable timezone. Pure (does
 * not mutate `instant`) and never throws.
 */
export function localNow(instant: Date, timeZone: string): string | undefined {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      ...PARTS_OPTIONS_BASE,
      timeZone,
    }).formatToParts(instant);

    const get = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((part) => part.type === type)?.value ?? "";

    const year = get("year");
    const month = get("month");
    const day = get("day");
    let hour = get("hour");
    const minute = get("minute");

    // Some runtimes render midnight as "24" under hour12:false; normalize it.
    if (hour === "24") hour = "00";

    if (!year || !month || !day || !hour || !minute) return undefined;
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return undefined;
  }
}
