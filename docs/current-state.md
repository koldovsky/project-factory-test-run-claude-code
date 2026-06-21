# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-06-21 (Europe/Kyiv)
- **Current phase:** Phase 4 — per-slice loop (wave 0)
- **Active change:** add-app-shell (implemented, review fixes applied, archiving next);
  add-comfort-score (scaffolded: spec delta + proposal/design/tasks, not yet implemented)
- **Progress:** G0/G1/G2/G3 PASSED. `add-app-shell` implemented (all unit tests green,
  lint/tsc/build clean, ~167KB homepage JS); reviewed (scoped review-slice),
  confirmed findings fixed (empty-clock a11y/i18n, exponential coord round-trip,
  deep-link h1, toLocationQuery name trim, CI flag). Re-reviewing for clean
  evidence, then archive.
- **Next task:** Re-run review-gate scoped to add-app-shell (persist
  review-findings.json), archive it, then implement add-comfort-score
  (test-first), then waves 1–4.

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
- OpenSpec CLI is `@fission-ai/openspec` v1.4.1 (invoke via `npx openspec ...`).
  Classic layout works: specs at `openspec/specs/<cap>/spec.md` with
  `## Requirements` / `### Requirement:` / `#### Scenario:` (GIVEN/WHEN/THEN).
  Validate one spec: `npx openspec validate <cap> --type spec --strict`.
- **Next 16.2 gotcha (FR-MAP-05):** `dynamic(..., { ssr: false })` ONLY works
  inside a Client Component. Load the Leaflet map via `dynamic()` from a
  `"use client"` wrapper, never from a Server Component, or the build errors.
- Project subagent types (requirements-analyst, spec-writer, etc.) are NOT in
  the runtime Agent registry this session — dispatch via `general-purpose`
  with the agent's instructions inlined, or via custom Workflow scripts under
  `.pf/workflows/`.
- OS/shell: Windows 11; PowerShell + Git Bash. Use forward slashes in scripts.
- Do not archive OpenSpec changes before implementation and smoke test.
