// @trace FR-JOKES-01, NFR-I18N-01
//
// Test-first (RED): written BEFORE `lib/jokes/jokes.ts` exists. These tests
// define the contract for the curated, local, in-repo Ukrainian joke list
// (FR-JOKES-01: local curated source; NFR-I18N-01 + BC-BRAND-01: Ukrainian,
// calm, no exclamation marks). They MUST fail today (module not found / missing
// export), then drive the implementation to green.
//
// Per tasks.md §2.2: list non-empty; every joke Ukrainian (Cyrillic) with no
// exclamation mark.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./jokes`:
//
//   // A non-empty, immutable list of curated Ukrainian weather-themed jokes.
//   // Calm tone, no exclamation marks (BC-BRAND-01). Local only — no network,
//   // no external API (FR-JOKES-01, BC-PRIVACY-01).
//   export const JOKES: readonly string[]
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { JOKES } from "./jokes";

// Emoji detector covering the common pictographic ranges plus the variation
// selector and regional-indicator (flag) blocks — mirrors the comfort test so
// the calm/no-decoration tone is enforced consistently.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

// Cyrillic range, matching the convention used in lib/scoring/comfort.test.ts.
const CYRILLIC_RE = /[Ѐ-ӿ]/;

describe("JOKES — local curated list shape (FR-JOKES-01)", () => {
  it("is an array", () => {
    expect(Array.isArray(JOKES)).toBe(true);
  });

  it("is non-empty (contains at least one joke)", () => {
    expect(JOKES.length).toBeGreaterThan(0);
  });

  it("contains at least two jokes so the daily selection can actually rotate", () => {
    // FR-JOKES-01: the selection must not be pinned to a single constant joke.
    expect(JOKES.length).toBeGreaterThanOrEqual(2);
  });

  it("has only non-empty trimmed string entries", () => {
    JOKES.forEach((joke, i) => {
      expect(typeof joke, `JOKES[${i}] should be a string`).toBe("string");
      expect(joke.trim().length, `JOKES[${i}] should be non-empty`).toBeGreaterThan(0);
    });
  });

  it("has no duplicate jokes", () => {
    expect(new Set(JOKES).size).toBe(JOKES.length);
  });
});

describe("JOKES — every joke is Ukrainian (NFR-I18N-01)", () => {
  it("contains Cyrillic in every joke", () => {
    JOKES.forEach((joke, i) => {
      expect(CYRILLIC_RE.test(joke), `JOKES[${i}] should contain Cyrillic: "${joke}"`).toBe(true);
    });
  });

  it("contains no Latin letters in any joke", () => {
    JOKES.forEach((joke, i) => {
      expect(/[A-Za-z]/.test(joke), `JOKES[${i}] should not contain Latin letters: "${joke}"`).toBe(
        false,
      );
    });
  });
});

describe("JOKES — calm tone, no exclamation marks (BC-BRAND-01, NFR-I18N-01)", () => {
  it("contains no exclamation mark in any joke", () => {
    JOKES.forEach((joke, i) => {
      expect(joke.includes("!"), `JOKES[${i}] must not contain "!": "${joke}"`).toBe(false);
      // Also reject the fullwidth exclamation mark sometimes pasted from IMEs.
      expect(joke.includes("！"), `JOKES[${i}] must not contain a fullwidth "！": "${joke}"`).toBe(
        false,
      );
    });
  });

  it("contains no emoji characters in any joke", () => {
    JOKES.forEach((joke, i) => {
      expect(EMOJI_RE.test(joke), `JOKES[${i}] must not contain emoji: "${joke}"`).toBe(false);
    });
  });
});
