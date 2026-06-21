// Eval case — comfort-rationale quality.
//
// Grades the QUALITY a unit test cannot: the unit tests in
// `lib/scoring/comfort.test.ts` assert the rationale is Ukrainian, ≤80 chars,
// single-sentence, and free of "!"/emoji. THIS eval scores whether the prose
// actually reads calm, practical, and ACCURATE to the day's conditions to a
// judge (FR-COMFORT-03, BC-BRAND-01).
//
// `produce()` returns the user-visible rationale by calling `comfortScore` from
// the not-yet-created `lib/scoring/comfort` module. It is intentionally written
// against that module: the eval is the BAR, graded by the eval-suite workflow
// after the function is implemented.

import { comfortScore } from "../../lib/scoring/comfort";
import type { DailyComfortInput } from "../../lib/scoring/comfort";

export interface EvalCase {
  id: string;
  trace: string[];
  dimension: string;
  capability: string;
  scenario: string;
  produce: () => Promise<string> | string;
  rubric: string[];
}

function describe(input: DailyComfortInput): string {
  const { value, rationale } = comfortScore(input);
  return [
    `Conditions: ${JSON.stringify(input)}`,
    `Score: ${value}`,
    `Rationale: ${rationale}`,
  ].join("\n");
}

export const cases: EvalCase[] = [
  {
    id: "eval-comfort-rationale-pleasant",
    trace: ["FR-COMFORT-03", "BC-BRAND-01"],
    dimension: "copy-tone",
    capability: "comfort-score",
    scenario:
      "A pleasant day (feels-like 21°C, 0% precip, light wind, moderate cloud, " +
      "low-moderate UV): read the comfort rationale shown to the user.",
    produce: () =>
      describe({ feelsLikeC: 21, precipProbability: 0, windKmh: 8, cloudCover: 40, uvIndex: 3 }),
    rubric: [
      "CRITICAL: the rationale is in Ukrainian (not English or another language)",
      "CRITICAL: the rationale contains no exclamation mark",
      "no emojis or decorative symbols are used",
      "it is a single, calm, practical sentence (not hype, not salesy)",
      "the wording matches pleasant conditions — it reads as a good day to be outside",
    ],
  },
  {
    id: "eval-comfort-rationale-cold",
    trace: ["FR-COMFORT-03", "BC-BRAND-01"],
    dimension: "copy-tone",
    capability: "comfort-score",
    scenario:
      "A cold day (feels-like -8°C): read the comfort rationale shown to the user.",
    produce: () =>
      describe({ feelsLikeC: -8, precipProbability: 10, windKmh: 12, cloudCover: 60, uvIndex: 1 }),
    rubric: [
      "CRITICAL: the rationale is in Ukrainian",
      "CRITICAL: the rationale contains no exclamation mark",
      "no emojis or decorative symbols are used",
      "the rationale accurately reflects the cold as the dominant condition",
      "tone is calm and practical — it informs, it does not alarm or scold",
    ],
  },
  {
    id: "eval-comfort-rationale-wet",
    trace: ["FR-COMFORT-03", "BC-BRAND-01"],
    dimension: "copy-tone",
    capability: "comfort-score",
    scenario:
      "A wet day (95% precipitation probability): read the comfort rationale shown to the user.",
    produce: () =>
      describe({ feelsLikeC: 16, precipProbability: 95, windKmh: 15, cloudCover: 90, uvIndex: 2 }),
    rubric: [
      "CRITICAL: the rationale is in Ukrainian",
      "CRITICAL: the rationale contains no exclamation mark",
      "no emojis or decorative symbols are used",
      "the rationale accurately reflects the high chance of rain as the dominant condition",
      "tone is calm and practical — a measured heads-up, not dramatic",
    ],
  },
  {
    id: "eval-comfort-rationale-hostile",
    trace: ["FR-COMFORT-03", "BC-BRAND-01"],
    dimension: "copy-tone",
    capability: "comfort-score",
    scenario:
      "A hostile day (near-freezing, 100% precip, strong wind, full cloud): read the rationale.",
    produce: () =>
      describe({ feelsLikeC: 0, precipProbability: 100, windKmh: 60, cloudCover: 100, uvIndex: 0 }),
    rubric: [
      "CRITICAL: the rationale is in Ukrainian",
      "CRITICAL: the rationale contains no exclamation mark",
      "no emojis or decorative symbols are used",
      "the rationale honestly conveys that conditions are poor for being outside",
      "tone remains calm and blame-free — it does not catastrophize or read like a crash",
    ],
  },
];

// @trace FR-COMFORT-03, BC-BRAND-01
