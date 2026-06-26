// Agent <-> app state bridge (docs/day-03-skills-demo.md §7).
//
// GET returns the latest recommendation the agent produced PLUS the current
// inbox entry (so the UI can show "agent is thinking…" between a browser question
// and its answer). In Stage 1 the skill runner writes recommendation.json and
// the watch loop maintains inbox.json; this route just reads both. Read-only,
// calm-by-default: missing/unreadable files are nulls (200), never a 500.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { isRecommendation } from "@/lib/recommend/validate";

// Never cache — each poll must observe the freshest files.
export const dynamic = "force-dynamic";

const BRIDGE = join(process.cwd(), "agent-bridge");

async function readJson(name: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(join(BRIDGE, name), "utf8"));
  } catch {
    return null;
  }
}

export async function GET(): Promise<Response> {
  const [rec, inbox] = await Promise.all([
    readJson("recommendation.json"),
    readJson("inbox.json"),
  ]);
  // A malformed recommendation degrades to null (the calm idle state) rather than
  // reaching the client renderer and throwing.
  const recommendation = isRecommendation(rec) ? rec : null;
  return Response.json({ recommendation, inbox });
}
