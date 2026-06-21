# Add top-clock

## Why

The header needs a quiet sense of "now" for the visitor: a compact, accessible
live clock showing the visitor's own local time. It is deliberately separate from
the weather day/night logic (which uses the active location's sun times).
(FR-CLOCK-01.)

## What Changes

- A pure, framework-free time-format helper in `lib/clock` that formats an instant
  for a given locale + timezone, with a calm fallback when either is unresolvable.
- A small client `Clock` component that updates live, tears its timer down on
  unmount (silent console), and causes no layout shift as digits change.
- The clock is mounted into the existing TopBar clock slot.

## Impact

- Affected specs: top-clock (ADDED).
- Affected code: `lib/clock/format.ts`, `components/clock/Clock.tsx`,
  TopBar clock-slot wiring (`components/shell/AppShell.tsx` / `app/layout.tsx`),
  one i18n key for the clock accessible name (already added: `clockRegionLabel`).
- Dependencies: add-app-shell (TopBar clock slot).
