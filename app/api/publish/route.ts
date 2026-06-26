// Publish endpoint (docs/day-03-skills-demo.md §7, Stage 2 decoupled).
//
// The skill's `publish` step POSTs its ranking here instead of writing files
// in-process. The server validates the ranking (buildRecommendation), writes the
// shared bridge state (recommendation.json + history.json), and returns a
// confirmation. This is what makes the skill location-independent — it carries no
// app code, only this URL.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { appendHistory, type HistoryEntry } from "@/lib/recommend/history";
import { buildRecommendation, type PublishInput } from "@/lib/recommend/publish";

export const dynamic = "force-dynamic";

const BRIDGE = join(process.cwd(), "agent-bridge");

/** The question currently being processed — fallback if the agent omits it. */
async function inboxQuestion(): Promise<string | undefined> {
  try {
    const inbox = JSON.parse(await readFile(join(BRIDGE, "inbox.json"), "utf8")) as {
      status?: string;
      question?: string;
    };
    if (inbox?.status === "processing" && typeof inbox.question === "string") return inbox.question;
  } catch {
    // no inbox / unreadable → no fallback
  }
  return undefined;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  // Coerce to a real object before mutating — a primitive body (e.g. `"x"`, `5`)
  // would throw on the property assignment below and escape as an unhandled 500.
  const input: PublishInput =
    body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as PublishInput)
      : ({} as PublishInput);
  if (input.question === undefined || input.question === "") {
    const q = await inboxQuestion();
    if (q) input.question = q;
  }

  const rec = buildRecommendation(input);
  const payload = { ...rec, generatedAt: new Date().toISOString() };

  try {
    await mkdir(BRIDGE, { recursive: true });
    // In-place writes (not temp+rename — see run.mjs / docs: Windows EPERM with the
    // concurrent poller; readers degrade calmly on a torn read).
    await writeFile(join(BRIDGE, "recommendation.json"), JSON.stringify(payload, null, 2), "utf8");

    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const histEntry: HistoryEntry = { ...payload, id };
    const histPath = join(BRIDGE, "history.json");
    let existing: unknown = [];
    let preserve = false;
    try {
      const parsed: unknown = JSON.parse(await readFile(histPath, "utf8"));
      existing = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // Missing file → start fresh. Present-but-unparseable (torn/corrupt) → do NOT
      // overwrite, or a single bad read would permanently truncate the whole log.
      if ((err as { code?: string })?.code !== "ENOENT") preserve = true;
    }
    if (!preserve) {
      await writeFile(histPath, JSON.stringify(appendHistory(existing, histEntry), null, 2), "utf8");
    }
  } catch {
    return Response.json({ ok: false, error: "write-failed" }, { status: 500 });
  }

  return Response.json({
    ok: true,
    criterion: rec.query.criterion,
    dates: rec.query.dates,
    winner: rec.winner,
    notes: rec.notes,
  });
}
