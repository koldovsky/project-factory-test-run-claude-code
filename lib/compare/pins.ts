// Pure pin-set logic backing the compare chip row (FR-COMPARE-01, TC-PURE-01).
//
// Framework-free: no next/*, react, or DOM. The pinned-city set lives in client
// React state (design decision 1); this module is the framework-free reducer the
// client container drives. Every operation is pure, TOTAL, and non-mutating:
//   - identity is by lat/lon ONLY (name-independent) — a same-coords/other-name
//     city is the same pin;
//   - at most MAX_PINS cities may be pinned; adding at the limit is a no-op that
//     flags `atLimit` so the UI can show the calm inline limit message;
//   - adding a duplicate is a no-op WITHOUT `atLimit` (it was already present,
//     not rejected for being full);
//   - every call returns a FRESH array (even on a no-op) so it is safe to set
//     straight into React state; inputs are never mutated; never throws.

import type { ActiveLocation } from "@/lib/location/types";

/**
 * The maximum number of pinned cities. Fixed at 3 (FR-COMPARE-01); exported so
 * the UI limit message and this helper share one source of truth.
 */
export const MAX_PINS = 3;

export interface PinResult {
  /**
   * The next pin list (≤ MAX_PINS). On a rejected/no-op add this equals the
   * input list; a NEW array is always returned (never the same ref) so it is
   * safe to set straight into React state.
   */
  pins: ActiveLocation[];
  /**
   * True ONLY when an add was rejected because the list is already full. False
   * for a successful add, a duplicate no-op, and for every remove.
   */
  atLimit: boolean;
}

/** Same place by coordinates (name-independent). Tolerates missing values. */
function sameLocation(a: ActiveLocation, b: ActiveLocation): boolean {
  return a?.lat === b?.lat && a?.lon === b?.lon;
}

/** A defensive shallow copy that tolerates a non-array input (totality). */
function toList(pins: ActiveLocation[]): ActiveLocation[] {
  return Array.isArray(pins) ? pins.slice() : [];
}

/**
 * Add `city` to `pins`. No-op (atLimit:true) when MAX_PINS are already pinned.
 * No-op (atLimit:false) when `city` is already pinned (same lat/lon). Never
 * mutates `pins`; never throws.
 */
export function addPin(pins: ActiveLocation[], city: ActiveLocation): PinResult {
  const current = toList(pins);

  if (current.some((pinned) => sameLocation(pinned, city))) {
    // Already pinned: a no-op, but NOT a limit rejection.
    return { pins: current, atLimit: false };
  }

  if (current.length >= MAX_PINS) {
    // Full: reject, flag the limit, still return a fresh array.
    return { pins: current, atLimit: true };
  }

  return { pins: [...current, city], atLimit: false };
}

/**
 * Remove the city with the given lat/lon from `pins`. Returns a new list
 * (atLimit:false). A no-op when the city is not pinned. Never mutates; never
 * throws.
 */
export function removePin(
  pins: ActiveLocation[],
  city: ActiveLocation,
): PinResult {
  const next = toList(pins).filter((pinned) => !sameLocation(pinned, city));
  return { pins: next, atLimit: false };
}

/** True when `city` (same lat/lon) is already in `pins`. Never throws. */
export function isPinned(pins: ActiveLocation[], city: ActiveLocation): boolean {
  if (!Array.isArray(pins)) return false;
  return pins.some((pinned) => sameLocation(pinned, city));
}
