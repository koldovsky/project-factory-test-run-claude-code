# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-06-21 (Europe/Kyiv)
- **Current phase:** Phase 0 — bootstrap (loop installed; scaffolding Next.js)
- **Active change:** none
- **Progress:** Project Factory loop installed (agents, workflows, check-*
  scripts, git hooks, CI, OpenSpec init, ADR-0001/0002, AGENTS.md). Next.js app
  not yet scaffolded.
- **Next task:** Scaffold Next.js 16.2 app, wire package.json scripts, verify
  git hooks fire (Gate G0).

## Source Of Truth

1. `AGENTS.md` — project agent rules.
2. `docs/current-state.md` — this handoff.
3. `docs/requirements.md` — canonical FR/NFR/TC/BC requirements.
4. `docs/product-brief.md` — product narrative.
5. `docs/mvp-capability-plan.md` — change sequence and scope.
6. `openspec/project.md` + `openspec/specs/` — accepted behavior.
7. `docs/adr/` — architecture decisions.
8. `docs/qa/` — QA proof pack and recordings.

## OpenSpec Status

```bash
npx openspec validate --all --strict   # expected: all pass
npx openspec list                      # expected: No active changes (between slices)
```

Archived changes: none yet.

## Validation Commands

```bash
npm run lint
npm run test:run
npm run build
npx openspec validate --all --strict
```

## Environment / Deployment

- No database, no auth, no email, no secrets. App runs with zero env vars.
- Open-Meteo (keyless) is the only data provider. Hosting: Vercel.

## Agent Rules / Gotchas

- `lib/` must stay framework-free (TC-PURE-01).
- OpenSpec CLI is `@fission-ai/openspec` (invoke via `npx openspec ...`).
- OS/shell: Windows 11; PowerShell + Git Bash. Use forward slashes in scripts.
- Do not archive OpenSpec changes before implementation and smoke test.
