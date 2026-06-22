# ADR-0005: Traceability gate uses `--strict-recordings`, not `--strict-tests`

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** orchestrator + user (via the approved TC-STACK-05 testing strategy)

## Context

The Factory's release-gate offers `check-traceability --strict-tests` (every MVP
FR must have a `@trace`'d automated test) and `--strict-recordings` (every MVP FR
must be in a recording manifest). `--strict-tests` fits the default stack's
Playwright E2E, where UI behaviors get `@trace`'d automated tests. This project
deliberately uses **browser-MCP E2E, not Playwright** (TC-STACK-05), so UI/CSS/
browser-API FRs are verified by browser-MCP recordings + the manual test plan,
not by `@trace`'d automated tests. Pure-logic FRs (search/forecast/comfort/sky/
compare helpers, URL contract, route handlers) DO have `@trace`'d unit/integration
tests.

About a dozen FRs are inherently browser-only: shell structure/responsive layout
(FR-SHELL-01/02), Enter-to-select and geolocation (FR-SEARCH-04/06), chart/sun
render (FR-FORECAST-04), the Leaflet map (FR-MAP-01/02/04/05), reduced-motion and
pointer-events (FR-ANIM-03/04), and the sticky compare header/make-active
(FR-COMPARE-03). These have no honest unit `@trace`.

## Decision

The release traceability gate runs:

```
node scripts/check-traceability.mjs --release --strict-recordings --check-fresh
```

`--strict-recordings` is enforced (every FR is in `docs/qa/demo-recordings/manifest.json`).
`--strict-tests` is NOT used as a release blocker, because browser-only UI FRs are
verified via browser-MCP recordings + the manual test plan (TC-STACK-05), not
`@trace`'d automated tests. Pure-logic and data/URL/route FRs still carry
`@trace` unit/integration tests (and FR-SEARCH-03, FR-FORECAST-03/05 were traced
to the URL/integration tests that pin their contracts). The CI workflow already
uses `--release` (not `--strict-tests`), matching this decision.

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| `--strict-recordings`, not `--strict-tests` (chosen) | Matches the project's browser-MCP E2E strategy; every FR still has evidence (test OR recording) | Browser-only FRs aren't guarded by a fast automated test |
| Add Playwright to `@trace` UI FRs | `--strict-tests` would pass | Violates TC-STACK-05 (no Playwright in MVP); adds a heavy dep |
| Write trivial @trace'd unit tests asserting nothing real | Silences the warning | Dishonest — ratifies coverage that doesn't exist |

## Consequences

- **Honest:** every MVP FR has evidence — a `@trace`'d test (logic/data/URL/route)
  or a recording-manifest clip + manual test (browser-only UI).
- **We accept:** browser-only UI FRs rely on browser-MCP verification, re-run via
  `docs/qa/demo-script.md`; `check-traceability` still reports them as `test-trace`
  warnings (informational, not release blockers).
