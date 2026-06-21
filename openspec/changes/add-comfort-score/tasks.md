# Tasks — add-comfort-score

> Pure-logic slice (no DB, no fetch). The "smoke test" is the exhaustive unit
> suite plus the badge rendering. FR-COMFORT-04/05 placement on day cards / grid
> is wired by the forecast slice; here we deliver the logic + badge + tests.

## 1. Contracts
- [ ] 1.1 Define input/output types in `lib/scoring/comfort.ts`
        (`DailyComfortInput`, result `{ value; rationale }`, band type).

## 2. Failing tests first (red) — from the spec, before implementation
- [ ] 2.1 `lib/scoring/comfort.test.ts`: purity (no framework needed), determinism,
        all-five-inputs monotonicity, pleasant ≥70, hostile <40, value is integer
        in 0..100, missing/undefined/NaN/non-numeric/empty-object do not throw.
        `@trace FR-COMFORT-01, FR-COMFORT-02`.
- [ ] 2.2 Rationale tests: single Ukrainian sentence, ≤80 chars, no emoji, no "!".
        `@trace FR-COMFORT-03`.
- [ ] 2.3 `lib/scoring/band.test.ts`: half-open bands — 70→green, 69→yellow,
        40→yellow, 39→red, boundary exactness. `@trace FR-COMFORT-04`.
- [ ] 2.4 `lib/scoring/weekend.test.ts`: weekend average = round-half-up mean of
        upcoming Sat+Sun by LOCAL date; one-day-only case; ignores visitor clock /
        UTC slice. `@trace FR-COMFORT-05`.
- [ ] 2.5 Eval case `evals/cases/comfort-score.eval.ts`: rationale quality
        (calm Ukrainian, ≤80, accurate to conditions, no "!"/emoji) across a few
        representative days. `@trace FR-COMFORT-03`.
- [ ] 2.6 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [ ] 3.1 `lib/scoring/comfort.ts` — `comfortScore` (weighted, monotonic, total,
        clamped+rounded) + `toNumber` guard + rationale templates.
- [ ] 3.2 `lib/scoring/band.ts` — `comfortBand(value)` half-open helper.
- [ ] 3.3 `lib/scoring/weekend.ts` — `weekendComfort(days)` local-date, round-half-up,
        one-day-only handling.
- [ ] 3.4 i18n keys for badge accessible name + rationale labels.

## 4. Badge component
- [ ] 4.1 `components/comfort/ComfortBadge.tsx` — value + band color + accessible
        Ukrainian name (not color-only).

## 5. Validation, docs, archive prep
- [ ] 5.1 `npm run test:run` (green)
- [ ] 5.2 `npm run lint`
- [ ] 5.3 `npx tsc --noEmit`
- [ ] 5.4 `npm run build`
- [ ] 5.5 `npx openspec validate add-comfort-score --strict` + `--all --strict`
- [ ] 5.6 Run review-gate; fix confirmed findings; re-run 5.1–5.5.
- [ ] 5.7 Update `docs/current-state.md`.
- [ ] 5.8 Coverage: confirm `lib/scoring/*` near-100% branch.
- [ ] 5.9 Archive after 5.1–5.8: `npx openspec archive add-comfort-score --yes`.
