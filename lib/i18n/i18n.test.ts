// @trace NFR-I18N-01, BC-BRAND-01
//
// Test-first (RED): written BEFORE `lib/i18n/{uk,en,index}.ts` exist. These
// tests define the centralized-strings contract (NFR-I18N-01) and lock the
// calm, no-exclamation-mark brand tone for the Ukrainian source of truth
// (BC-BRAND-01). They MUST fail today (module not found / missing keys), then
// drive the implementation.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./index`:
//   export type MessageKey = keyof typeof uk;            // compile-time key safety
//   export const uk: Record<MessageKey, string>;          // re-exported source of truth
//   export const en: Record<MessageKey, string>;          // mirror, identical keys
//   export function t(key: MessageKey): string;           // typed accessor → uk value
//
// `uk` is the source of truth (`lib/i18n/uk.ts`); `en` (`lib/i18n/en.ts`)
// mirrors its key set exactly. `t(key)` returns the Ukrainian string for `key`.
//
// REQUIRED KEY LIST (the shell needs these; implementer must provide all of
// them, with NO extra keys for this slice and NONE missing). The test asserts
// every one of these is present in both tables.
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { t, uk, en } from "./index";

// The exact keys the app-shell slice depends on. Defined HERE so the
// implementer must supply precisely these — strengthens the test from "some
// keys exist" to "these specific keys exist".
const REQUIRED_SHELL_KEYS = [
  "appName",
  "heroTitle",
  "heroSubtitle",
  "searchPlaceholder",
  "themeLightLabel",
  "themeDarkLabel",
  "footerCreditsIntro",
  "deepLinkErrorNotice",
] as const;

describe("t — typed accessor returns Ukrainian strings", () => {
  it("returns the uk value for a known key", () => {
    expect(t("appName")).toBe(uk.appName);
  });

  it("returns a non-empty Ukrainian string for the hero title", () => {
    const value = t("heroTitle");
    expect(typeof value).toBe("string");
    expect(value.trim().length).toBeGreaterThan(0);
    expect(value).toBe(uk.heroTitle);
  });

  it("resolves every required shell key to a non-empty string", () => {
    for (const key of REQUIRED_SHELL_KEYS) {
      const value = t(key);
      expect(typeof value, `t(${key}) should be a string`).toBe("string");
      expect(value.trim().length, `t(${key}) should be non-empty`).toBeGreaterThan(0);
    }
  });
});

describe("uk — required shell keys are present", () => {
  it("defines every required shell key", () => {
    for (const key of REQUIRED_SHELL_KEYS) {
      expect(uk, `uk is missing required key "${key}"`).toHaveProperty(key);
      expect(typeof uk[key]).toBe("string");
      expect(uk[key].trim().length, `uk.${key} should be non-empty`).toBeGreaterThan(0);
    }
  });
});

describe("uk and en — identical key sets (no missing or extra keys)", () => {
  it("has exactly the same keys in both directions", () => {
    const ukKeys = Object.keys(uk).sort();
    const enKeys = Object.keys(en).sort();

    // Both directions: en missing a uk key, AND en having an extra key uk lacks.
    expect(enKeys).toEqual(ukKeys);
  });

  it("has no key present in uk but absent from en", () => {
    const missingInEn = Object.keys(uk).filter((k) => !(k in en));
    expect(missingInEn).toEqual([]);
  });

  it("has no key present in en but absent from uk", () => {
    const extraInEn = Object.keys(en).filter((k) => !(k in uk));
    expect(extraInEn).toEqual([]);
  });
});

describe("BC-BRAND-01 — calm tone, no exclamation marks in Ukrainian strings", () => {
  it("contains no exclamation mark in any uk value", () => {
    for (const [key, value] of Object.entries(uk) as [string, string][]) {
      expect(value.includes("!"), `uk.${key} must not contain "!" (BC-BRAND-01)`).toBe(false);
      // Also reject the fullwidth exclamation mark sometimes pasted from input
      // method editors.
      expect(value.includes("！"), `uk.${key} must not contain a fullwidth "！"`).toBe(false);
    }
  });

  it("contains no exclamation mark in the deep-link error notice", () => {
    expect(t("deepLinkErrorNotice")).not.toContain("!");
  });

  // Review-gate: the en fallback table must hold the same calm tone, so a tone
  // regression in en cannot slip through silently.
  it("contains no exclamation mark in any en value", () => {
    for (const [key, value] of Object.entries(en) as [string, string][]) {
      expect(value.includes("!"), `en.${key} must not contain "!" (BC-BRAND-01)`).toBe(false);
      expect(value.includes("！"), `en.${key} must not contain a fullwidth "！"`).toBe(false);
    }
  });
});
