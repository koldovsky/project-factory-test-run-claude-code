# Day 03 — Programming Agents: four ways, one task

> **Course:** Agentic Engineering (fwdays) · **Demo app:** `weather-explorer`
> **Status:** all four parts built & verified · **Updated:** 2026-06-26

Design record / source of truth for the Day 03 demo. If reality and this file
disagree, fix this file first. (Detailed build history is condensed in the
Appendix; full detail lives in git history + the session memory.)

> **Build order vs teaching order.** The "Part N" numbers here follow the build
> order (Extend → Embed → Ship → MCP), which is also what the code comments cite.
> The **slides** present them simplest-first: **Ship → Extend → Embed → MCP.**

## Build status

- **Part 1 — Extend an agent with a Skill — BUILT & hardened.** Claude Code +
  the `where-to-go` skill drives the Weather Explorer app.
- **Part 2 — Embed an agent in the app (GenUI + Vercel AI SDK) — BUILT & verified live.**
  `app/api/chat/route.ts` (`streamText` + 2 tools: `getWeatherTable`, `showRecommendation`)
  · `components/assistant/Assistant.tsx` (`useChat`) · shared `components/recommend/RecommendationCard.tsx`
  (reused by Part 1's panel) · mounted on the home page. Deps: `ai@7`,
  `@ai-sdk/react@4`, `@ai-sdk/openai@4`, `zod`. The model ranks (two-tool chain); the
  result renders as the shared card (generative UI). Needs `OPENAI_API_KEY`
  (`OPENAI_MODEL` optional, default `gpt-4o-mini`) in `.env.local`.
- **Part 3 — Self-contained, portable Skill — BUILT & verified.**
  `.claude/skills/holiday-weather/` = `SKILL.md` + a zero-dependency `run.mjs`
  (vendored city list + direct Open-Meteo fetch + compact comfort hint; the agent
  ranks for ANY criterion from the printed metrics). Verified running from a temp
  dir OUTSIDE the repo (only the 2 files, no `node_modules`/key). Installed into the
  Hermes skills dir; same folder works in Claude Code and any harness — copy it in.
- **Part 4 — Custom MCP server — BUILT & verified.** `mcp/weather.ts` exposes the
  SAME `lib/recommend` core as Model Context Protocol tools (`get_weather_table`,
  `recommend`), so any MCP client (Claude Desktop / Code, Cursor, Hermes…) uses it
  as native tools. Reuses `getWeatherTable` + `buildRecommendation`, so grounding
  (unknown cities skipped, scores clamped, order normalised) is identical to Parts
  1–3. Runs via `tsx` over stdio; verified with `scripts/mcp-smoke.mjs` (initialize
  → tools/list → call both tools; the fake city "Атлантида" is correctly skipped).
  Dep: `@modelcontextprotocol/sdk@1`.
- **DROPPED** (see §7): connecting Hermes to the app over HTTP.

---

## 1. Thesis

Day 03 shows the **spectrum of "programming an agent"** through one concrete task —
*recommend where to travel in Ukraine this weekend, by weather* — built four
ways, each a different place the agent **lives** (or connects to):

1. **Extend** an existing agent with a **Skill** — Claude Code drives our app.
2. **Embed** an agent **inside the app** — Vercel AI SDK + generative UI.
3. **Ship** a **self-contained, portable Skill** — Hermes / any harness, zero deps.
4. **Expose** the core as a **custom MCP server** — any MCP client connects.

It connects Days 01–02: Day 01's static-vs-dynamic context (a Skill *is* dynamic
context); Day 02's framework-free `lib/` ("agent-ready") is reused by Extend, Embed
and the MCP server.

**Punchline:** same task, one core (`lib/recommend`) — shipped four ways.

---

## 2. The four parts

| Part | Where the agent lives | How it answers | Reuses | Status |
| --- | --- | --- | --- | --- |
| 1 · Extend | External (Claude Code) + a Skill | runs the skill → app UI updates | `lib/recommend` + app routes | **built** |
| 2 · Embed | Inside the app (AI SDK) | in-app chat → model + tool → streamed generative UI | `lib/recommend` + components | **built** |
| 3 · Ship | Any harness, standalone | skill does it all itself → answers in the terminal | nothing (self-contained) | **built** |
| 4 · MCP | Standalone server; any MCP client connects | client calls tools → ranks → grounded result | `lib/recommend` | **built** |

---

## 3. Part 1 — Extend an agent with a Skill (BUILT)

The external agent (Claude Code) gains a capability from a dropped-in skill folder;
the skill drives our app. This is the Day 01/02 payoff: a portable `SKILL.md` +
script, reusing the framework-free `lib/`.

**Flow:** the agent runs `where-to-go` →
`run.mjs data '{when}'` (`GET /api/data` → `getWeatherTable`, all-city metrics) →
the agent ranks for the user's criterion → `run.mjs publish '{ranked…}'`
(`POST /api/publish` → `buildRecommendation`, writes the shared bridge state) →
the app's `RecommendationPanel` shows it (question + comment + ranking + history).

**Two input surfaces:** (a) ask Claude Code directly; (b) the in-app ask box →
`/api/ask` writes `agent-bridge/inbox.json` → `scripts/agent-watch.mjs` hands it to
`claude -p` (manual, user-started; security-gated). Either way the same panel updates.

**Key design choices (settled):** the AGENT ranks freely for ANY criterion (cool /
warm / dry / "rainy" / …) and must narrate exactly what it published (text == UI);
`run.mjs` is a dependency-free plain-Node HTTP client (no `tsx`, no `lib`, no repo);
bridge files are written in place (Windows `rename`-replace throws EPERM under the
poller — readers degrade calmly on a torn read). See the Appendix for the two
adversarial-review hardening passes.

---

## 4. Part 2 — Embed an agent in the app (GenUI + Vercel AI SDK) — BUILT

> Refs: Vercel AI SDK <https://ai-sdk.dev/docs/foundations/overview> ·
> RSC GenUI template <https://vercel.com/templates/next.js/rsc-genui>

**Goal:** the app hosts its **own** agent — no external harness, no file bridge.
A chat lives in the app; you ask in natural language; the model (via the AI SDK)
calls a weather tool and the answer renders as **real React components**
(generative UI). This is the "ask from the app, self-contained" version.

**Stack:** `ai` (core) + `@ai-sdk/react` (`useChat`) + **`@ai-sdk/openai`** (needs
`OPENAI_API_KEY` in the app's server env). RSC `@ai-sdk/rsc` is the alternative we
are NOT using.

**Approach — AI SDK UI (current Vercel recommendation), not RSC `streamUI`.** A
route handler streams tool *data*; the client renders components from tool results.

```ts
// app/api/chat/route.ts
const result = streamText({
  model: openai(MODEL),                 // OPENAI_MODEL ?? "gpt-4o-mini"
  system: `${dateContext}\n\n${SYSTEM}`,
  messages: await convertToModelMessages(messages),
  stopWhen: stepCountIs(6),
  tools: { getWeatherTable, showRecommendation },
});
return result.toUIMessageStreamResponse();
```
```tsx
// client: useChat() → render each tool result as our existing component
{message.parts.map(p => p.type === "tool-showRecommendation" && p.state === "output-available"
  ? <RecommendationCard rec={p.output} />          // generative UI
  : null)}
```

**Tool design — model ranks (two tools).** `getWeatherTable({when,dates})` (fetch,
reuse `lib/recommend`) + `showRecommendation({criterion, ranked, …})` (the model
passes its ranking; `execute` runs `buildRecommendation` for validation and returns
the `Recommendation`; the client renders `<RecommendationCard>`). Keeps "agent ranks
freely" consistent with Part 1; the model chains the two tool calls.

**Resolved:** model = `gpt-4o-mini` (overridable via `OPENAI_MODEL`); the GenUI chat
sits **beside** the ask box as a separate assistant panel; today's date is injected
into the system prompt so the model stops emitting training-era years.

**Teaching point:** same task, but the agent is now **native to the app** (SDK-
embedded), streaming UI it generates — contrast with Part 1's external agent.

---

## 5. Part 3 — Self-contained, portable Skill (Hermes / any harness) — BUILT

**Goal:** a skill that does the **whole job itself with ZERO dependencies** —
fetch Open-Meteo, rank by the user's criterion, answer in the terminal. No app, no
`lib`, no build, no network to localhost. Copy the folder into any harness's skills
dir and it just works. This is the purest "skills are a portable standard" demo.

**Shape:** `holiday-weather/` = `SKILL.md` + one plain-Node `run.mjs` that **vendors**
its own small UA city list + does the Open-Meteo fetch + a compact comfort hint +
prints the per-city table. Self-contained (plain `node` + global `fetch`).

**Model's job vs script's job:** the script fetches + prints metrics (incl. a comfort
hint); the **model ranks** for the user's actual criterion and narrates. Same
thin-script / agent-ranks lever as Parts 1, 2 and 4.

**Contrast with Part 1's `where-to-go`** (app-coupled via HTTP): Part 3 is
**terminal-only and standalone** — it answers, it does not drive the app.

**Install (Hermes):** copy the folder into `HERMES_HOME/skills/`; Hermes scans it
automatically (discovery verified). Same folder runs in Claude Code / OpenClaw.

---

## 6. Part 4 — Custom MCP server (BUILT)

> Ref: Model Context Protocol <https://modelcontextprotocol.io> ·
> SDK `@modelcontextprotocol/sdk@1`

**Goal:** expose the SAME core as a **standard MCP server**, so *any* MCP-speaking
client — Claude Desktop, Claude Code, Cursor, an MCP-capable harness — gets the
capability as **native tools**, with no bespoke skill and no HTTP glue. This is the
"one capability, spoken in the open protocol" surface.

**Shape:** `mcp/weather.ts` — a tiny `McpServer` over `StdioServerTransport` that
imports from `lib/recommend` and registers two tools, mirroring the Part 2 design:

- `get_weather_table({ when?, dates? })` → `getWeatherTable(resolveDates(…))` — the
  data (the connecting agent ranks).
- `recommend({ criterion, ranked, … })` → `buildRecommendation(…)` — the agent's
  ranking, **grounded** (names resolved against curated `CITIES`, scores clamped,
  order normalised). Identical validation to Parts 1–4.

Runs with `tsx` (already a devDep): `npx tsx mcp/weather.ts`. The lib chain is pure
TypeScript with relative imports, so it loads outside Next with no build step.

**Connect (Claude Code):** `claude mcp add weather -- npx tsx mcp/weather.ts`
(from the project root). Other clients use the same command in their MCP config.

**Verify:** `npm run mcp:smoke` (`scripts/mcp-smoke.mjs`) spawns the server over
stdio and does initialize → `tools/list` → `get_weather_table` → `recommend`. The
deliberate fake city "Атлантида" is dropped with a note — proof the shared grounding
applies on this surface too.

**Teaching point:** Ship copies a folder; MCP runs a server and clients *connect*.
Same core, a different distribution model — and the open standard agents already speak.

---

## 7. What changed from the prior plan

- **DROPPED — connecting Hermes to the app over HTTP.** It added coupling that
  fought the "portable skill" thesis. The HTTP routes (`/api/data`, `/api/publish`)
  and the `run.mjs` HTTP client **remain** — they power **Part 1** (Claude driving
  the app). Only the *Hermes → app over HTTP* path is gone; Hermes gets the
  standalone skill (Part 3).
- **RE-ADDED — MCP, now as Part 4.** Earlier dropped as redundant with the portable
  skill; brought back as a distinct *surface* (a standard server many clients
  connect to, vs. a folder you copy). It reuses the same `lib/recommend` core, so it
  was cheap to add and makes the "one core, many surfaces" point concrete.
- **KEPT — everything supporting Parts 1–3:** `lib/recommend/*`, the `/api/*` routes,
  `RecommendationPanel`, history, the watcher, the GenUI assistant, the skills.

---

## 8. File manifest

**Part 1 (Extend):** `lib/recommend/{cities,weatherTable,publish,history,validate,dates,forecasts}.ts`
(+ tests, 30+ passing) · `.claude/skills/where-to-go/{SKILL.md,run.mjs}` ·
`app/api/{data,publish,agent-state,ask,history}/route.ts` ·
`components/recommend/{RecommendationPanel,AskBox,RecommendationCard}.tsx` · `scripts/agent-watch.mjs`.

**Part 2 (Embed):** `app/api/chat/route.ts` · `components/assistant/Assistant.tsx`
(chat + GenUI) · two tools reusing `lib/recommend` · deps: `ai@7`, `@ai-sdk/react@4`,
`@ai-sdk/openai@4`.

**Part 3 (Ship):** `.claude/skills/holiday-weather/{SKILL.md,run.mjs}` (zero-dep,
self-contained) → also installed into the Hermes skills dir; copy to OpenClaw / any
harness the same way.

**Part 4 (MCP):** `mcp/weather.ts` (server, reuses `lib/recommend`) ·
`scripts/mcp-smoke.mjs` (stdio smoke test) · scripts `mcp` / `mcp:smoke` · dep:
`@modelcontextprotocol/sdk@1`.

---

## 9. Demo running order

The slides present these simplest-first (**Ship → Extend → Embed → MCP**):

1. **Ship:** in Hermes (small free model), ask «куди поїхати на вихідні, хочу
   прохолоди» → the standalone skill answers in the terminal with zero app
   dependency. "Same skill folder, any harness."
2. **Extend:** in Claude Code, ask the same → Claude runs `where-to-go` → the app
   panel updates. (Optionally show the in-app ask box → watcher → `claude -p`.)
3. **Embed:** open the app's built-in assistant, ask the same → the model streams a
   generated recommendation card, entirely inside the app (no external agent).
4. **MCP:** `npm run mcp:smoke` (or connect via `claude mcp add weather …`) → the
   same two tools answer over the open protocol; grounding (skips "Атлантида") holds.

Close: *static context defines who an agent is; these four show where its
*capabilities* can live — bolted on, built in, shipped as a portable skill, or
exposed over an open protocol.*

---

## Appendix — build log & lessons (condensed)

- **Agent-ranks-freely:** a fixed comfort ranker couldn't answer "I want cool/rainy";
  the agent now ranks for any criterion and narrates exactly what it published.
- **Windows file IO:** temp-file + `rename` atomic writes throw `EPERM` when the 1.5s
  poller holds the file open → reverted to in-place writes; readers catch parse errors.
- **Two adversarial-review workflows** (4-lens, then 2-lens) found 17 confirmed issues
  across the build; all fixed (no-winner rendering, malformed-file calm-degrade via
  `validate.ts`, double-fetch, primitive-body 500, partial-date-coverage notes,
  history-clobber-on-corrupt, input caps, dead-code removal). 30+ unit tests green.
- **Q&A UX:** the panel shows the original question + an agent comment + the ranking,
  with a freshness gate (no stale result on load) and an expandable history list.
- **MCP (Part 4):** reusing `lib/recommend` from `mcp/weather.ts` needed no build —
  `tsx` loads the pure-TS chain over stdio; the same `buildRecommendation` grounding
  (drops unknown "Атлантида") is exercised by `scripts/mcp-smoke.mjs`.
