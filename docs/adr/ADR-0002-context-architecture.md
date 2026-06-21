# ADR-0002: Context architecture — static vs dynamic boundary

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** orchestrator + user

## Context

Agent context has direct TCO impact: static context (`AGENTS.md` via `CLAUDE.md`)
is paid for on every turn; dynamic context is loaded only when a task needs it.
This project has several cohesive domains (search, forecast, map, comfort-score,
animated-bg, jokes, i18n) whose detail must not all sit in the static layer.

## Decision

We will keep a **lean static layer** (`AGENTS.md`, budget ≤ 4k tokens) holding
only durable cross-cutting rules: stack lock, module conventions (framework-free
`lib/`), correctness rules, validation cadence, test-first, handoff protocol.
Per-domain detail (Open-Meteo response shapes, comfort formula, joke data, i18n
strings) is **dynamic** — discovered from `lib/<domain>/` + the domain's OpenSpec
spec. The split and budget are documented in `docs/context-architecture.md`.

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| Lean static + dynamic domains (chosen) | Low per-turn cost; detail near the code | Requires discipline to demote growth |
| One big AGENTS.md with all domain detail | Everything in one place | Pays full domain cost on every unrelated turn |

## Consequences

- **Easier:** cheap unrelated turns; domain rules live beside the code that uses them.
- **We accept:** when `AGENTS.md` exceeds 4k tokens we must demote, not raise the budget.
- **Follow-ups:** review static-layer size at each gate; record any boundary
  change as a new ADR.
