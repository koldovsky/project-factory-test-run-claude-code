# Day 03 — Programming Agents: three ways, one task

> **Course:** Agentic Engineering (fwdays) · **Demo app:** `weather-explorer`
> **Status:** Part 1 built · Parts 2 & 3 designed · **Updated:** 2026-06-26

Design record / source of truth for the Day 03 demo. If reality and this file
disagree, fix this file first. (Detailed build history is condensed in the
Appendix; full detail lives in git history + the session memory.)

## Build status

- **Part 1 — Extend an agent with a Skill — BUILT & hardened.** Claude Code +
  the `where-to-go` skill drives the Weather Explorer app.
- **Part 2 — Embed an agent in the app (GenUI + Vercel AI SDK) — BUILT (pending live key test).**
  `app/api/chat/route.ts` (`streamText` + 2 tools: `getWeatherTable`, `showRecommendation`)
  · `components/assistant/Assistant.tsx` (`useChat`) · shared `components/recommend/RecommendationCard.tsx`
  (extracted; reused by Part 1's panel) · mounted on the home page. Deps: `ai@7`,
  `@ai-sdk/react@4`, `@ai-sdk/openai@4`, `zod`. Verified: typecheck against `ai@7`,
  30 tests, lint, home compiles (200), `/api/chat` wired, both panels render (DOM).
  **NOT yet exercised live** — needs `OPENAI_API_KEY` (`OPENAI_MODEL` optional, default
  `gpt-4o-mini`) in `.env.local`. The model ranks (two-tool chain); the result renders
  as the shared card (generative UI).
- **Part 3 — Self-contained, portable Skill (Hermes / any harness) — TO BUILD.**
- **DROPPED** (see §6): connecting Hermes to the app over HTTP; MCP (former Stage 3).

---

## 1. Thesis

Day 03 shows the **spectrum of "programming an agent"** through one concrete task —
*recommend where to travel in Ukraine this weekend, by weather* — built three
ways, each a different place the agent **lives**:

1. **Extend** an existing agent with a **Skill** — Claude Code drives our app.
2. **Embed** an agent **inside the app** — Vercel AI SDK + generative UI.
3. **Ship** a **self-contained, portable Skill** — Hermes / any harness, zero deps.

It connects Days 01–02: Day 01's static-vs-dynamic context (a Skill *is* dynamic
context); Day 02's framework-free `lib/` ("agent-ready") is reused by Parts 1 & 2.

**Punchline:** same task, three agent architectures — *extend, embed, ship a skill.*

---

## 2. The three parts

| Part | Where the agent lives | How it answers | Reuses | Status |
| --- | --- | --- | --- | --- |
| 1 · Extend | External (Claude Code) + a Skill | runs the skill → app UI updates | `lib/recommend` + app routes | **built** |
| 2 · Embed | Inside the app (AI SDK) | in-app chat → model + tool → streamed generative UI | `lib/recommend` + components | to build |
| 3 · Ship | Any harness, standalone | skill does it all itself → answers in the terminal | nothing (self-contained) | to build |

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

## 4. Part 2 — Embed an agent in the app (GenUI + Vercel AI SDK) — TO BUILD

> Refs: Vercel AI SDK <https://ai-sdk.dev/docs/foundations/overview> ·
> RSC GenUI template <https://vercel.com/templates/next.js/rsc-genui>

**Goal:** the app hosts its **own** agent — no external harness, no file bridge.
A chat lives in the app; you ask in natural language; the model (via the AI SDK)
calls a weather tool and the answer renders as **real React components**
(generative UI). This is the "ask from the app, self-contained" version.

**Stack (decided):** `ai` (core) + `@ai-sdk/react` (`useChat`) + **`@ai-sdk/openai`**
(needs `OPENAI_API_KEY` in the app's server env). RSC `@ai-sdk/rsc` is the alternative
we are NOT using.

**Approach — use AI SDK UI (current Vercel recommendation), not RSC `streamUI`.**
Vercel's own "migrating to UI" guidance moved GenUI from RSC `streamUI`/
`createStreamableUI` (the linked template) to: a route handler streaming tool
*data* + the client rendering components from tool results.

```ts
// app/api/chat/route.ts (sketch)
const result = streamText({
  model: anthropic("claude-…"),       // or openai(...)
  system: "Ти помічник Weather Explorer. Відповідай українською, без окличних знаків.",
  messages,
  tools: { /* see below */ },
});
return result.toUIMessageStreamResponse();
```
```tsx
// client: useChat() → render each tool result as our existing component
{message.parts.map(p => p.type === "tool-recommend" && p.state === "output-available"
  ? <Result rec={p.output} />          // generative UI = our RecommendationPanel/Result
  : null)}
```

**Tool design — DECIDED: (a) model ranks (two tools).** `getWeatherTable({when})`
(fetch, reuse `lib/recommend`) + `showRecommendation({criterion, ranked})` (the model
passes its ranking; `execute` runs `buildRecommendation` for validation and returns the
`Recommendation`; the client renders `<Result>`). Keeps "agent ranks freely" consistent
with Part 1; the model chains the two tool calls.

**Reuse:** `lib/recommend` (`getWeatherTable`, `cities`, `Recommendation`/`RankedCity`
types) and the existing `Result`/`ScorePill`/`CityRow` components AS the generated UI.

**Teaching point:** same task, but the agent is now **native to the app** (SDK-
embedded), streaming UI it generates — contrast with Part 1's external agent.

**Still open:** OpenAI model name (e.g. `gpt-4o` / `gpt-4o-mini`); whether the GenUI
chat replaces or sits beside the existing ask box (lean: a separate assistant panel).

---

## 5. Part 3 — Self-contained, portable Skill (Hermes / any harness) — TO BUILD

**Goal:** a skill that does the **whole job itself with ZERO dependencies** —
fetch Open-Meteo, rank by the user's criterion, answer in the terminal. No app, no
`lib`, no build, no network to localhost. Copy the folder into any harness's skills
dir and it just works. This is the purest "skills are a portable standard" demo.

**Shape:** `holiday-weather/` (name TBD) = `SKILL.md` + one plain-Node `run.mjs`
that **vendors** its own small UA city list + does the Open-Meteo fetch + comfort/
criterion scoring + prints a ranked answer. Self-contained (plain `node` + global
`fetch`).

**Model's job vs script's job:** same thin-model/fat-script lever as Part 1 — the
script fetches + can rank; the model parses NL → criterion and narrates. (Decide:
script ranks deterministically, or script returns data and the model ranks. With
Hermes's small `step-3.7-flash:free`, leaning on the script is safer.)

**Contrast with Part 1's `where-to-go`** (app-coupled via HTTP): Part 3 is
**terminal-only and standalone** — it answers, it does not drive the app.

**Install (Hermes):** copy the folder into `HERMES_HOME/skills/`
(`C:\Users\koldo\AppData\Local\hermes\skills\`); Hermes scans it automatically
(discovery already verified). **Remove** the app-coupled `where-to-go` copy we put
there earlier — Hermes gets the standalone skill instead.

---

## 6. What changed from the prior plan

- **DROPPED — connecting Hermes to the app over HTTP.** It added coupling that
  fought the "portable skill" thesis. The HTTP routes (`/api/data`, `/api/publish`)
  and the `run.mjs` HTTP client **remain** — they power **Part 1** (Claude driving
  the app). Only the *Hermes → app over HTTP* path is gone; Hermes now gets the
  standalone skill (Part 3).
- **DROPPED — MCP (former Stage 3).** Portability is met more simply by the
  self-contained skill (Part 3). MCP stays a possible future "one more client" note.
- **KEPT — everything supporting Part 1:** `lib/recommend/*`, the `/api/*` routes,
  `RecommendationPanel`, history, the watcher.

---

## 7. File manifest

**Built (Part 1):** `lib/recommend/{cities,weatherTable,publish,history,validate,dates,forecasts}.ts`
(+ tests, 30 passing) · `.claude/skills/where-to-go/{SKILL.md,run.mjs}` ·
`app/api/{data,publish,agent-state,ask,history}/route.ts` ·
`components/recommend/{RecommendationPanel,AskBox}.tsx` · `scripts/agent-watch.mjs`.

**To build (Part 2):** `app/api/chat/route.ts` · `components/assistant/*` (chat +
GenUI) · tool(s) reusing `lib/recommend` · deps: `ai`, `@ai-sdk/react`, provider.

**To build (Part 3):** `holiday-weather/{SKILL.md,run.mjs}` (self-contained) →
installed into Hermes skills dir.

---

## 8. Demo running order

1. **Part 1 — extend:** in Claude Code, ask «куди поїхати на вихідні, хочу прохолоди»
   → Claude runs `where-to-go` → the app panel updates. (Optionally show the in-app
   ask box → watcher → `claude -p`.)
2. **Part 2 — embed:** open the app's built-in assistant, ask the same → the model
   streams a generated recommendation card, entirely inside the app (no external agent).
3. **Part 3 — ship:** in Hermes (small free model), ask the same → the standalone
   skill answers in the terminal with zero app dependency. "Same skill folder, any
   harness."

Close: *static context defines who an agent is; these three show where its
*capabilities* can live — bolted on, built in, or shipped as a portable skill.*

---

## Appendix — build log & lessons (condensed)

- **Agent-ranks-freely:** a fixed comfort ranker couldn't answer "I want cool/rainy";
  the agent now ranks for any criterion and narrates exactly what it published.
- **Windows file IO:** temp-file + `rename` atomic writes throw `EPERM` when the 1.5s
  poller holds the file open → reverted to in-place writes; readers catch parse errors.
- **Two adversarial-review workflows** (4-lens, then 2-lens) found 17 confirmed issues
  across the build; all fixed (no-winner rendering, malformed-file calm-degrade via
  `validate.ts`, double-fetch, primitive-body 500, partial-date-coverage notes,
  history-clobber-on-corrupt, input caps, dead-code removal). 30 unit tests green.
- **Q&A UX:** the panel shows the original question + an agent comment + the ranking,
  with a freshness gate (no stale result on load) and an expandable history list.
