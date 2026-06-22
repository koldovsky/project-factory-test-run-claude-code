# Current State

> Persistent handoff file for future agent windows. A quick map, not a
> replacement for source-of-truth artifacts. Always verify with OpenSpec,
> tests, and the repo.

## Last Updated

- **Date and time:** 2026-06-22 (Europe/Kyiv)
- **Current phase:** Post-G7 hardening — automated E2E recordings + UX-defect
  fixes landed (ADR-0006); deploy + push are the user's action.
- **Active change:** none. **All 9 capability slices archived; G0–G6 passed.**
- **Test counts:** `npm run test:run` = 403 tests across 25 files (this total
  INCLUDES the 32 cross-slice integration tests in `tests/integration/`, which
  `npm run test:integration` runs on their own). Do not add the 32 again.
- **G5:** integration tests + coverage baseline + browser-MCP smoke (docs/qa/g5-browser-smoke.md).
- **G6:** QA pack + demo-recordings manifest; eval-suite 8/8 (copy-tone 94.4,
  error-clarity 100), baseline committed + ratchet guards. The eval gate caught +
  fixed a real comfort-rationale bug (a wet day said "pleasant").
- **G7:** global review-gate (whole codebase) + trajectory-eval (9 slices) run;
  confirmed findings fixed (CompareView stale limit-notice, shared coordinateLabel,
  fetch timeouts, dead i18n keys, PinBar regression tests); accepted/declined the
  rest with justification (ADR-0005 gate calibration; rate-limit MVP risk note).
- **Automated recordings (ADR-0006):** headless Playwright harness
  (`e2e/recordings.spec.ts`) drives each flow, asserts its FRs, records video;
  `npm run qa:record-demos` writes 8 validated `*.webm` clips + `manifest.json`;
  `npm run check:recordings` guards them inside `qa:verify`. Replaced the manual
  browser-MCP recordings (TC-STACK-05 amended; no user browser, no manual save).
- **UX-defect audit (maker≠checker):** 7 obvious-behavior defects found + fixed
  (BUG-001..007, `docs/qa/ux-defects.md`). Headline: the forecast view had no
  search and the logo was not a home link — fixed; the harness now asserts
  search/home reachability so it cannot regress.
- `qa:verify` all-green (incl. `recordings`); 403 unit + 32 integration tests;
  8/8 clips validated; release checks (`--release --strict-recordings`,
  `npm audit --audit-level=high`) pass.
- **Slices archived (G4):** add-app-shell, add-comfort-score, add-top-clock,
  add-footer-jokes, add-city-search, add-forecast, add-map, add-animated-bg,
  add-weekend-compare.
- **Next task:** Deploy to Vercel (user's account) + push to a Git remote (user's
  approval), then live-smoke the production URL and measure NFR-PERF/A11Y
  (Lighthouse). The repo is a release candidate.

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
