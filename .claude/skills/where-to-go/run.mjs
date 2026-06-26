// Stage 2 runner for the `where-to-go` skill (docs/day-03-skills-demo.md §7).
//
// A dependency-free HTTP client: plain Node + global fetch, NO app code, NO tsx,
// NO repo. That is what makes the skill portable — copy this folder into any
// harness's skills dir, point WEATHER_APP_URL at the running app, and it works.
//
//   node run.mjs data    '{"when":"this-weekend"}'
//   node run.mjs publish '{"question":"...","criterion":"прохолода","summary":"...",
//                          "dates":["2026-06-27","2026-06-28"],
//                          "ranked":[{"name":"Суми","score":88,"note":"≈25°"}]}'
//
// WEATHER_APP_URL defaults to http://localhost:3000.

const BASE = process.env.WEATHER_APP_URL ?? "http://localhost:3000";

function parseArg(raw) {
  if (!raw) return {};
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    console.error("Invalid JSON argument.");
    process.exit(1);
  }
  // Collapse non-object results (null, primitives, arrays) to {} so arg access is safe.
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

async function runData(arg) {
  const qs = new URLSearchParams();
  if (Array.isArray(arg.dates) && arg.dates.length) qs.set("dates", arg.dates.join(","));
  else if (arg.when) qs.set("when", String(arg.when));
  const res = await fetch(`${BASE}/api/data?${qs.toString()}`);
  if (!res.ok) {
    console.error(`data request failed: ${res.status} (is the app running at ${BASE}?)`);
    process.exit(1);
  }
  // Print the weather table JSON verbatim for the agent to rank.
  console.log(await res.text());
}

async function runPublish(arg) {
  const res = await fetch(`${BASE}/api/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    console.error(`publish failed: ${res.status} ${data?.error ?? ""}`.trim());
    process.exit(1);
  }
  const lines = [`Опубліковано · критерій: ${data.criterion} · дати: ${(data.dates ?? []).join(", ")}`];
  if (data.winner) {
    lines.push(`Найкраще: ${data.winner.nameUk} — ${data.winner.score}/100. ${data.winner.note}`);
    lines.push(`Відкрити: ${BASE}${data.winner.deepLink}`);
  } else {
    lines.push("Порожній рейтинг — жодне місто не розпізнано.");
  }
  for (const note of data.notes ?? []) lines.push(`Примітка: ${note}`);
  console.log(lines.join("\n"));
}

async function main() {
  const mode = process.argv[2];
  const arg = parseArg(process.argv[3]);
  if (mode === "data") await runData(arg);
  else if (mode === "publish") await runPublish(arg);
  else {
    console.error("Usage: node run.mjs <data|publish> '{...}'");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("where-to-go failed:", err?.message ?? err);
  process.exit(1);
});
