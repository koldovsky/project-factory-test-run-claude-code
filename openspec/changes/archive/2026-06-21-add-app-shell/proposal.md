# Add app-shell

## Why

The app shell is the foundation every other capability mounts into: the top bar
(logo, theme indicator, clock slot), the responsive main area, and the footer
crediting the data providers. It also establishes three contracts the whole app
reuses: the active-location state (URL `?lat&lon&name` + validation), the
Ukrainian-first i18n string table, and the inline calm error-surface pattern.
(FR-SHELL-01, FR-SHELL-02, FR-SHELL-03.)

## What Changes

- A root layout + shell: top bar (logo + system-preference theme indicator + a
  slot for the clock), one `<main>`, a footer with Open-Meteo + OpenStreetMap
  hyperlinks.
- Responsive layout: 1 column < 768 px, 2 columns 768–1279 px, 3 columns ≥ 1280 px.
- First-load empty state (hero + centered search slot) when no location params;
  deep-link (`?lat&lon&name`) loads the location directly; invalid params fall
  back calmly to the empty state with an inline message.
- Theme follows `prefers-color-scheme`; AA contrast both themes; no manual toggle.
- `lib/i18n/uk.ts` (primary) + `en.ts` (fallback) + a typed string accessor.
- `lib/location/` — pure active-location type, URL parse/validate/serialize.
- A shared inline error/notice component (the calm, no-toast, never-500 pattern).
- Shell sets no cookies.

## Impact

- Affected specs: app-shell (ADDED).
- Affected code: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`,
  `components/shell/*`, `components/ui/*` (shadcn base), `lib/i18n/*`,
  `lib/location/*`.
- Dependencies: none new beyond Phase-0 deps (shadcn primitives generated here).
- Establishes contracts consumed by every later slice (city-search fills the
  search slot; top-clock fills the clock slot; forecast/map/etc. read the
  active-location state).
