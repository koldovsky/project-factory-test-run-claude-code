// @trace FR-SEARCH-02, NFR-A11Y-01
//
// Test-first (RED): written BEFORE `lib/geo/flag.ts` exists. These tests define
// the contract for the pure, framework-free `flagEmoji(countryCode)` helper that
// turns an ISO 3166-1 alpha-2 code into a regional-indicator flag emoji
// (FR-SEARCH-02). The flag is purely DECORATIVE: an absent or invalid code MUST
// yield "" so the country name always carries the meaning as text and never as a
// placeholder box (NFR-A11Y-01). They MUST fail today (module not found /
// missing export), then drive the implementation to green.
//
// Per tasks.md §2.2: flagEmoji("UA") → 🇺🇦; missing/invalid code → "".
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./flag` (re-exported by `lib/geo/index.ts`):
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, DOM globals.
//   // Maps a 2-letter ISO 3166-1 alpha-2 code to the two regional-indicator
//   // symbols that render as that country's flag. Case-insensitive. Returns ""
//   // for: undefined, "", non-2-letter strings, codes containing non A–Z
//   // characters, or otherwise malformed input — the flag is decorative only.
//   export function flagEmoji(countryCode?: string): string
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { flagEmoji } from "./flag";

// Regional-indicator code points: 'A' (U+0041) maps to U+1F1E6.
// "UA" → U+1F1FA U+1F1E6 → 🇺🇦.
const UA_FLAG = "\u{1F1FA}\u{1F1E6}";
const US_FLAG = "\u{1F1FA}\u{1F1F8}";
const GB_FLAG = "\u{1F1EC}\u{1F1E7}";

describe("flagEmoji — valid codes produce the country flag (FR-SEARCH-02)", () => {
  it("maps 'UA' to the Ukrainian flag 🇺🇦", () => {
    expect(flagEmoji("UA")).toBe(UA_FLAG);
  });

  it("maps 'US' to the United States flag", () => {
    expect(flagEmoji("US")).toBe(US_FLAG);
  });

  it("maps 'GB' to the United Kingdom flag", () => {
    expect(flagEmoji("GB")).toBe(GB_FLAG);
  });

  it("is case-insensitive — lowercase 'ua' maps to the same flag as 'UA'", () => {
    expect(flagEmoji("ua")).toBe(UA_FLAG);
    expect(flagEmoji("Ua")).toBe(UA_FLAG);
  });

  it("produces a two-code-point string (two regional indicators)", () => {
    expect([...flagEmoji("UA")]).toHaveLength(2);
  });
});

describe("flagEmoji — missing/invalid input is decorative-safe → '' (NFR-A11Y-01)", () => {
  it("returns '' for undefined (no code available)", () => {
    expect(flagEmoji(undefined)).toBe("");
  });

  it("returns '' for an empty string", () => {
    expect(flagEmoji("")).toBe("");
  });

  it("returns '' for a whitespace-only string", () => {
    expect(flagEmoji("  ")).toBe("");
  });

  it("returns '' for a single-letter code", () => {
    expect(flagEmoji("U")).toBe("");
  });

  it("returns '' for an over-long code (3+ letters)", () => {
    expect(flagEmoji("UKR")).toBe("");
    expect(flagEmoji("USAA")).toBe("");
  });

  it("returns '' for codes containing digits or symbols", () => {
    expect(flagEmoji("U1")).toBe("");
    expect(flagEmoji("1A")).toBe("");
    expect(flagEmoji("U-")).toBe("");
    expect(flagEmoji("**")).toBe("");
  });

  it("returns '' for codes with embedded whitespace", () => {
    expect(flagEmoji("U A")).toBe("");
    expect(flagEmoji(" U")).toBe("");
  });

  it("never throws on malformed input (decorative, total over all strings)", () => {
    for (const code of ["", " ", "U", "UKR", "12", "🇺🇦", "\n", "ZZ"]) {
      expect(() => flagEmoji(code)).not.toThrow();
    }
  });
});

describe("flagEmoji — purity & determinism (FR-SEARCH-02, TC-PURE-01)", () => {
  it("is deterministic — identical code yields the identical emoji", () => {
    expect(flagEmoji("UA")).toBe(flagEmoji("UA"));
  });

  it("always returns a string, never undefined or null", () => {
    expect(typeof flagEmoji("UA")).toBe("string");
    expect(typeof flagEmoji(undefined)).toBe("string");
    expect(typeof flagEmoji("nonsense")).toBe("string");
  });
});
