// Eval case — forecast error copy + weather-condition name quality.
//
// Grades the QUALITY a unit test cannot: the unit tests in
// `lib/weather/code.test.ts` assert that each weather-condition label is
// Ukrainian, non-empty, and free of "!"/emoji; the forecast spec requires the
// fetch-failure state to be a CALM inline message in Ukrainian with no
// exclamation marks (FR-FORECAST-01, BC-BRAND-01, NFR-OBS-01). THIS eval scores
// whether that prose actually READS calm, clear, and natural to a judge.
//
// `produce()` returns the user-visible copy by calling the not-yet-created
// `lib/weather/code` mapper and reading the not-yet-added forecast-error i18n
// keys (`forecastError`, `forecastRetry`) from `lib/i18n`. It is intentionally
// written against those targets: the eval is the BAR, graded by the eval-suite
// workflow after the slice is implemented.

import { weatherCodeToCondition } from "../../lib/weather/code";
import { uk } from "../../lib/i18n/uk";

export interface EvalCase {
  id: string;
  trace: string[];
  dimension: string;
  capability: string;
  scenario: string;
  produce: () => Promise<string> | string;
  rubric: string[];
}

// i18n keys this eval reads. Typed loosely so the case file compiles before the
// implementer adds the keys; the eval grades the copy once they exist.
const messages = uk as Record<string, string>;

function describeConditions(codes: number[]): string {
  return codes
    .map((code) => {
      const { icon, label } = weatherCodeToCondition(code);
      return `WMO ${code} -> icon "${icon}", label "${label}"`;
    })
    .join("\n");
}

export const cases: EvalCase[] = [
  {
    id: "eval-forecast-error-copy-tone",
    trace: ["FR-FORECAST-01", "BC-BRAND-01"],
    dimension: "error-clarity",
    capability: "forecast",
    scenario:
      "The Open-Meteo forecast fetch fails (network error or non-success status) " +
      "for the active location: read the inline forecast error message and its " +
      "retry control label shown to the user.",
    produce: () =>
      [
        `Error message: ${messages.forecastError}`,
        `Retry control: ${messages.forecastRetry}`,
      ].join("\n"),
    rubric: [
      "CRITICAL: the copy is in Ukrainian (not English or another language)",
      "CRITICAL: the copy contains no exclamation mark",
      "no emojis or decorative symbols are used",
      "the message states, calmly, that the forecast could not be loaded right now",
      "the retry control label clearly invites another attempt (e.g. try again)",
      "tone is calm, blame-free, and practical — it reassures, it does not alarm",
    ],
  },
  {
    id: "eval-forecast-condition-names",
    trace: ["FR-FORECAST-02", "BC-BRAND-01"],
    dimension: "copy-tone",
    capability: "forecast",
    scenario:
      "Across representative WMO weather codes (clear, partly cloudy, overcast, " +
      "fog, drizzle, rain, snow, showers, thunderstorm), read the Ukrainian " +
      "weather-condition names used as the day-card icon alt text.",
    produce: () => describeConditions([0, 2, 3, 45, 51, 61, 71, 80, 95, 99]),
    rubric: [
      "CRITICAL: every condition name is in natural Ukrainian",
      "CRITICAL: no condition name contains an exclamation mark",
      "no emojis or decorative symbols are used",
      "each name accurately describes its weather code (e.g. clear vs overcast vs rain vs snow vs thunderstorm are distinguishable)",
      "the names are concise, neutral noun phrases suitable as icon alt text — not full sentences, not hype",
    ],
  },
];

// @trace FR-FORECAST-01, FR-FORECAST-02, BC-BRAND-01
