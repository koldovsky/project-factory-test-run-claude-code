# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-06-22 (Europe/Kyiv)
- **Current phase:** Phase 4 — per-slice loop (wave 2: forecast implemented)
- **Active change:** add-forecast (implemented to green; pending review + archive).
- **Progress:** G0/G1/G2/G3 PASSED. Slices archived: **add-app-shell** (G4),
  **add-comfort-score**, **add-top-clock**, **add-footer-jokes**, **add-city-search**.
  **add-forecast** implemented to green: pure framework-free `lib/weather`
  (`types.ts`, `mapForecast` total/never-throws, `weatherCodeToCondition` →
  icon-key + UA label, `ukWeekday` arithmetic timezone-invariant, `fetchForecast`
  keyless server-side Open-Meteo + map), request-scoped `getForecast` via React
  `cache()` (not process-wide), and `components/forecast/*` (DayCard, WeatherIcon,
  HourlyChart + HourlyChartLazy `dynamic(ssr:false)`, SunTimes, WeekendHighlight,
  ForecastError, ForecastView). `app/page.tsx` now validates coords → fetch → map
  → render or calm inline error. New i18n keys (`forecastError`, `forecastRetry`,
  `hourlyChartLabel`, `sunriseLabel`, `sunsetLabel`, day-card field labels).
  249 tests green (81 new in `lib/weather`); lint/tsc/build/openspec all pass;
  live Open-Meteo fetch smoke verified (Kyiv → ok:true). Review-slice + archive
  still pending (run by orchestrator).
- **Next task:** Review + archive add-forecast; then wave 3 (add-map,
  add-animated-bg), wave 4 (add-weekend-compare).

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
