// Bounded query-history log (docs/day-03-skills-demo.md §7).
//
// Each published recommendation is appended here so the app can offer a real
// history (not just the last result). This is the pure, testable core — newest
// first, capped length; the file IO lives in the skill runner.
// Framework-free (TC-PURE-01): no next/*, react, or DOM imports.

import type { Recommendation } from "./types";

export interface HistoryEntry extends Recommendation {
  /** ISO timestamp the entry was produced (stamped by the IO layer). */
  generatedAt: string;
  /** Stable id for list keys / selection. */
  id: string;
}

export const HISTORY_CAP = 20;

/**
 * Prepend `entry` to the existing log (newest first) and cap the length.
 * Total: a missing / non-array `existing` is treated as empty. Never throws.
 */
export function appendHistory(
  existing: unknown,
  entry: HistoryEntry,
  cap: number = HISTORY_CAP,
): HistoryEntry[] {
  const list = Array.isArray(existing) ? (existing as HistoryEntry[]) : [];
  return [entry, ...list].slice(0, Math.max(1, cap));
}
