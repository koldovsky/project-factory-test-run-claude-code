// @trace FR-COMFORT-01, FR-COMFORT-02, FR-COMFORT-03
//
// Test-first (RED): written BEFORE `lib/scoring/comfort.ts` exists. These tests
// define the contract for the pure, total, deterministic comfort-scoring
// function (FR-COMFORT-01/02) and the calm ≤80-char Ukrainian rationale
// (FR-COMFORT-03, BC-BRAND-01). They MUST fail today (module not found /
// missing exports), then drive the implementation to green.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./comfort`:
//   // A structural daily input; every field optional and tolerant of bad data
//   // (NaN / string / boolean / null / undefined / missing) per the "total &
//   // safe" requirement. Field names are fixed.
//   export interface DailyComfortInput {
//     feelsLikeC?: number;          // feels-like temperature in °C
//     precipProbability?: number;   // precipitation probability, 0..100 (%)
//     windKmh?: number;             // wind speed in km/h
//     cloudCover?: number;          // cloud cover, 0..100 (%)
//     uvIndex?: number;             // UV index
//   }
//
//   export interface ComfortResult {
//     value: number;     // integer in 0..100 (clamped + rounded)
//     rationale: string; // single Ukrainian sentence, ≤80 chars, no "!"/emoji
//   }
//
//   // Pure (TC-PURE-01): no next/*, react, react-dom, or DOM globals.
//   // Total: defined for EVERY input, never throws, always returns an in-range
//   // integer value. Deterministic: same input ⇒ identical result.
//   export function comfortScore(daily: DailyComfortInput): ComfortResult
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { comfortScore } from "./comfort";
import type { DailyComfortInput } from "./comfort";

// A pleasant baseline that should score well — peak-comfort feels-like, no rain,
// light wind, moderate cloud, low-moderate UV. Used as the monotonicity anchor.
const PLEASANT: DailyComfortInput = {
  feelsLikeC: 21,
  precipProbability: 0,
  windKmh: 8,
  cloudCover: 40,
  uvIndex: 3,
};

// Emoji detector covering the common pictographic ranges plus the variation
// selector and regional-indicator (flag) blocks.
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;

describe("comfortScore — purity & determinism (FR-COMFORT-01)", () => {
  it("returns an object with a numeric value and a string rationale without throwing", () => {
    const result = comfortScore(PLEASANT);

    expect(typeof result.value).toBe("number");
    expect(typeof result.rationale).toBe("string");
  });

  it("is deterministic — same input yields an identical value and rationale", () => {
    const a = comfortScore(PLEASANT);
    const b = comfortScore(PLEASANT);

    expect(a).toEqual(b);
  });

  it("does not mutate its input object", () => {
    const input: DailyComfortInput = { ...PLEASANT };
    const snapshot = JSON.stringify(input);

    comfortScore(input);

    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("comfortScore — value is always an integer in 0..100 (FR-COMFORT-02)", () => {
  it("returns an integer (no fractional component) for the pleasant baseline", () => {
    expect(Number.isInteger(comfortScore(PLEASANT).value)).toBe(true);
  });

  it("clamps and rounds to an integer within [0,100] for extreme/out-of-range fields", () => {
    const extremes: DailyComfortInput[] = [
      { feelsLikeC: -100, precipProbability: 1000, windKmh: 9999, cloudCover: 9999, uvIndex: 9999 },
      { feelsLikeC: 100, precipProbability: -50, windKmh: -10, cloudCover: -10, uvIndex: -10 },
      { feelsLikeC: 1e6, precipProbability: 1e6, windKmh: 1e6, cloudCover: 1e6, uvIndex: 1e6 },
      { feelsLikeC: -1e6, precipProbability: -1e6, windKmh: -1e6, cloudCover: -1e6, uvIndex: -1e6 },
    ];

    for (const input of extremes) {
      const { value } = comfortScore(input);
      expect(Number.isInteger(value), `value should be integer for ${JSON.stringify(input)}`).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe("comfortScore — all five inputs influence the score, monotonically (FR-COMFORT-02)", () => {
  const baseline = comfortScore(PLEASANT).value;

  // Each entry mutates exactly ONE field to a markedly WORSE value.
  const worseSingleChanges: Array<{ field: string; input: DailyComfortInput }> = [
    { field: "feelsLikeC (freezing)", input: { ...PLEASANT, feelsLikeC: -10 } },
    { field: "precipProbability (100%)", input: { ...PLEASANT, precipProbability: 100 } },
    { field: "windKmh (gale)", input: { ...PLEASANT, windKmh: 80 } },
    { field: "cloudCover (overcast)", input: { ...PLEASANT, cloudCover: 100 } },
    { field: "uvIndex (extreme)", input: { ...PLEASANT, uvIndex: 11 } },
  ];

  it("never increases the score when a single input is made worse", () => {
    for (const { field, input } of worseSingleChanges) {
      const worse = comfortScore(input).value;
      expect(worse, `worsening ${field} must not raise the score`).toBeLessThanOrEqual(baseline);
    }
  });

  it("strictly lowers the score for at least one single-input worsening", () => {
    const anyStrictlyLower = worseSingleChanges.some(
      ({ input }) => comfortScore(input).value < baseline,
    );
    expect(anyStrictlyLower).toBe(true);
  });

  it("reflects EACH of the five inputs — every worsening changes the score (none is dead weight)", () => {
    for (const { field, input } of worseSingleChanges) {
      const worse = comfortScore(input).value;
      expect(worse, `worsening ${field} must change the score (input is wired in)`).not.toBe(baseline);
    }
  });
});

describe("comfortScore — band extremes (FR-COMFORT-02)", () => {
  it("pleasant conditions score at least 70", () => {
    expect(comfortScore(PLEASANT).value).toBeGreaterThanOrEqual(70);
  });

  it("hostile conditions score below 40", () => {
    const hostile: DailyComfortInput = {
      feelsLikeC: 0,
      precipProbability: 100,
      windKmh: 60,
      cloudCover: 100,
      uvIndex: 0,
    };
    expect(comfortScore(hostile).value).toBeLessThan(40);
  });
});

describe("comfortScore — total & safe: bad input never throws (FR-COMFORT-01, FR-COMFORT-02)", () => {
  function expectSafeResult(input: unknown, label: string) {
    let result: ReturnType<typeof comfortScore> | undefined;
    expect(() => {
      result = comfortScore(input as DailyComfortInput);
    }, `comfortScore must not throw for ${label}`).not.toThrow();

    expect(result, label).toBeDefined();
    expect(Number.isInteger(result!.value), `${label}: value should be integer`).toBe(true);
    expect(result!.value, label).toBeGreaterThanOrEqual(0);
    expect(result!.value, label).toBeLessThanOrEqual(100);
    expect(typeof result!.rationale, `${label}: rationale should be string`).toBe("string");
    expect(result!.rationale.trim().length, `${label}: rationale should be non-empty`).toBeGreaterThan(0);
  }

  it("handles an empty object", () => {
    expectSafeResult({}, "empty object {}");
  });

  it("handles all-undefined fields", () => {
    expectSafeResult(
      {
        feelsLikeC: undefined,
        precipProbability: undefined,
        windKmh: undefined,
        cloudCover: undefined,
        uvIndex: undefined,
      },
      "all-undefined fields",
    );
  });

  it("handles individually missing fields", () => {
    expectSafeResult({ feelsLikeC: 20 }, "only feelsLikeC present");
    expectSafeResult({ precipProbability: 50 }, "only precipProbability present");
    expectSafeResult({ windKmh: 12 }, "only windKmh present");
    expectSafeResult({ cloudCover: 30 }, "only cloudCover present");
    expectSafeResult({ uvIndex: 4 }, "only uvIndex present");
  });

  it("handles NaN field values", () => {
    expectSafeResult(
      { feelsLikeC: NaN, precipProbability: NaN, windKmh: NaN, cloudCover: NaN, uvIndex: NaN },
      "all-NaN fields",
    );
  });

  it("handles non-numeric field values (string, boolean, null, object, array)", () => {
    expectSafeResult(
      {
        feelsLikeC: "warm",
        precipProbability: true,
        windKmh: null,
        cloudCover: {},
        uvIndex: [],
      },
      "non-numeric fields",
    );
  });

  it("handles Infinity and -Infinity field values", () => {
    expectSafeResult(
      {
        feelsLikeC: Infinity,
        precipProbability: -Infinity,
        windKmh: Infinity,
        cloudCover: -Infinity,
        uvIndex: Infinity,
      },
      "infinite fields",
    );
  });

  it("handles an oversized / junk-laden object without throwing", () => {
    const junk: Record<string, unknown> = { ...PLEASANT };
    for (let i = 0; i < 1000; i += 1) junk[`junk${i}`] = "x".repeat(100);
    expectSafeResult(junk, "object with 1000 junk fields");
  });

  it("does not throw on null or undefined top-level input", () => {
    expect(() => comfortScore(undefined as unknown as DailyComfortInput)).not.toThrow();
    expect(() => comfortScore(null as unknown as DailyComfortInput)).not.toThrow();
  });
});

describe("comfortScore — Ukrainian rationale copy (FR-COMFORT-03, BC-BRAND-01, NFR-I18N-01)", () => {
  // A spread of representative days plus the safety-edge cases — the rationale
  // contract must hold for ALL of them.
  const samples: Array<{ label: string; input: DailyComfortInput }> = [
    { label: "pleasant", input: PLEASANT },
    { label: "cold", input: { ...PLEASANT, feelsLikeC: -8 } },
    { label: "wet", input: { ...PLEASANT, precipProbability: 95 } },
    { label: "windy", input: { ...PLEASANT, windKmh: 70 } },
    { label: "hot+UV", input: { ...PLEASANT, feelsLikeC: 35, uvIndex: 11 } },
    { label: "overcast", input: { ...PLEASANT, cloudCover: 100 } },
    { label: "hostile", input: { feelsLikeC: 0, precipProbability: 100, windKmh: 60, cloudCover: 100, uvIndex: 0 } },
    { label: "empty object", input: {} as DailyComfortInput },
  ];

  it("is a non-empty string of at most 80 characters", () => {
    for (const { label, input } of samples) {
      const { rationale } = comfortScore(input);
      expect(rationale.trim().length, `${label}: rationale should be non-empty`).toBeGreaterThan(0);
      expect(rationale.length, `${label}: rationale should be ≤80 chars (was ${rationale.length})`).toBeLessThanOrEqual(80);
    }
  });

  it("contains no exclamation mark (BC-BRAND-01)", () => {
    for (const { label, input } of samples) {
      const { rationale } = comfortScore(input);
      expect(rationale.includes("!"), `${label}: rationale must not contain "!"`).toBe(false);
      expect(rationale.includes("！"), `${label}: rationale must not contain a fullwidth "！"`).toBe(false);
    }
  });

  it("contains no emoji characters", () => {
    for (const { label, input } of samples) {
      const { rationale } = comfortScore(input);
      expect(EMOJI_RE.test(rationale), `${label}: rationale must not contain emoji`).toBe(false);
    }
  });

  it("is a single sentence (at most one sentence-ending period, no line breaks)", () => {
    for (const { label, input } of samples) {
      const { rationale } = comfortScore(input);
      expect(rationale.includes("\n"), `${label}: rationale must be one line`).toBe(false);
      // At most one sentence terminator; a trailing period is allowed but a
      // second one would indicate a multi-sentence rationale.
      const terminators = (rationale.match(/[.?]/g) ?? []).length;
      expect(terminators, `${label}: rationale must be a single sentence`).toBeLessThanOrEqual(1);
    }
  });

  it("is written in Ukrainian (contains Cyrillic, no Latin letters)", () => {
    for (const { label, input } of samples) {
      const { rationale } = comfortScore(input);
      expect(/[Ѐ-ӿ]/.test(rationale), `${label}: rationale should contain Cyrillic`).toBe(true);
      expect(/[A-Za-z]/.test(rationale), `${label}: rationale should not contain Latin letters`).toBe(false);
    }
  });
});

describe("comfortScore — rationale reflects the dominant adverse driver (eval regression, FR-COMFORT-03)", () => {
  // Eval-gate finding: a near-certain-rain day that nets a score of ~70 was
  // returning the generic "pleasant day" rationale, ignoring the rain. A
  // notably-adverse driver must be named even when the overall value is high.
  it("names the rain on a wet day that still scores high (does not say 'pleasant')", () => {
    const { value, rationale } = comfortScore({
      feelsLikeC: 16,
      precipProbability: 95,
      windKmh: 15,
      cloudCover: 90,
      uvIndex: 2,
    });
    expect(value).toBeGreaterThanOrEqual(60); // otherwise-OK day, high net score
    expect(rationale).toContain("дощ"); // mentions rain
    expect(rationale).not.toContain("Приємний"); // not the generic pleasant line
  });

  it("still gives the pleasant line when no driver is notably adverse", () => {
    const { rationale } = comfortScore({
      feelsLikeC: 21,
      precipProbability: 0,
      windKmh: 8,
      cloudCover: 40,
      uvIndex: 3,
    });
    expect(rationale).toContain("Приємний");
  });
});
