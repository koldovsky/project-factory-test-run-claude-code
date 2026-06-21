// Eval case — app-shell copy tone.
//
// Grades the QUALITY a unit test cannot: is the empty-state hero copy and the
// deep-link error notice calm, practical, Ukrainian, and free of exclamation
// marks and emojis (BC-BRAND-01, FR-SHELL-03)? The unit tests assert the keys
// exist and contain no "!"; THIS eval scores whether the prose actually reads
// calm and practical to a judge.
//
// `produce()` returns the user-visible copy by reading it from the i18n source
// of truth once `lib/i18n` exists. It is intentionally written against the
// not-yet-created module: the eval is the BAR, graded by the eval-suite
// workflow after the strings are implemented.

import { t } from "../../lib/i18n";

export interface EvalCase {
  id: string;
  trace: string[];
  dimension: string;
  capability: string;
  scenario: string;
  produce: () => Promise<string> | string;
  rubric: string[];
}

export const cases: EvalCase[] = [
  {
    id: "eval-copy-tone-empty-state-hero",
    trace: ["BC-BRAND-01", "FR-SHELL-03"],
    dimension: "copy-tone",
    capability: "app-shell",
    scenario:
      "First load with no lat/lon/name params: read the empty-state hero copy " +
      "(title + subtitle) and the centered-search placeholder shown to the user.",
    produce: async () =>
      [
        `Hero title: ${t("heroTitle")}`,
        `Hero subtitle: ${t("heroSubtitle")}`,
        `Search placeholder: ${t("searchPlaceholder")}`,
      ].join("\n"),
    rubric: [
      "CRITICAL: every string is in Ukrainian (not English or another language)",
      "CRITICAL: no string contains an exclamation mark",
      "no emojis or decorative symbols are used",
      "tone is calm and practical — informative, not hype or salesy",
      "the copy clearly invites the user to search for a city as the primary action",
    ],
  },
  {
    id: "eval-copy-tone-deep-link-error-notice",
    trace: ["BC-BRAND-01", "FR-SHELL-03"],
    dimension: "copy-tone",
    capability: "app-shell",
    scenario:
      "A deep link with invalid or incomplete lat/lon/name falls back to the " +
      "empty state with an inline notice: read the notice text shown to the user.",
    produce: async () => `Deep-link error notice: ${t("deepLinkErrorNotice")}`,
    rubric: [
      "CRITICAL: the notice is in Ukrainian",
      "CRITICAL: the notice contains no exclamation mark",
      "no emojis or decorative symbols are used",
      "the message is calm and blame-free — it does not scold the user or read like a crash",
      "it explains that the link could not be opened and implies the user can search instead",
    ],
  },
];

// @trace BC-BRAND-01, FR-SHELL-03
