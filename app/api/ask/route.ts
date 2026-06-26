// Browser -> agent inbox (docs/day-03-skills-demo.md §7, "ask from the app").
//
// The web "ask" box POSTs a natural-language question here; this route writes it
// to agent-bridge/inbox.json with status "pending". A watch loop
// (scripts/agent-watch.mjs) hands the question to the AGENT, which uses the
// where-to-go skill to think and writes recommendation.json — the app never does
// the reasoning itself. Calm-by-default: a bad body is a 400, never a 500.

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const BRIDGE_DIR = join(process.cwd(), "agent-bridge");
const INBOX_PATH = join(BRIDGE_DIR, "inbox.json");
const MAX_QUESTION = 500;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const raw = (body as { question?: unknown })?.question;
  const question = typeof raw === "string" ? raw.trim().slice(0, MAX_QUESTION) : "";
  if (question === "") {
    return Response.json({ ok: false, error: "empty-question" }, { status: 400 });
  }

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { id, question, status: "pending", createdAt: new Date().toISOString() };

  try {
    await mkdir(BRIDGE_DIR, { recursive: true });
    // In-place write (not temp+rename): on Windows, renaming over the file the
    // API poller holds open throws EPERM; the reader degrades calmly on a torn read.
    await writeFile(INBOX_PATH, JSON.stringify(entry, null, 2), "utf8");
  } catch {
    return Response.json({ ok: false, error: "write-failed" }, { status: 500 });
  }

  return Response.json({ ok: true, id });
}
