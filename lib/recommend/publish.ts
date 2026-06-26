// Publish the agent's ranking to the app (docs/day-03-skills-demo.md).
//
// The "publish" half of the agent-ranked flow: the AGENT decides the order,
// scores and notes; this turns that into a validated Recommendation the UI reads.
// It grounds the agent's output — every city name is resolved against the curated
// CITIES list (unknown names are skipped with a note, never fabricated), and
// coordinates / deep-links come from CITIES, not from the model. Pure & total.

import { comfortBand } from "../scoring/band";
import { CITIES } from "./cities";
import type { RankedCity, Recommendation } from "./types";

export interface RankingEntry {
  /** City name in Ukrainian or English (resolved against CITIES). */
  name: string;
  /** 0..100 fit to the criterion (clamped). */
  score: number;
  /** One-line Ukrainian reason. */
  note?: string;
}

export interface PublishInput {
  dates: string[];
  /** What the agent optimised for, in the user's words (e.g. "прохолода"). */
  criterion: string;
  /** The user's original question, verbatim. */
  question?: string;
  /** The agent's short prose comment (1–2 sentences, Ukrainian). */
  summary?: string;
  ranked: RankingEntry[];
  notes?: string[];
}

// Bound persisted free-text so a malformed/oversized agent payload can't bloat
// the bridge files or break the renderer.
const MAX_TEXT = 280;
const MAX_NOTES = 12;

function clampText(s: string, max: number = MAX_TEXT): string {
  return s.length > max ? s.slice(0, max) : s;
}

function trimOpt(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = clampText(raw.trim());
  return t === "" ? undefined : t;
}

function findCity(name: unknown) {
  if (typeof name !== "string") return undefined;
  const n = name.trim().toLowerCase();
  return CITIES.find((c) => c.nameUk.toLowerCase() === n || c.nameEn.toLowerCase() === n);
}

function clampScore(raw: unknown): number {
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Build a validated Recommendation from the agent's ranking. Never throws. */
export function buildRecommendation(input: PublishInput): Recommendation {
  // Keep only string notes (a non-string note would crash the React renderer).
  const notes: string[] = (Array.isArray(input?.notes) ? input.notes : []).filter(
    (n): n is string => typeof n === "string",
  );
  const ranked: RankedCity[] = [];
  const seen = new Set<string>();

  for (const entry of Array.isArray(input?.ranked) ? input.ranked : []) {
    const city = findCity(entry?.name);
    if (!city) {
      notes.push(`Невідоме місто пропущено: ${String(entry?.name ?? "")}`.trim());
      continue;
    }
    if (seen.has(city.nameEn)) continue; // de-dupe repeats
    seen.add(city.nameEn);
    const score = clampScore(entry?.score);
    ranked.push({
      nameUk: city.nameUk,
      nameEn: city.nameEn,
      lat: city.lat,
      lon: city.lon,
      score,
      band: comfortBand(score),
      note: clampText(typeof entry?.note === "string" ? entry.note.trim() : ""),
      deepLink: `/?lat=${city.lat}&lon=${city.lon}&name=${encodeURIComponent(city.nameUk)}`,
    });
  }

  // Normalise display order: best score first (the winner is the top fit), so the
  // card is always cleanly ordered even if the agent emits an out-of-order list.
  ranked.sort((a, b) => b.score - a.score);

  const criterion = typeof input?.criterion === "string" && input.criterion.trim()
    ? clampText(input.criterion.trim())
    : "комфорт";
  const dates = Array.isArray(input?.dates) ? input.dates.filter((d) => typeof d === "string") : [];

  return {
    query: { dates, criterion },
    question: trimOpt(input?.question),
    summary: trimOpt(input?.summary),
    ranked,
    winner: ranked[0] ?? null,
    notes: notes.map((n) => clampText(n)).slice(0, MAX_NOTES),
  };
}
