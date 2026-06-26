// Structural guard for a published Recommendation (docs/day-03-skills-demo.md).
//
// The bridge files (recommendation.json, history.json) are agent-written and
// gitignored, so a hand-edited / partially-corrupt-but-valid-JSON file is a real
// failure mode. The API routes use this to drop malformed payloads instead of
// passing them to the client renderer (which would throw and blank the panel).
// Pure & total: never throws. Extra fields (generatedAt, id, question, summary)
// are allowed — only the fields the UI dereferences are required.

import type { Recommendation } from "./types";

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

export function isRecommendation(x: unknown): x is Recommendation {
  if (!isObject(x)) return false;
  if (!isObject(x.query)) return false;
  if (!Array.isArray((x.query as Record<string, unknown>).dates)) return false;
  if (typeof (x.query as Record<string, unknown>).criterion !== "string") return false;
  // ranked must be an array of objects (the renderer dereferences each item).
  if (!Array.isArray(x.ranked) || !x.ranked.every((it) => isObject(it))) return false;
  // notes must be string[] — a non-string note would crash the React renderer.
  if (!Array.isArray(x.notes) || !x.notes.every((n) => typeof n === "string")) return false;
  // winner is null or an object (missing sub-fields render as undefined, no throw).
  if (!(x.winner === null || isObject(x.winner))) return false;
  return true;
}
