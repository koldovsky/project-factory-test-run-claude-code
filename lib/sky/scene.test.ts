// @trace FR-ANIM-01, FR-ANIM-02
//
// Test-first (RED): written BEFORE `lib/sky/scene.ts` (and its `lib/sky` types)
// exist. Defines the contract for the pure, framework-free scene mapping that
// drives the animated background: the condition→visual mapping
// (`sceneForWeatherCode`) and the combined `skyScene` that folds in day/night.
// No `next/*`, `react`, or DOM imports (TC-PURE-01, FR-ANIM-01).
//
// WMO weather-code groups (per docs/open-meteo-reference.md, matching
// lib/weather/code.ts):
//   0 clear · 1-3 mainly clear / partly / overcast · 45,48 fog ·
//   51-57 drizzle · 61-67 rain · 71-77 snow · 80-82 rain showers ·
//   85,86 snow showers · 95 thunderstorm · 96,99 thunderstorm w/ hail.
//
// Mapping rules (FR-ANIM-01):
//   - rain-bearing codes (drizzle 51-57, rain 61-67, rain showers 80-82,
//     thunderstorm 95/96/99) → particle 'rain'
//   - snow-bearing codes (snow 71-77, snow showers 85,86) → particle 'snow'
//   - cloud cover without precipitation (partly/overcast 2,3 and fog 45,48)
//     → particle 'cloud'
//   - clear / mainly clear (0,1) → particle 'none' (gradient only)
//   - any UNKNOWN / out-of-range / non-integer code → neutral gradient +
//     particle 'none', and NEVER throws (FR-ANIM fail-calm).
//
// `skyScene` is TOTAL and calm: missing/invalid inputs → a neutral STATIC
// gradient with no particles, never throws (FR-ANIM-01, FR-ANIM-02,
// NFR-OBS-01).
//
// These tests MUST fail today (module not found / missing exports), then drive
// the implementation to green. Never weaken them to pass — strengthen if green.
//
// ----------------------------------------------------------------------------
// API CONTRACT THIS FILE ASSUMES (implementer must match exactly)
// ----------------------------------------------------------------------------
// From `./scene` (types may live in `./types` and be re-exported):
//
//   export type Particle = "rain" | "snow" | "cloud" | "none";
//
//   // The gradient key the AnimatedBackground maps to a CSS gradient class.
//   // Day/night variants resolve through skyScene; the bare condition map uses
//   // a condition-level key plus the special "neutral" fallback.
//   export type GradientKey =
//     | "day"
//     | "night"
//     | "neutral"
//     | string; // implementer may use richer keys; tests assert the contract below
//
//   export interface ConditionScene {
//     gradientKey: GradientKey;
//     particle: Particle;
//   }
//
//   // Pure (TC-PURE-01). TOTAL over every number: unknown / negative / NaN /
//   // non-integer ⇒ { gradientKey: "neutral", particle: "none" }; NEVER throws.
//   export function sceneForWeatherCode(code: number): ConditionScene
//
//   export interface SkySceneInput {
//     weatherCode?: number;
//     sunrise?: string;   // location-local "YYYY-MM-DDTHH:mm"
//     sunset?: string;    // location-local "YYYY-MM-DDTHH:mm"
//     nowLocal?: string;  // location-local "YYYY-MM-DDTHH:mm"
//   }
//
//   export interface SkyScene {
//     gradient: string;     // resolved gradient (day / night / neutral)
//     particle: Particle;
//   }
//
//   // Pure (TC-PURE-01). TOTAL & calm: any missing / invalid input ⇒ a neutral
//   // STATIC gradient with particle "none"; NEVER throws (FR-ANIM fail-calm).
//   export function skyScene(input: SkySceneInput): SkyScene
// ----------------------------------------------------------------------------

import { describe, it, expect } from "vitest";

import { sceneForWeatherCode, skyScene } from "./scene";

const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const CLOUD_CODES = [2, 3, 45, 48];
const CLEAR_CODES = [0, 1];

const SUNRISE = "2026-06-21T05:48";
const SUNSET = "2026-06-21T21:12";

describe("sceneForWeatherCode — rain conditions map to the rain particle (FR-ANIM-01)", () => {
  it.each(RAIN_CODES)("code %i → particle 'rain' (not snow/cloud)", (code) => {
    expect(sceneForWeatherCode(code).particle).toBe("rain");
  });

  it("provides a gradient key alongside the rain particle", () => {
    const scene = sceneForWeatherCode(63);
    expect(typeof scene.gradientKey).toBe("string");
    expect(scene.gradientKey.length).toBeGreaterThan(0);
  });
});

describe("sceneForWeatherCode — snow conditions map to the snow particle (FR-ANIM-01)", () => {
  it.each(SNOW_CODES)("code %i → particle 'snow' (not rain/cloud)", (code) => {
    expect(sceneForWeatherCode(code).particle).toBe("snow");
  });
});

describe("sceneForWeatherCode — cloud cover maps to the cloud particle (FR-ANIM-01)", () => {
  it.each(CLOUD_CODES)("code %i → particle 'cloud' (not rain/snow)", (code) => {
    expect(sceneForWeatherCode(code).particle).toBe("cloud");
  });
});

describe("sceneForWeatherCode — clear sky is gradient only (FR-ANIM-01)", () => {
  it.each(CLEAR_CODES)("code %i → particle 'none' (gradient only)", (code) => {
    expect(sceneForWeatherCode(code).particle).toBe("none");
  });
});

describe("sceneForWeatherCode — unknown code falls back to neutral gradient + no particle (FR-ANIM-01)", () => {
  it("returns neutral gradient and particle 'none' for an unrecognized code, without throwing", () => {
    const run = () => sceneForWeatherCode(7); // not a real WMO code in our groups
    expect(run).not.toThrow();

    const scene = run();
    expect(scene.gradientKey).toBe("neutral");
    expect(scene.particle).toBe("none");
  });

  it("never throws for negative, huge, NaN, Infinity, or non-integer codes", () => {
    for (const code of [-1, 1000, NaN, 3.7, Infinity, -Infinity]) {
      const run = () => sceneForWeatherCode(code);
      expect(run).not.toThrow();
      expect(run().particle).toBe("none");
      expect(run().gradientKey).toBe("neutral");
    }
  });

  it("is deterministic — the same code always maps to the same scene", () => {
    expect(sceneForWeatherCode(61)).toEqual(sceneForWeatherCode(61));
  });

  it("only ever returns one of the four particle kinds", () => {
    const allowed = new Set(["rain", "snow", "cloud", "none"]);
    for (const code of [...RAIN_CODES, ...SNOW_CODES, ...CLOUD_CODES, ...CLEAR_CODES, 7, -1, NaN]) {
      expect(allowed.has(sceneForWeatherCode(code).particle)).toBe(true);
    }
  });
});

describe("skyScene — folds condition + day/night into a resolved scene (FR-ANIM-01, FR-ANIM-02)", () => {
  it("carries the rain particle through to the resolved scene", () => {
    const scene = skyScene({ weatherCode: 63, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
    expect(scene.particle).toBe("rain");
  });

  it("resolves a daytime gradient distinct from the nighttime gradient for the same condition", () => {
    const day = skyScene({ weatherCode: 0, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
    const night = skyScene({ weatherCode: 0, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T02:30" });

    expect(typeof day.gradient).toBe("string");
    expect(day.gradient.length).toBeGreaterThan(0);
    expect(day.gradient).not.toBe(night.gradient);
  });

  it("clear sky has no particle layer in the resolved scene", () => {
    const scene = skyScene({ weatherCode: 0, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
    expect(scene.particle).toBe("none");
  });

  it("snow at night still resolves to the snow particle", () => {
    const scene = skyScene({ weatherCode: 73, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T02:30" });
    expect(scene.particle).toBe("snow");
  });
});

describe("skyScene — missing/invalid inputs render a neutral static gradient, never throws (FR-ANIM-01, FR-ANIM-02)", () => {
  it("returns a neutral static gradient with no particles for an empty input", () => {
    let scene: ReturnType<typeof skyScene> | undefined;
    expect(() => {
      scene = skyScene({});
    }).not.toThrow();
    expect(scene!.particle).toBe("none");
    expect(typeof scene!.gradient).toBe("string");
    expect(scene!.gradient.length).toBeGreaterThan(0);
  });

  it("falls back to neutral + no particle when the weather code is missing", () => {
    const scene = skyScene({ sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
    expect(scene.particle).toBe("none");
    expect(scene.gradient.length).toBeGreaterThan(0);
  });

  it("falls back to no particle for an unknown weather code, without throwing", () => {
    const run = () => skyScene({ weatherCode: 7, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
    expect(run).not.toThrow();
    expect(run().particle).toBe("none");
  });

  it("never throws for NaN / Infinity / non-integer weather codes", () => {
    for (const weatherCode of [NaN, Infinity, -Infinity, 3.7, -1]) {
      const run = () => skyScene({ weatherCode, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
      expect(run).not.toThrow();
      expect(run().particle).toBe("none");
    }
  });

  it("defaults to a day gradient when sun times are missing (no throw)", () => {
    let scene: ReturnType<typeof skyScene> | undefined;
    expect(() => {
      scene = skyScene({ weatherCode: 0, nowLocal: "2026-06-21T02:30" });
    }).not.toThrow();
    const day = skyScene({ weatherCode: 0, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" });
    // Missing sun times default to DAY (FR-ANIM-02), so the gradient matches the
    // daytime one rather than the night gradient.
    expect(scene!.gradient).toBe(day.gradient);
  });

  it("never throws when nowLocal is missing or unparseable", () => {
    expect(() => skyScene({ weatherCode: 0, sunrise: SUNRISE, sunset: SUNSET })).not.toThrow();
    expect(() => skyScene({ weatherCode: 0, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "garbage" })).not.toThrow();
  });

  it("only ever returns one of the four particle kinds for any input", () => {
    const allowed = new Set(["rain", "snow", "cloud", "none"]);
    const inputs: Parameters<typeof skyScene>[0][] = [
      {},
      { weatherCode: 0 },
      { weatherCode: 63, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T13:00" },
      { weatherCode: NaN },
      { weatherCode: 7, nowLocal: "garbage" },
    ];
    for (const input of inputs) {
      expect(allowed.has(skyScene(input).particle)).toBe(true);
    }
  });

  it("is deterministic — identical inputs yield identical scenes", () => {
    const input = { weatherCode: 71, sunrise: SUNRISE, sunset: SUNSET, nowLocal: "2026-06-21T02:30" };
    expect(skyScene(input)).toEqual(skyScene(input));
  });
});
