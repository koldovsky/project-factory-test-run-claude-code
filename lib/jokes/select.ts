// Pure, total, deterministic joke selection (FR-JOKES-01).
//
// Pure (TC-PURE-01): no next/*, no react, no DOM globals, no Math.random and
// no Date.now. `dayOfYear` reads ONLY its Date argument. This keeps the footer
// joke hydration-safe — the same index maps to the same joke on server and
// client for a given page load.

import { JOKES } from "./jokes";

// Calm static Ukrainian fallback used only in the degenerate empty-list state.
// Non-empty, contains Cyrillic, no exclamation mark (BC-BRAND-01).
const EMPTY_LIST_FALLBACK = "Сьогодні без жартів, зате з гарною погодою.";

/**
 * Select a joke for any integer `index`.
 *
 * Total and pure: reduces `index` modulo the list length with a SIGN-SAFE
 * modulo `((index % n) + n) % n`, so every integer — 0, very large, or
 * negative — maps to a valid entry. Never throws, never returns
 * null/undefined/empty. `jokes` defaults to the curated {@link JOKES}.
 *
 * If `jokes` is empty (a degenerate state), returns a single calm static
 * Ukrainian fallback string, identical for every index.
 */
export function selectJoke(index: number, jokes: readonly string[] = JOKES): string {
  const n = jokes.length;
  if (n === 0) {
    return EMPTY_LIST_FALLBACK;
  }
  // Sign-safe modulo keeps negatives and huge values in [0, n).
  const position = ((index % n) + n) % n;
  return jokes[position];
}

/**
 * 1-based ordinal day of the LOCAL calendar year for `date`.
 *
 * Pure and deterministic: reads only the date's local fields
 * (getFullYear/getMonth/getDate), never `toISOString()`/UTC, so the index does
 * not jump a day near midnight (AGENTS.md day-bound rule). Jan 1 → 1; Dec 31 →
 * 365 (or 366 in a leap year). Does not mutate the input.
 */
export function dayOfYear(date: Date): number {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
  const current = new Date(year, date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((current.getTime() - startOfYear.getTime()) / msPerDay) + 1;
}
