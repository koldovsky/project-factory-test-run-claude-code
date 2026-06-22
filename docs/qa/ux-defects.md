# UX Defect Register (obvious-behavior audit)

Found by an independent maker≠checker audit (the `ux-defect-audit` workflow: four
UX-lens reviewers over the codebase, each finding adversarially verified by a
separate triage agent) plus the automated Playwright harness, on 2026-06-22.
20 raw findings → 19 unique → 15 confirmed; after de-duplicating the same root
cause, **7 distinct defects**. All are fixed and validated by
`e2e/recordings.spec.ts` and/or unit tests.

Verification convention: each fix is proven by a passing assertion (Playwright
clip or unit test), not just by inspection.

| BUG | Severity | Defect | Fix | Proven by |
|---|---|---|---|---|
| **BUG-001** | major | No city search anywhere on the forecast view — after viewing one city you could not look up another without editing the URL or hitting back (the city-search change's own `proposal.md` planned a header mount that was never built). | Render `<CitySearch />` in the forecast branch (`app/page.tsx`) so search is reachable from every state. | `clip-navigation-reachability` (searches a new city from a forecast), `clip-compare-multi-mobile` |
| **BUG-002** | major | The top-bar logo/app-name looked like a home link but was an inert `<span>` — no escape back to search. | Wrap the brand in `<Link href="/">` with an i18n accessible name + focus ring (`TopBar.tsx`). | `clip-navigation-reachability` asserts a home link |
| **BUG-003** | minor | `getCurrentPosition` had no timeout — "Use my location" could spin forever if no fix ever resolved. | Pass `{ timeout: 10000, maximumAge: 60000 }`; the existing error path re-enables the button (`CitySearch.tsx`). | code review + manual MT-04 |
| **BUG-004** | minor | When `navigator.geolocation` is absent, the button returned silently — looked dead. | Show a calm inline `searchGeoUnsupported` note instead of a no-op (`CitySearch.tsx`, i18n). | code review + manual |
| **BUG-005** | minor | Focus dropped to `<body>` after navigating to a city (no focus to the new heading). | `CityHeading` (client) takes focus (`tabIndex={-1}`) on name change (`app/page.tsx`). | `clip-navigation-reachability` asserts `activeElement` is the `<h1>` |
| **BUG-006** | minor | The unpin "✕" was a 24px tap target crowded against the city name. | Enlarge to a 36px target (`size-9`) and `gap-2` spacing (`PinBar.tsx`). | `clip-weekend-compare` asserts the box ≥ 32px |
| **BUG-007** | minor | The compare table forced horizontal scrolling on mobile with no affordance. | Stack columns vertically below `md` (`w-full` / `flex-col`), row layout from `md` (`CompareTable.tsx`). | `clip-compare-multi-mobile` asserts no horizontal page overflow at 390px with 2 cities |
| **BUG-008** | major | The theme control looked interactive but did nothing on click (read-only indicator). | Real clickable `ThemeToggle` (system default + light/dark override, no-flash, localStorage); ADR-0007. | `clip-theme-toggle` asserts a click changes `data-theme` |
| **BUG-009** | major | Poor color contrast / readability: dark mode rendered as a light-blue page (theme-independent sky), the footer joke was faint (`muted/80`), and the forecast search sat low-contrast over the sky. | Dark veil over the sky in dark mode; footer joke → full `muted-foreground`; readable backing panel for the forecast search + stronger heading scrim. | axe a11y/contrast suite (light + dark) + vision verification of every clip |

## How these were caught (the approach gap that let them ship)

The first audit was **code/DOM only** — it never measured contrast or looked at
pixels, so it missed BUG-008 (perceived affordance) and BUG-009 (readability).
The fix to the *process* (ADR-0008): **axe** for measurable contrast/a11y, and
**vision verification** — a fresh agent looks at each recording's proof still and
confirms the requirement is visibly met + readable. The vision pass immediately
caught a real low-contrast forecast-search state and frames that captured the
wrong moment; both were fixed and re-recorded until vision-met.

## Not defects (verified before claiming)

- **Reduced-motion particles** — the harness first flagged `.sky-particles` as
  visible under `prefers-reduced-motion`. An empirical check (matchMedia +
  computed style in headless Chromium) showed `display:none` correctly applies
  under `reduce`; the failure was a harness-emulation bug (`test.use` vs
  `page.emulateMedia`), not an app defect. Fixed the test, not the app.
- The four pre-approved intentional decisions (OS theme + indicator, no toggle;
  map click = coordinate label per ADR-0004; native suggestion button-list, not a
  combobox; in-memory pins, no persistence) were re-confirmed as intentional and
  excluded from the register.

## Process note

The defect class — "a feature reachable from only one render branch" — is now
guarded: `clip-navigation-reachability` asserts search/home are reachable from a
forecast, so a regression that re-hides search fails the gate.
