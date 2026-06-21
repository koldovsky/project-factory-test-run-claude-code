# Design — add-comfort-score

## Goals / Non-goals

- **Goals:** a pure, total, deterministic scoring function; a monotonic, sensible
  0–100 scale; a calm ≤80-char Ukrainian rationale; band + weekend-average
  helpers; a reusable accessible badge component.
- **Non-goals:** data fetching (forecast slice), placing the badge on day cards /
  the grid (forecast slice consumes the badge + helpers), user-tunable thresholds.

## Key decisions

1. **Scoring model (documented & fixed for MVP).** Combine five normalized
   sub-scores into a weighted average, then clamp+round to an integer 0..100:
   - feels-like temperature: peak comfort ~18–24 °C, falling off toward cold/hot.
   - precipitation probability: higher = worse (linear penalty).
   - wind: higher = worse (penalty above a light-breeze threshold).
   - cloud cover: mild effect, slight penalty toward fully overcast.
   - UV index: penalty for very high UV.
   Weights (proposal): feels-like 0.40, precipitation 0.25, wind 0.20,
   cloud 0.05, UV 0.10. The function MUST be monotonic per the spec's
   "worse input ⇒ score ≤" scenario. Weights/curves are fixed for MVP.
2. **Total & safe.** Every input is coerced through a `toNumber` guard that maps
   `undefined`/`NaN`/non-numeric/`null` to a neutral default (so the function
   never throws and always returns an in-range integer). Missing inputs degrade
   gracefully rather than crashing.
3. **Rationale generation.** Pick a single Ukrainian sentence from a small set of
   templates keyed by the dominant driver (e.g. cold, wet, windy, pleasant),
   guaranteed ≤ 80 chars, no emojis, no "!" — verified by tests.
4. **Weekend average.** `weekendComfort(days)` finds the upcoming Saturday and
   Sunday by each day's LOCAL date string (from the forecast's `daily.time`,
   which is location-local via `timezone=auto`), averages their integer scores
   with round-half-up, and handles the one-day-only case. Never uses
   `toISOString().slice(0,10)` or the visitor clock.
5. **Badge component.** `ComfortBadge` renders the value with band color AND a
   text/accessible name (Ukrainian) so it never relies on color alone (NFR-A11Y).

## Data model

Pure TypeScript. Input `DailyComfortInput` = a structural type with optional
`feelsLikeC`, `precipProbability`, `windKmh`, `cloudCover`, `uvIndex` (all
`number | undefined`, tolerant of bad data). Output `{ value: number; rationale: string }`.
Band type `'green' | 'yellow' | 'red'`.

## Error handling

The function is total — it cannot error on input. The badge component renders a
calm fallback if given an out-of-range value (clamped by the helper anyway).

## Risks & mitigations

- **Monotonicity vs rationale coupling:** keep scoring and rationale independent;
  test monotonicity on `value` only.
- **Round-half-up correctness:** test `.5` means explicitly (e.g. 70+71 ⇒ 71).
- **Local-date weekend resolution:** test with location-local date strings that
  differ from UTC/visitor clock.
