// @trace FR-COMPARE-01
//
// Test-first (RED): written BEFORE `lib/compare/pins.ts` exists. Defines the
// contract for the pure pin-set logic backing the chip row (FR-COMPARE-01):
//   - the visitor can pin the active city; pinned cities form a set (chip row);
//   - at most 3 cities may be pinned at any time (the limit is fixed at three,
//     not configurable — spec "Pin limit is fixed at three");
//   - pinning at the limit is a NO-OP and the result flags `atLimit` so the UI
//     can show the calm inline Ukrainian limit message (no toast, no "!");
//   - unpinning frees a slot, so pinning becomes available again;
//   - the same city is never pinned twice (deduplicated by lat/lon identity).
//
// Pure (TC-PURE-01): no next/*, react, or DOM imports. The pin set lives in
// client React state (design decision 1); this module is the framework-free
// reducer the client container drives.
//
// These tests MUST fail today (module not found / missing export), then drive
// the implementation to green. Never weaken them to pass.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `@/lib/location/types` (already defined):
//   export interface ActiveLocation { lat: number; lon: number; name: string }
//
// From `./pins`:
//   // The maximum number of pinned cities. Fixed at 3 (FR-COMPARE-01); exported
//   // so the UI message and the helper share one source of truth.
//   export const MAX_PINS = 3;
//
//   export interface PinResult {
//     // The next pin list (≤ MAX_PINS). On a rejected pin this equals the input
//     // list (a no-op); a NEW array is always returned (never the same ref) so
//     // it is safe to set straight into React state.
//     pins: ActiveLocation[];
//     // True when the action was rejected because the list is already full.
//     // (Only ever true for addPin at the limit; false for a successful add,
//     // a duplicate no-op, and for removePin.)
//     atLimit: boolean;
//   }
//
//   // Add `city` to `pins`. No-op (atLimit:true) when MAX_PINS are already
//   // pinned. No-op (atLimit:false) when `city` is already pinned (same lat/lon).
//   // Never mutates `pins`; never throws.
//   export function addPin(pins: ActiveLocation[], city: ActiveLocation): PinResult
//
//   // Remove the city with the given lat/lon from `pins`. Returns a new list
//   // (atLimit:false). A no-op when the city is not pinned. Never mutates;
//   // never throws.
//   export function removePin(pins: ActiveLocation[], city: ActiveLocation): PinResult
//
//   // True when `city` (same lat/lon) is already in `pins`.
//   export function isPinned(pins: ActiveLocation[], city: ActiveLocation): boolean
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import type { ActiveLocation } from "@/lib/location/types";
import { MAX_PINS, addPin, removePin, isPinned } from "./pins";

const KYIV: ActiveLocation = { lat: 50.45, lon: 30.52, name: "Київ" };
const LVIV: ActiveLocation = { lat: 49.84, lon: 24.03, name: "Львів" };
const ODESA: ActiveLocation = { lat: 46.48, lon: 30.72, name: "Одеса" };
const KHARKIV: ActiveLocation = { lat: 49.99, lon: 36.23, name: "Харків" };

/** A fresh list of three distinct pinned cities (the limit). */
function threePins(): ActiveLocation[] {
  return [KYIV, LVIV, ODESA];
}

describe("pins — the limit is fixed at three (FR-COMPARE-01)", () => {
  it("exposes MAX_PINS = 3", () => {
    expect(MAX_PINS).toBe(3);
  });
});

describe("pins — add and remove (FR-COMPARE-01)", () => {
  it("pins the active city into an empty list", () => {
    const { pins, atLimit } = addPin([], KYIV);
    expect(pins).toEqual([KYIV]);
    expect(atLimit).toBe(false);
  });

  it("appends a second and third distinct city", () => {
    const afterFirst = addPin([], KYIV).pins;
    const afterSecond = addPin(afterFirst, LVIV).pins;
    const afterThird = addPin(afterSecond, ODESA).pins;

    expect(afterThird).toEqual([KYIV, LVIV, ODESA]);
    expect(afterThird).toHaveLength(3);
  });

  it("removes a pinned city by lat/lon and decreases the count by one", () => {
    const { pins, atLimit } = removePin(threePins(), LVIV);
    expect(pins).toEqual([KYIV, ODESA]);
    expect(pins).toHaveLength(2);
    expect(atLimit).toBe(false);
  });

  it("removePin is a no-op when the city is not pinned", () => {
    const start = [KYIV, LVIV];
    const { pins } = removePin(start, ODESA);
    expect(pins).toEqual([KYIV, LVIV]);
  });
});

describe("pins — three-city limit enforced (FR-COMPARE-01)", () => {
  it("rejects a fourth pin and flags atLimit, keeping exactly three", () => {
    const { pins, atLimit } = addPin(threePins(), KHARKIV);

    expect(pins).toHaveLength(3);
    expect(pins).toEqual([KYIV, LVIV, ODESA]);
    expect(pins).not.toContainEqual(KHARKIV);
    expect(atLimit).toBe(true);
  });

  it("does not flag atLimit on a successful add below the limit", () => {
    expect(addPin([KYIV], LVIV).atLimit).toBe(false);
    expect(addPin([KYIV, LVIV], ODESA).atLimit).toBe(false);
  });

  it("never exceeds MAX_PINS even with repeated add attempts at the limit", () => {
    let current = threePins();
    for (const city of [KHARKIV, KHARKIV, KHARKIV]) {
      current = addPin(current, city).pins;
    }
    expect(current).toHaveLength(MAX_PINS);
  });
});

describe("pins — unpinning frees a slot (FR-COMPARE-01)", () => {
  it("allows a new city to be pinned after one is unpinned at the limit", () => {
    // Full → reject the fourth (atLimit) → unpin one → the fourth now succeeds.
    const rejected = addPin(threePins(), KHARKIV);
    expect(rejected.atLimit).toBe(true);

    const freed = removePin(rejected.pins, ODESA);
    expect(freed.pins).toHaveLength(2);

    const added = addPin(freed.pins, KHARKIV);
    expect(added.atLimit).toBe(false);
    expect(added.pins).toEqual([KYIV, LVIV, KHARKIV]);
  });
});

describe("pins — no duplicate pins (FR-COMPARE-01)", () => {
  it("does not pin the same city twice (same lat/lon)", () => {
    const { pins, atLimit } = addPin([KYIV], KYIV);
    expect(pins).toEqual([KYIV]);
    expect(pins).toHaveLength(1);
    // A duplicate is a no-op because the city is already present, NOT because
    // the list is full — so atLimit must stay false.
    expect(atLimit).toBe(false);
  });

  it("treats a city with the same coords but a different name as already pinned", () => {
    const sameCoordsOtherName: ActiveLocation = { lat: KYIV.lat, lon: KYIV.lon, name: "Kyiv" };
    const { pins } = addPin([KYIV], sameCoordsOtherName);
    expect(pins).toHaveLength(1);
  });

  it("isPinned reflects membership by lat/lon, not by name", () => {
    expect(isPinned([KYIV, LVIV], KYIV)).toBe(true);
    expect(isPinned([KYIV, LVIV], ODESA)).toBe(false);
    expect(isPinned([KYIV], { lat: KYIV.lat, lon: KYIV.lon, name: "Kyiv" })).toBe(true);
  });
});

describe("pins — purity: never mutates, always a fresh array (TC-PURE-01)", () => {
  it("addPin returns a new array and leaves the input untouched", () => {
    const input = [KYIV];
    const snapshot = JSON.stringify(input);
    const { pins } = addPin(input, LVIV);

    expect(pins).not.toBe(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("removePin returns a new array and leaves the input untouched", () => {
    const input = threePins();
    const snapshot = JSON.stringify(input);
    const { pins } = removePin(input, KYIV);

    expect(pins).not.toBe(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("a rejected add still returns a new array (safe to set into state)", () => {
    const input = threePins();
    const { pins } = addPin(input, KHARKIV);
    expect(pins).not.toBe(input);
    expect(pins).toEqual(input);
  });

  it("never throws on hostile/empty inputs", () => {
    // @ts-expect-error — exercising hostile non-array for totality.
    expect(() => addPin(undefined, KYIV)).not.toThrow();
    // @ts-expect-error — exercising hostile non-array for totality.
    expect(() => removePin(undefined, KYIV)).not.toThrow();
    expect(() => isPinned([], KYIV)).not.toThrow();
  });
});
