# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-06-22 (Europe/Kyiv)
- **Current phase:** Phase 4 — per-slice loop (wave 2: forecast next)
- **Active change:** add-forecast (scaffolded; building next). add-city-search
  reviewed clean (2 rounds) and archiving.
- **Progress:** G0/G1/G2/G3 PASSED. Slices archived: **add-app-shell** (G4),
  **add-comfort-score** (reviewed clean). **add-top-clock** implemented to green
  (live clock via `useSyncExternalStore`, mount-guard, i18n aria-label).
  **add-footer-jokes** implemented to green: `lib/jokes/jokes.ts`
  (12 curated calm Ukrainian weather jokes, no "!"/Latin/emoji), `lib/jokes/select.ts`
  (pure total `selectJoke` with sign-safe modulo + empty-list fallback, and pure
  local-calendar `dayOfYear`), and `components/shell/Footer.tsx` now server-renders
  `selectJoke(dayOfYear(new Date()))` as a calm plain-text line (no "use client",
  no network, hydration-safe). 125 tests green (34 new in `lib/jokes`);
  lint/tsc/build/openspec all pass. Review-slice + archive still pending.
- **Next task:** Review + archive add-top-clock and add-footer-jokes; then
  wave 2 (add-city-search, add-forecast), wave 3 (add-map, add-animated-bg),
  wave 4 (add-weekend-compare).

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
