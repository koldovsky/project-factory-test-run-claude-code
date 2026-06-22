# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-06-22 (Europe/Kyiv)
- **Current phase:** Phase 6 COMPLETE (G6) → Phase 7 (global review + release)
- **Active change:** none. All 9 slices archived; G0–G6 passed.
- **G5:** 32 integration tests; coverage baseline; browser-MCP smoke (docs/qa/g5-browser-smoke.md).
- **G6:** QA pack (6 docs) + demo-recordings manifest; eval-suite 8/8 (copy-tone
  94.4, error-clarity 100), baseline committed + ratchet guards. The eval gate
  caught + fixed a real comfort-rationale bug (wet day said "pleasant").
  399 unit + 32 integration tests; qa:verify all-green.
- **Progress:** G0/G1/G2/G3 PASSED. Slices archived: **add-app-shell** (G4),
  **add-comfort-score**, **add-top-clock**, **add-footer-jokes**, **add-city-search**,
  **add-forecast**, **add-map**, **add-animated-bg**.
  **add-weekend-compare** implemented to green: pure framework-free
  `lib/weather/weekendDays.ts` (upcoming Sat/Sun by each city's LOCAL date,
  arithmetic/timezone-invariant, returns the SAME day-object refs, total/never
  throws) and `lib/compare/pins.ts` (pure pin reducer: `MAX_PINS = 3`, add/remove/
  isPinned by lat/lon identity, `atLimit` on full-list rejection, always a fresh
  array, total/never throws). Keyless `app/api/forecast/route.ts` (GET `?lat&lon`
  → `fetchForecast` → mapped `Forecast` JSON; invalid coords → 400, upstream/
  network → 502 calm body, never throws). Client components
  `components/compare/{PinBar,CompareTable,CompareView}.tsx` (chip row + 3-limit
  calm message, "Compare weekend" toggle, one sticky-header column per pinned
  city with make-active, per-column loading/error+retry via reloadKey effect — no
  synchronous setState in effect — and the calm empty state). `CompareView` wired
  above the forecast in `app/page.tsx`. New i18n keys (compare* group) in uk + en.
  365 tests green (31 new: 16 pins, 15 weekendDays); lint/tsc/build/openspec all
  pass.
- **Next task:** Review + archive add-weekend-compare (orchestrator runs
  review-slice then `npx openspec archive add-weekend-compare --yes`).

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
