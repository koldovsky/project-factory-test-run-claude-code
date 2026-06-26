// Query history (docs/day-03-skills-demo.md §7).
//
// GET returns the bounded log of past recommendations the agent published
// (agent-bridge/history.json, newest first), fetched on demand by the panel's
// history view. Read-only, calm-by-default: missing/unreadable → empty list.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { isRecommendation } from "@/lib/recommend/validate";

export const dynamic = "force-dynamic";

const HISTORY_PATH = join(process.cwd(), "agent-bridge", "history.json");

export async function GET(): Promise<Response> {
  try {
    const parsed: unknown = JSON.parse(await readFile(HISTORY_PATH, "utf8"));
    // Drop any malformed entry so a corrupt/hand-edited file can't crash the
    // client renderer — it degrades to "fewer entries", never a blank page.
    const history = Array.isArray(parsed) ? parsed.filter(isRecommendation) : [];
    return Response.json({ history });
  } catch {
    return Response.json({ history: [] });
  }
}
