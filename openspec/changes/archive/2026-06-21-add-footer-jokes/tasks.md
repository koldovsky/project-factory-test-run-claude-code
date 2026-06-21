# Tasks — add-footer-jokes

> Pure list + selector + a server-rendered footer line. Smoke = unit tests + a
> real browser render (joke visible, no hydration warning) verified at G6.

## 1. Contracts
- [x] 1.1 `JOKES: readonly string[]`, `selectJoke(index, jokes?): string`,
        `dayOfYear(date): number` signatures in `lib/jokes`.

## 2. Failing tests first (red)
- [x] 2.1 `lib/jokes/select.test.ts`: same index → same joke (deterministic);
        bounds for index 0, large, and negative (sign-safe modulo, always a valid
        joke, never empty/throw); rotation (two different days → different jokes);
        empty-list → calm fallback string (no throw). `@trace FR-JOKES-01`.
- [x] 2.2 `lib/jokes/jokes.test.ts`: list non-empty; every joke Ukrainian
        (Cyrillic) with no exclamation mark. `@trace FR-JOKES-01, NFR-I18N-01`.
- [x] 2.3 `lib/jokes/dayOfYear.test.ts`: deterministic day-of-year for fixed dates.
        `@trace FR-JOKES-01`.
- [x] 2.4 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [x] 3.1 `lib/jokes/jokes.ts` — curated Ukrainian weather jokes (calm, no "!").
- [x] 3.2 `lib/jokes/select.ts` — pure total `selectJoke` (sign-safe modulo,
        empty-list fallback) + `dayOfYear`. No next/react/DOM/randomness.
- [x] 3.3 `components/shell/Footer.tsx` — server-render the selected joke
        (index = dayOfYear(today)); calm plain text; graceful empty fallback.

## 4. Validation, docs, archive prep
- [x] 4.1 `npm run test:run` (green)
- [x] 4.2 `npm run lint`
- [x] 4.3 `npx tsc --noEmit`
- [x] 4.4 `npm run build`
- [x] 4.5 `npx openspec validate add-footer-jokes --strict` + `--all --strict`
- [x] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
        (0 confirmed; all findings adversarially rejected.)
- [x] 4.7 Update `docs/current-state.md`.
- [x] 4.8 Archive after 4.1–4.7: `npx openspec archive add-footer-jokes --yes`.
