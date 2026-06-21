# Tasks — add-footer-jokes

> Pure list + selector + a server-rendered footer line. Smoke = unit tests + a
> real browser render (joke visible, no hydration warning) verified at G6.

## 1. Contracts
- [ ] 1.1 `JOKES: readonly string[]`, `selectJoke(index, jokes?): string`,
        `dayOfYear(date): number` signatures in `lib/jokes`.

## 2. Failing tests first (red)
- [ ] 2.1 `lib/jokes/select.test.ts`: same index → same joke (deterministic);
        bounds for index 0, large, and negative (sign-safe modulo, always a valid
        joke, never empty/throw); rotation (two different days → different jokes);
        empty-list → calm fallback string (no throw). `@trace FR-JOKES-01`.
- [ ] 2.2 `lib/jokes/jokes.test.ts`: list non-empty; every joke Ukrainian
        (Cyrillic) with no exclamation mark. `@trace FR-JOKES-01, NFR-I18N-01`.
- [ ] 2.3 `lib/jokes/dayOfYear.test.ts`: deterministic day-of-year for fixed dates.
        `@trace FR-JOKES-01`.
- [ ] 2.4 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [ ] 3.1 `lib/jokes/jokes.ts` — curated Ukrainian weather jokes (calm, no "!").
- [ ] 3.2 `lib/jokes/select.ts` — pure total `selectJoke` (sign-safe modulo,
        empty-list fallback) + `dayOfYear`. No next/react/DOM/randomness.
- [ ] 3.3 `components/shell/Footer.tsx` — server-render the selected joke
        (index = dayOfYear(today)); calm plain text; graceful empty fallback.

## 4. Validation, docs, archive prep
- [ ] 4.1 `npm run test:run` (green)
- [ ] 4.2 `npm run lint`
- [ ] 4.3 `npx tsc --noEmit`
- [ ] 4.4 `npm run build`
- [ ] 4.5 `npx openspec validate add-footer-jokes --strict` + `--all --strict`
- [ ] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
- [ ] 4.7 Update `docs/current-state.md`.
- [ ] 4.8 Archive after 4.1–4.7: `npx openspec archive add-footer-jokes --yes`.
