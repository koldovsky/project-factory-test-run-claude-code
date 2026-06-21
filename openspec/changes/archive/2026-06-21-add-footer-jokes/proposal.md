# Add footer-jokes

## Why

The footer shows a single calm Ukrainian, weather-themed joke from a local
curated list — a small touch of personality with no external API and no tracking.
Selection is deterministic so server and client render identical text.
(FR-JOKES-01, BC-PRIVACY-01.)

## What Changes

- A curated in-repo list of Ukrainian weather jokes and a pure, total selector in
  `lib/jokes` (deterministic by a stable index; bounds-safe; never throws).
- The footer renders the selected joke as calm plain text, degrading gracefully
  if the list is somehow empty.

## Impact

- Affected specs: footer-jokes (ADDED).
- Affected code: `lib/jokes/jokes.ts` (list), `lib/jokes/select.ts` (selector),
  `components/shell/Footer.tsx` (render the joke).
- Dependencies: add-app-shell (Footer).
