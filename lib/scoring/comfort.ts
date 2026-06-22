// Pure, total, deterministic comfort scoring (FR-COMFORT-01, FR-COMFORT-02) and
// a calm Ukrainian rationale (FR-COMFORT-03, BC-BRAND-01).
//
// Framework-free (TC-PURE-01): no next/*, react, react-dom, or DOM globals.
// The function is TOTAL — defined for every possible input (including null /
// undefined top-level, NaN, strings, booleans, Infinity, {} ), never throws,
// never mutates its input, and always returns an integer `value` in 0..100 plus
// a non-empty single Ukrainian sentence rationale of at most 80 characters.

export interface DailyComfortInput {
  /** Feels-like temperature in °C. */
  feelsLikeC?: number;
  /** Precipitation probability, 0..100 (%). */
  precipProbability?: number;
  /** Wind speed in km/h. */
  windKmh?: number;
  /** Cloud cover, 0..100 (%). */
  cloudCover?: number;
  /** UV index. */
  uvIndex?: number;
}

export interface ComfortResult {
  /** Integer comfort value in 0..100 (clamped + rounded). */
  value: number;
  /** Single Ukrainian sentence, ≤80 chars, no "!"/emoji. */
  rationale: string;
}

// --- Neutral defaults for missing / unusable inputs -------------------------
// Chosen so an all-missing day degrades to a calm, mid-ish reading rather than
// crashing or pinning to an extreme.
const DEFAULTS = {
  feelsLikeC: 18,
  precipProbability: 20,
  windKmh: 10,
  cloudCover: 50,
  uvIndex: 3,
} as const;

// Weights sum to 1.0 (design decision 1). Feels-like dominates; cloud is mild.
const WEIGHTS = {
  feelsLike: 0.4,
  precip: 0.25,
  wind: 0.2,
  cloud: 0.05,
  uv: 0.1,
} as const;

/**
 * Coerce an unknown field to a finite number, falling back to `fallback` for
 * undefined / null / NaN / non-numeric / Infinity. Keeps the function total.
 */
function toNumber(raw: unknown, fallback: number): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return fallback;
}

/** Clamp `n` to the inclusive [min, max] range. */
function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

// --- Sub-scores: each returns 0..1 where 1 = most comfortable ---------------

/**
 * Feels-like comfort peaks across ~18–24 °C and falls off linearly toward cold
 * and hot extremes. Below -10 °C or above 40 °C scores 0.
 */
function feelsLikeScore(c: number): number {
  if (c >= 18 && c <= 24) return 1;
  if (c < 18) {
    // 18 °C -> 1, down to -10 °C -> 0 (28° span).
    return clamp((c - -10) / (18 - -10), 0, 1);
  }
  // 24 °C -> 1, up to 40 °C -> 0 (16° span).
  return clamp((40 - c) / (40 - 24), 0, 1);
}

/** Higher precipitation probability is worse: 0% -> 1, 100% -> 0 (linear). */
function precipScore(probability: number): number {
  return clamp(1 - clamp(probability, 0, 100) / 100, 0, 1);
}

/**
 * Wind comfort: calm up to a light breeze (≤12 km/h) is ideal; comfort falls to
 * 0 by gale force (~75 km/h).
 */
function windScore(kmh: number): number {
  const w = clamp(kmh, 0, 1000);
  if (w <= 12) return 1;
  return clamp((75 - w) / (75 - 12), 0, 1);
}

/** Cloud cover has a mild effect: clear -> 1, fully overcast -> 0.4 (linear). */
function cloudScore(cover: number): number {
  const c = clamp(cover, 0, 100);
  return clamp(1 - (c / 100) * 0.6, 0, 1);
}

/**
 * UV comfort: low UV is fine; comfort falls as UV climbs, reaching 0 at the
 * "extreme" end (UV 11+). UV 0..2 -> 1.
 */
function uvScore(uv: number): number {
  const u = clamp(uv, 0, 20);
  if (u <= 2) return 1;
  return clamp((11 - u) / (11 - 2), 0, 1);
}

// --- Rationale --------------------------------------------------------------
// One calm Ukrainian sentence keyed by the dominant negative driver, chosen so
// every branch is ≤80 chars, has no "!", no emoji, and a single terminator.

function buildRationale(
  value: number,
  feels: number,
  precip: number,
  wind: number,
  cloud: number,
  uv: number,
): string {
  // Identify the weakest (most uncomfortable) sub-score to lead the sentence.
  const drivers: Array<{ key: string; score: number }> = [
    { key: "cold", score: feelsLikeScore(feels) },
    { key: "wet", score: precipScore(precip) },
    { key: "wind", score: windScore(wind) },
    { key: "uv", score: uvScore(uv) },
    { key: "cloud", score: cloudScore(cloud) },
  ];
  let worst = drivers[0];
  for (const d of drivers) {
    if (d.score < worst.score) worst = d;
  }

  // A single notably-adverse driver (e.g. 95% rain) must be named even when the
  // overall value is otherwise high — a "pleasant day" sentence that ignores
  // near-certain rain is misleading (eval-gate finding).
  const SEVERE = 0.35;

  // Hostile overall: the strongest message wins regardless of any one driver.
  if (value < 40) {
    return "Умови надворі несприятливі, краще запланувати справи вдома.";
  }

  // Pleasant overall AND no notably-adverse driver: the generic positive.
  if (value >= 70 && worst.score >= SEVERE) {
    return "Приємний день, комфортно перебувати надворі.";
  }

  // Otherwise name the dominant adverse driver calmly — this now also fires for a
  // high-value day dragged down by one severe factor (e.g. wet day scoring ~70).
  switch (worst.key) {
    case "cold":
      return "Прохолодно, варто вдягнутися тепліше перед виходом.";
    case "wet":
      return "Висока ймовірність дощу, візьміть парасольку.";
    case "wind":
      return "Доволі вітряно, врахуйте це під час прогулянки.";
    case "uv":
      return "Високий рівень ультрафіолету, подбайте про захист від сонця.";
    case "cloud":
      return "Переважно хмарно, але загалом цілком прийнятно.";
    default:
      return "Помірні умови, цілком можна вийти надвір.";
  }
}

/**
 * Compute the comfort score and rationale for a daily input. Pure, total,
 * deterministic. Never throws and never mutates `daily`.
 */
export function comfortScore(daily: DailyComfortInput): ComfortResult {
  const source = (daily ?? {}) as Record<string, unknown>;

  const feels = toNumber(source.feelsLikeC, DEFAULTS.feelsLikeC);
  const precip = toNumber(source.precipProbability, DEFAULTS.precipProbability);
  const wind = toNumber(source.windKmh, DEFAULTS.windKmh);
  const cloud = toNumber(source.cloudCover, DEFAULTS.cloudCover);
  const uv = toNumber(source.uvIndex, DEFAULTS.uvIndex);

  const weighted =
    feelsLikeScore(feels) * WEIGHTS.feelsLike +
    precipScore(precip) * WEIGHTS.precip +
    windScore(wind) * WEIGHTS.wind +
    cloudScore(cloud) * WEIGHTS.cloud +
    uvScore(uv) * WEIGHTS.uv;

  const value = clamp(Math.round(weighted * 100), 0, 100);
  const rationale = buildRationale(value, feels, precip, wind, cloud, uv);

  return { value, rationale };
}
