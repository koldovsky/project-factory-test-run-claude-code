// Pure near-term date resolution (docs/day-03-skills-demo.md).
//
// Framework-free (TC-PURE-01): `today` is injected so the module never reads the
// clock — the route passes `new Date()`. Never throws.

export type WhenKeyword = "today" | "tomorrow" | "this-weekend" | "next-3-days";

const KNOWN: WhenKeyword[] = ["today", "tomorrow", "this-weekend", "next-3-days"];

// Bound an explicit date list so an unauthenticated caller can't pass thousands
// of entries into the per-city work / response echo. 14 covers any near-term ask.
const MAX_DATES = 14;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Concrete dates for a `when` keyword, relative to `today`. */
export function datesFromWhen(when: WhenKeyword, today: Date): string[] {
  switch (when) {
    case "today":
      return [ymd(today)];
    case "tomorrow":
      return [ymd(addDays(today, 1))];
    case "next-3-days":
      return [ymd(today), ymd(addDays(today, 1)), ymd(addDays(today, 2))];
    case "this-weekend": {
      const satOffset = (6 - today.getDay() + 7) % 7; // 0 if today is Saturday
      const sat = addDays(today, satOffset);
      return [ymd(sat), ymd(addDays(sat, 1))];
    }
  }
}

/**
 * Resolve `{ dates?, when? }` to a concrete date list. Honours an explicit list
 * only if it has usable "YYYY-MM-DD" strings; otherwise falls back to the `when`
 * keyword (default "this-weekend") rather than returning [].
 */
export function resolveDates(input: { dates?: unknown; when?: unknown }, today: Date): string[] {
  if (Array.isArray(input?.dates)) {
    const explicit = input.dates.filter(
      (d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d),
    );
    if (explicit.length > 0) return Array.from(new Set(explicit)).slice(0, MAX_DATES);
  }
  const when = String(input?.when ?? "this-weekend") as WhenKeyword;
  return datesFromWhen(KNOWN.includes(when) ? when : "this-weekend", today);
}
