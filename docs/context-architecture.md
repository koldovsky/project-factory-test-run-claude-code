# Context Architecture — Weather Explorer / Weekend Trip Planner

> A **versioned, cost-bearing** decision. Static context is paid for on **every**
> agent turn; dynamic context is loaded only when a task needs it. Keep the
> static layer lean on purpose.

## Static layer — loaded every interaction (keep small)

The minimum the agent must know on every turn. Budget: **≤ 4k tokens.**

- `CLAUDE.md` → `@AGENTS.md` (durable cross-cutting rules only: stack lock,
  module conventions, correctness rules, validation cadence, test-first, the
  handoff protocol). NOT per-domain detail.
- The active handoff pointer (`docs/current-state.md` is read at session start,
  not embedded).

When `AGENTS.md` grows past the budget, that is a signal to **move detail out**
to the dynamic layer (a skill or a domain doc), not to raise the budget silently.

## Dynamic layer — loaded on demand (progressive disclosure)

| Loaded when… | Source |
|---|---|
| working in a domain | `lib/<domain>/` code + that domain's spec under `openspec/specs/<domain>/` |
| a reusable procedure applies | a `SKILL.md` skill (vendored under `.agents/skills/`, listed in `skills-lock.json`) — notably `vercel-react-best-practices` |
| using a framework API | the installed package's bundled docs (`node_modules/next/dist/docs/`) — never memory |
| doing QA / release | the QA pack under `docs/qa/`, the trajectory/traceability reports |
| resuming work | `docs/current-state.md` (read, not embedded) |

## Rules

1. **Default to dynamic.** A rule goes in the static layer only if it's needed on
   *most* turns and can't be discovered from the code/spec in front of the agent.
2. **Progressive disclosure.** Prefer a one-line pointer in static context to an
   on-demand skill/doc over inlining the detail.
3. **Budget is enforced, not aspirational.** Review the static layer on a cadence;
   when it exceeds budget, demote content to a skill.
4. **Versioned.** Any change to this boundary is recorded as an ADR in `docs/adr/`.

## Current decision

- **Static budget:** 4k tokens. **Today:** `AGENTS.md` ≈ 1.4k tokens (within budget).
- **Recently demoted to dynamic:** Open-Meteo response shapes → `lib/weather/`
  + the `forecast` spec; comfort-score formula → `lib/scoring/` + the
  `comfort-score` spec.
- **Owning ADR:** ADR-0002 (context architecture).
