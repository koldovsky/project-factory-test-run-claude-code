# Design — add-top-clock

## Goals / Non-goals

- **Goals:** live visitor-local clock; pure testable formatter; accessible name;
  no layout shift; silent timer teardown; hydration-safe.
- **Non-goals:** world clock, timezone picker, any binding to the weather
  location (explicit exclusions).

## Key decisions

1. **Pure formatter `lib/clock/format.ts`:** `formatClock(date, { locale, timeZone })`
   → `string` using `Intl.DateTimeFormat` (a standard runtime global, not a
   framework API, so TC-PURE-01 holds — no next/react/DOM). On an invalid
   locale/timeZone it catches and falls back to a safe default format rather than
   throwing (calm).
2. **Client `Clock` component:** `"use client"`; a `setInterval` (1s) updates a
   `useState` time; cleared in the effect cleanup (silent teardown, NFR-OBS-01).
3. **Hydration safety:** the exact current time differs between SSR and client,
   which would cause a hydration mismatch. Render a stable placeholder (or
   `suppressHydrationWarning` with the same initial value) until mounted, then
   show the live time. Chosen: render an empty/`--:--` placeholder server-side and
   the real time after mount (the clock has no SSR-meaningful value).
4. **No layout shift:** use `tabular-nums` (fixed-width digits) and a stable
   format so width never changes as digits/minutes roll over.
5. **Accessible name:** the clock element carries an `aria-label` from i18n
   (`clockRegionLabel`, "Місцевий час") so screen readers announce it as the
   local time, not a bare number string.

## Data model

Pure: `formatClock(date: Date, opts: { locale?: string; timeZone?: string }): string`.

## Error handling

`formatClock` never throws; unresolvable locale/timeZone → safe default. The
component renders the placeholder if the time is not yet available.

## Risks & mitigations

- **Hydration mismatch:** mount-guard placeholder (decision 3) — the most common
  Next.js clock bug.
- **Interval leak:** effect cleanup clears the interval; verified by the spec's
  silent-teardown scenario (browser/console check at G6).
