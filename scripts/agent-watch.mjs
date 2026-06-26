// Agent inbox watcher (docs/day-03-skills-demo.md §7, "ask from the app").
//
// Polls agent-bridge/inbox.json. When the browser drops a new pending question,
// it hands that question to the AGENT — by default Claude Code headless
// (`claude -p`) running in this repo, so the agent uses the where-to-go skill to
// think and write recommendation.json. The watcher itself does NO reasoning; it
// is just the inbox -> agent bridge. Set AGENT_CMD to use a different harness
// (e.g. Hermes); the custom command receives the question on stdin and in
// $AGENT_QUESTION.
//
// Run:  node scripts/agent-watch.mjs    (or: npm run agent:watch)
//
// SECURITY: by default this hands each browser-submitted question to
// `claude -p --dangerously-skip-permissions`, i.e. it auto-runs an agent with
// permissions bypassed on whatever the local /api/ask endpoint receives. Start
// it only yourself, on your own machine, for the demo — it is intentionally NOT
// launched automatically. For a tighter posture, set AGENT_CMD to a scoped
// invocation (e.g. `claude -p --allowedTools "Bash(npx tsx*)"`).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const BRIDGE = join(REPO, "agent-bridge");
const INBOX = join(BRIDGE, "inbox.json");
const POLL_MS = 1000;

const DIRECTIVE =
  "Використай навичку where-to-go, щоб відповісти на це запитання про подорож " +
  "Україною. Відповідай стисло, українською.";

let lastHandledId = null;

async function readInbox() {
  try {
    return JSON.parse(await readFile(INBOX, "utf8"));
  } catch {
    return null;
  }
}

async function writeInbox(obj) {
  await mkdir(BRIDGE, { recursive: true });
  // In-place write (not temp+rename): on Windows, renaming over the file the API
  // poller holds open throws EPERM; the reader degrades calmly on a torn read.
  await writeFile(INBOX, JSON.stringify(obj, null, 2), "utf8");
}

function runAgent(question) {
  const prompt = `${question}\n\n${DIRECTIVE}`;
  const opts = {
    cwd: REPO,
    shell: true,
    stdio: ["pipe", "inherit", "inherit"],
    env: { ...process.env, AGENT_QUESTION: question },
  };
  const child = process.env.AGENT_CMD
    ? spawn(process.env.AGENT_CMD, opts)
    : spawn("claude", ["-p", "--dangerously-skip-permissions"], opts);
  child.stdin.write(prompt);
  child.stdin.end();
  return new Promise((res) => {
    child.on("close", (code) => res(code ?? 1));
    child.on("error", () => res(1));
  });
}

async function tick() {
  const inbox = await readInbox();
  if (!inbox || inbox.status !== "pending" || inbox.id === lastHandledId) return;
  lastHandledId = inbox.id;
  console.log(`[watch] question: ${inbox.question}`);
  await writeInbox({ ...inbox, status: "processing", processingAt: new Date().toISOString() });

  const code = await runAgent(inbox.question);

  const cur = (await readInbox()) ?? inbox;
  if (cur.id !== inbox.id) return; // a newer question already arrived
  await writeInbox({
    ...cur,
    status: code === 0 ? "answered" : "error",
    answeredAt: new Date().toISOString(),
    ...(code === 0
      ? {}
      : { note: "Агент не зміг обробити запит — перевірте, що 'claude' доступний, або задайте AGENT_CMD." }),
  });
  console.log(`[watch] done (exit ${code})`);
}

console.log(`[watch] watching ${INBOX}`);
console.log(`[watch] agent: ${process.env.AGENT_CMD ?? "claude -p --dangerously-skip-permissions"}`);
console.log("[watch] Ctrl+C to stop");
setInterval(() => {
  tick().catch((e) => console.error("[watch] error", e));
}, POLL_MS);
