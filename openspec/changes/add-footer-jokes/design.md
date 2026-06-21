# Design — add-footer-jokes

## Goals / Non-goals

- **Goals:** local curated Ukrainian jokes; pure, total, deterministic selector;
  no hydration mismatch; calm presentation; graceful empty-list fallback.
- **Non-goals:** external joke API, user-submitted/editable jokes, joke analytics,
  any "next joke" control (explicit exclusions).

## Key decisions

1. **Curated list `lib/jokes/jokes.ts`:** a non-empty array of Ukrainian
   weather-themed jokes, calm tone, no exclamation marks. Verified by tests.
2. **Pure selector `lib/jokes/select.ts`:** `selectJoke(index: number, jokes = JOKES): string`
   — total: takes any integer (0, large, negative), reduces modulo the list length
   with a sign-safe modulo, returns a valid joke; never throws, never returns
   empty. If the list is empty, returns a calm static fallback string. No
   `Math.random`, no `Date.now`, no DOM (TC-PURE-01).
3. **Deterministic, hydration-safe rendering:** the Footer is a Server Component,
   so the joke is selected server-side and emitted as static HTML; client
   hydration reuses the same markup — no mismatch and no per-render randomness.
   The selection index is a stable day-of-year computed in the server component
   (so the joke rotates daily but is identical within one render). A pure
   `dayOfYear(date)` helper keeps the date→index logic testable.
4. **Calm fallback:** if `selectJoke` returns the fallback (empty list), the
   Footer still renders without a 500 or blank.

## Data model

Pure: `JOKES: readonly string[]`; `selectJoke(index, jokes?): string`;
`dayOfYear(date: Date): number`.

## Error handling

`selectJoke` is total (never throws); empty-list → calm fallback. The Footer
cannot crash on the joke line.

## Risks & mitigations

- **Hydration mismatch:** Footer is server-only; the joke is static in SSR HTML
  (decision 3) — no client recompute.
- **Sign-safe modulo:** `((index % n) + n) % n` so negative indices stay in range
  (tested).
