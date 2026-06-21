# Add comfort-score

## Why

Travellers need a single at-a-glance signal for whether a day is good for being
outdoors. `comfortScore(daily)` turns one day's weather into a 0–100 value plus a
short Ukrainian rationale, and the band (green/yellow/red) lets people compare
days and weekends instantly. It is a pure, framework-free function so it is fully
unit-testable. (FR-COMFORT-01..05, TC-PURE-01.)

## What Changes

- `lib/scoring/comfort.ts` — pure, total `comfortScore(daily): { value:0..100; rationale }`
  from feels-like temp, precip probability, wind, cloud cover, UV index.
- Band helper (green ≥ 70, yellow 40–69, red < 40, half-open) and a
  weekend-average helper (mean of upcoming Sat+Sun by the location's local date,
  rounded half-up).
- A reusable `ComfortBadge` component (value + band styling + accessible Ukrainian
  name, not color-only) that the forecast slice places on day cards and the
  weekend summary.

## Impact

- Affected specs: comfort-score (ADDED).
- Affected code: `lib/scoring/comfort.ts` (+ helpers), `components/comfort/ComfortBadge.tsx`,
  i18n keys for the badge/rationale labels.
- Dependencies: none new. The badge's placement on day cards / top-of-grid is
  wired by the forecast slice (FR-COMFORT-04/05 demonstrated there); this slice
  delivers the pure logic + the badge component + exhaustive unit tests.
