// Pure condition→scene mapping for the animated background (FR-ANIM-01,
// FR-ANIM-02, TC-PURE-01). Framework-free: no next/*, react, or DOM imports.
// Everything here is TOTAL and calm — every input resolves to a usable scene
// and nothing throws (NFR-OBS-01).
//
// WMO weather-code groups (docs/open-meteo-reference.md, mirroring
// lib/weather/code.ts):
//   0 clear · 1 mainly clear · 2 partly cloudy · 3 overcast · 45,48 fog ·
//   51-57 drizzle · 61-67 rain · 71-77 snow · 80-82 rain showers ·
//   85,86 snow showers · 95 thunderstorm · 96,99 thunderstorm with hail.
//
// Particle mapping (FR-ANIM-01):
//   rain   ← drizzle 51-57, rain 61-67, rain showers 80-82, thunderstorm 95/96/99
//   snow   ← snow 71-77, snow showers 85,86
//   cloud  ← partly/overcast 2,3 and fog 45,48
//   none   ← clear / mainly clear 0,1 (gradient only)
//   neutral + none ← everything else (unknown / out-of-range / non-integer)

import { isDaytime } from "./daynight";
import type {
  ConditionScene,
  Particle,
  SkyScene,
  SkySceneInput,
} from "./types";

export type {
  ConditionScene,
  GradientKey,
  Particle,
  SkyScene,
  SkySceneInput,
} from "./types";

// Each distinct condition scene is defined once and shared across every code in
// its group, so equal conditions are deeply equal and `sceneForWeatherCode` is
// deterministic by construction.
const CLEAR: ConditionScene = { gradientKey: "clear", particle: "none" };
const CLOUDY: ConditionScene = { gradientKey: "cloudy", particle: "cloud" };
const RAIN: ConditionScene = { gradientKey: "rain", particle: "rain" };
const SNOW: ConditionScene = { gradientKey: "snow", particle: "snow" };

// Fallback for unknown / out-of-range / non-integer codes: a neutral gradient
// with no particle layer (FR-ANIM fail-calm).
const NEUTRAL: ConditionScene = { gradientKey: "neutral", particle: "none" };

// Direct lookup for the codes Open-Meteo emits. Ranges are listed explicitly so
// an out-of-set code falls through to NEUTRAL.
const BY_CODE = new Map<number, ConditionScene>([
  [0, CLEAR],
  [1, CLEAR],
  [2, CLOUDY],
  [3, CLOUDY],
  [45, CLOUDY],
  [48, CLOUDY],
  [51, RAIN],
  [53, RAIN],
  [55, RAIN],
  [56, RAIN],
  [57, RAIN],
  [61, RAIN],
  [63, RAIN],
  [65, RAIN],
  [66, RAIN],
  [67, RAIN],
  [71, SNOW],
  [73, SNOW],
  [75, SNOW],
  [77, SNOW],
  [80, RAIN],
  [81, RAIN],
  [82, RAIN],
  [85, SNOW],
  [86, SNOW],
  [95, RAIN],
  [96, RAIN],
  [99, RAIN],
]);

/**
 * Map a WMO weather code to its condition scene. Pure and TOTAL over every
 * number: unknown / negative / huge / NaN / Infinity / non-integer codes return
 * `{ gradientKey: "neutral", particle: "none" }`. Never throws; deterministic.
 */
export function sceneForWeatherCode(code: number): ConditionScene {
  if (typeof code !== "number" || !Number.isInteger(code)) return NEUTRAL;
  return BY_CODE.get(code) ?? NEUTRAL;
}

// Resolved gradient CSS classes the AnimatedBackground maps to a styled layer.
// Day and night MUST differ (FR-ANIM-02); neutral is the calm static fallback.
const GRADIENT_DAY = "sky-gradient-day";
const GRADIENT_NIGHT = "sky-gradient-night";
const GRADIENT_NEUTRAL = "sky-gradient-neutral";

/**
 * Fold the condition scene together with the day/night decision into a fully
 * resolved scene for the background to render.
 *
 * Pure (TC-PURE-01) and fail-calm: a missing / unknown weather code yields the
 * neutral static gradient with particle "none"; missing sun times default to
 * the DAY gradient (via `isDaytime`); any unparseable input degrades to the
 * neutral gradient. Never throws (NFR-OBS-01); deterministic.
 */
export function skyScene(input: SkySceneInput): SkyScene {
  const { weatherCode, sunrise, sunset, nowLocal } = input ?? {};

  // No weather code at all → neutral static gradient, no particles.
  if (typeof weatherCode !== "number" || !Number.isInteger(weatherCode)) {
    return { gradient: GRADIENT_NEUTRAL, particle: "none" };
  }

  const condition = sceneForWeatherCode(weatherCode);

  // Unknown/unrecognized code → neutral static gradient, no particles.
  if (condition.gradientKey === "neutral") {
    return { gradient: GRADIENT_NEUTRAL, particle: "none" };
  }

  // Known condition: resolve day vs night from the location-local sun times.
  // `isDaytime` defaults to DAY when sun times or "now" are missing/unparseable.
  const day = isDaytime(typeof nowLocal === "string" ? nowLocal : "", sunrise, sunset);
  const gradient: string = day ? GRADIENT_DAY : GRADIENT_NIGHT;

  const particle: Particle = condition.particle;
  return { gradient, particle };
}
