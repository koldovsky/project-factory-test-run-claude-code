// Domain types for the agent-ranked "where to go" flow (docs/day-03-skills-demo.md).
// Framework-free (TC-PURE-01): no next/*, react, or DOM imports.
//
// The AGENT ranks the cities for whatever the user asked (cool / warm / dry /
// "for hiking" / …) and publishes the result; the app only renders it. So a
// RankedCity carries the agent's own `score` (fit to its chosen `criterion`) and
// `note`, not a fixed comfort metric. `generatedAt` is added by the IO layer
// (the skill runner) — the pure layer never reads the clock.

import type { ComfortBand } from "../scoring/band";

export interface RankedCity {
  nameUk: string;
  nameEn: string;
  lat: number;
  lon: number;
  /** Agent-assigned 0..100 fit to the requested criterion. */
  score: number;
  /** Colour band derived from `score` (for the pill). */
  band: ComfortBand;
  /** Agent's one-line reason for this city, in Ukrainian. */
  note: string;
  /** App control surface: `/?lat&lon&name` (host-less). */
  deepLink: string;
}

export interface Recommendation {
  /** Dates considered + what the agent optimised for, in the user's own words. */
  query: { dates: string[]; criterion: string };
  /** The user's original question, verbatim (for the Q&A header). */
  question?: string;
  /** The agent's short prose comment on the answer (1–2 sentences, Ukrainian). */
  summary?: string;
  /** The agent's order (best first). */
  ranked: RankedCity[];
  winner: RankedCity | null;
  /** Calm Ukrainian notes (unknown city skipped, dates beyond horizon, …). */
  notes: string[];
}
