// Pure scene types for the animated background (FR-ANIM-01, FR-ANIM-02,
// TC-PURE-01). Framework-free: no next/*, react, or DOM imports.

/** The four particle layers the background can draw. "none" = gradient only. */
export type Particle = "rain" | "snow" | "cloud" | "none";

/**
 * Condition-level gradient key. The bare condition map emits a condition key
 * ("clear", "cloudy", …) or the special "neutral" fallback for unknown codes;
 * `skyScene` resolves day/night ("day" / "night") into a final gradient.
 */
export type GradientKey = "day" | "night" | "neutral" | string;

/** The scene a single weather code maps to, before day/night is folded in. */
export interface ConditionScene {
  /** Condition-level key; "neutral" for unknown/invalid codes. */
  gradientKey: GradientKey;
  particle: Particle;
}

/** Inputs to the combined `skyScene` resolver. All optional / fail-calm. */
export interface SkySceneInput {
  /** WMO weather code for today (daily[0].weather_code). */
  weatherCode?: number;
  /** Today's sunrise, location-local "YYYY-MM-DDTHH:mm". */
  sunrise?: string;
  /** Today's sunset, location-local "YYYY-MM-DDTHH:mm". */
  sunset?: string;
  /** The active location's local "now", "YYYY-MM-DDTHH:mm". */
  nowLocal?: string;
}

/** A fully resolved background scene the component renders directly. */
export interface SkyScene {
  /** Resolved, non-empty gradient class; day vs night differ; neutral on fail. */
  gradient: string;
  particle: Particle;
}
