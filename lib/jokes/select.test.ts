// @trace FR-JOKES-01
//
// Test-first (RED): written BEFORE `lib/jokes/select.ts` exists. These tests
// define the contract for the pure, total, deterministic joke selector
// (FR-JOKES-01: deterministic selection within bounds, sign-safe modulo,
// graceful empty-list fallback; TC-PURE-01: framework-free, no randomness).
// They MUST fail today (module not found / missing export), then drive the
// implementation to green.
//
// Per tasks.md §2.1:
//   - same index → same joke (deterministic)
//   - bounds for index 0, large, and negative (sign-safe modulo, always a valid
//     joke, never empty / never throw)
//   - rotation (two different days → different jokes)
//   - empty-list → calm fallback string (no throw)
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./select`:
//
//   // Total, pure selector. For ANY integer `index` it reduces modulo the
//   // list length with a SIGN-SAFE modulo (((i % n) + n) % n) and returns the
//   // joke at that position — never throws, never returns null/undefined/"".
//   // If `jokes` is empty it returns a calm static Ukrainian fallback string
//   // (non-empty, no exclamation mark). `jokes` defaults to the curated JOKES.
//   // Pure (TC-PURE-01): no next/*, react, DOM globals, Math.random, Date.now.
//   export function selectJoke(index: number, jokes?: readonly string[]): string
//
// From `./jokes` (used as the production default list):
//   export const JOKES: readonly string[]
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { selectJoke } from "./select";
import { JOKES } from "./jokes";

// A fixed, self-contained list so selection assertions don't depend on the
// curated copy. Length 3 makes the modulo arithmetic easy to reason about.
const SAMPLE: readonly string[] = ["перший жарт", "другий жарт", "третій жарт"];

describe("selectJoke — deterministic (FR-JOKES-01)", () => {
  it("returns the same joke for the same index every time", () => {
    const a = selectJoke(0, SAMPLE);
    const b = selectJoke(0, SAMPLE);
    expect(a).toBe(b);
  });

  it("maps an in-range index to the corresponding list entry", () => {
    expect(selectJoke(0, SAMPLE)).toBe(SAMPLE[0]);
    expect(selectJoke(1, SAMPLE)).toBe(SAMPLE[1]);
    expect(selectJoke(2, SAMPLE)).toBe(SAMPLE[2]);
  });

  it("defaults to the curated JOKES list when no list is supplied", () => {
    const out = selectJoke(0);
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
    expect(JOKES).toContain(out);
  });
});

describe("selectJoke — bounds & sign-safe modulo (FR-JOKES-01)", () => {
  it("wraps an index at the list length back to the first entry", () => {
    expect(selectJoke(SAMPLE.length, SAMPLE)).toBe(SAMPLE[0]);
    expect(selectJoke(SAMPLE.length + 1, SAMPLE)).toBe(SAMPLE[1]);
  });

  it("handles index 0 — returns the first entry", () => {
    expect(selectJoke(0, SAMPLE)).toBe(SAMPLE[0]);
  });

  it("handles very large indices without throwing, always returning a list entry", () => {
    for (const index of [1000, 123456, Number.MAX_SAFE_INTEGER]) {
      let out: string | undefined;
      expect(() => {
        out = selectJoke(index, SAMPLE);
      }, `selectJoke(${index}) must not throw`).not.toThrow();
      expect(SAMPLE, `selectJoke(${index}) must return a list entry`).toContain(out);
    }
  });

  it("handles negative indices with sign-safe modulo — stays in range, never throws", () => {
    // ((index % n) + n) % n : -1 → last, -2 → second-last, -n → first.
    expect(selectJoke(-1, SAMPLE)).toBe(SAMPLE[SAMPLE.length - 1]);
    expect(selectJoke(-2, SAMPLE)).toBe(SAMPLE[SAMPLE.length - 2]);
    expect(selectJoke(-SAMPLE.length, SAMPLE)).toBe(SAMPLE[0]);

    for (const index of [-1, -2, -3, -1000, -123457, Number.MIN_SAFE_INTEGER]) {
      let out: string | undefined;
      expect(() => {
        out = selectJoke(index, SAMPLE);
      }, `selectJoke(${index}) must not throw`).not.toThrow();
      expect(SAMPLE, `selectJoke(${index}) must return a valid list entry`).toContain(out);
    }
  });

  it("never returns null, undefined, or empty string across a wide index range", () => {
    for (let index = -50; index <= 50; index += 1) {
      const out = selectJoke(index, SAMPLE);
      expect(typeof out, `selectJoke(${index}) should be a string`).toBe("string");
      expect(out.length, `selectJoke(${index}) should be non-empty`).toBeGreaterThan(0);
    }
  });
});

describe("selectJoke — rotation over time (FR-JOKES-01)", () => {
  it("produces different jokes for two indices that map to different positions", () => {
    // Two 'days' one position apart must differ on a multi-entry list.
    expect(selectJoke(0, SAMPLE)).not.toBe(selectJoke(1, SAMPLE));
  });

  it("is not pinned to a single constant joke across consecutive indices", () => {
    const seen = new Set<string>();
    for (let index = 0; index < SAMPLE.length; index += 1) {
      seen.add(selectJoke(index, SAMPLE));
    }
    // Walking one full period must surface more than one distinct joke.
    expect(seen.size).toBeGreaterThan(1);
  });

  it("rotates across the curated JOKES list over consecutive days", () => {
    const seen = new Set<string>();
    for (let index = 0; index < JOKES.length; index += 1) {
      seen.add(selectJoke(index, JOKES));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("selectJoke — empty-list calm fallback (FR-JOKES-01)", () => {
  it("does not throw on an empty list", () => {
    expect(() => selectJoke(0, [])).not.toThrow();
    expect(() => selectJoke(5, [])).not.toThrow();
    expect(() => selectJoke(-5, [])).not.toThrow();
  });

  it("returns a non-empty static fallback string for an empty list", () => {
    const out = selectJoke(0, []);
    expect(typeof out).toBe("string");
    expect(out.trim().length).toBeGreaterThan(0);
  });

  it("returns the SAME fallback for any index on an empty list (deterministic)", () => {
    const a = selectJoke(0, []);
    const b = selectJoke(999, []);
    const c = selectJoke(-7, []);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("the empty-list fallback is calm Ukrainian text with no exclamation mark", () => {
    const out = selectJoke(0, []);
    expect(/[Ѐ-ӿ]/.test(out), "fallback should contain Cyrillic").toBe(true);
    expect(out.includes("!"), 'fallback must not contain "!"').toBe(false);
    expect(out.includes("！"), 'fallback must not contain a fullwidth "！"').toBe(false);
  });
});
