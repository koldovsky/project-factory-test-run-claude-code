# Delivery report — Weather Explorer / Weekend Trip Planner

- **Date:** 2026-06-22 (Europe/Kyiv)
- **Status:** MVP complete and reviewed. Gates G0–G6 passed; G7 (deploy +
  Lighthouse measurement) in progress.
- **Audience:** stakeholders and the next engineer. Companion documents:
  [acceptance report](./qa/mvp-acceptance-report.md),
  [traceability matrix](./qa/requirements-traceability-matrix.md),
  [technical docs](./technical/architecture.md),
  [estimation](./estimation.md).

## Executive summary

Weather Explorer is a keyless, privacy-first, Ukrainian-first web app that helps
an anonymous visitor decide whether — and where — a weekend trip is worth taking,
based on the weather. All **9 capabilities** and all **33 MVP functional
requirements** are implemented, reviewed, and archived. The app has no database,
no accounts, no cookies, no trackers, and no paid API keys: it runs entirely on
the free, keyless Open-Meteo and OpenStreetMap services and needs zero
environment variables.

Quality was assured test-first, with a separate reviewer for every slice
(maker≠checker), a cross-cutting browser smoke against live data, and a graded
eval suite that caught a real correctness bug before release. The automated test
suite is **431 tests, all green**, and the eval suite passes **8/8**. The only
remaining work is deploy-dependent: a Vercel deployment and four
performance/accessibility measurements that can only be taken on a live URL.

## What was delivered

The single actor is an anonymous visitor; there are no roles or sign-in. The
end-to-end loop: land on a calm empty state, search a city (or click the map),
read a 7-day forecast with per-day comfort scores and the upcoming weekend
highlighted, see the place on a map, feel a condition-driven animated background,
and compare up to three cities side by side.

| # | Capability | MVP FRs | Highlights |
|---|---|---|---|
| 1 | App shell | FR-SHELL-01..03 | Responsive 1/2/3-column layout; first-load hero + centered search; system-preference theme indicator |
| 2 | Comfort score | FR-COMFORT-01..05 | Pure 0–100 score + calm Ukrainian rationale; colored badges; weekend (Sat+Sun) highlight |
| 3 | City search | FR-SEARCH-01..06 | Debounced keyless geocoding; flag/region/country rows; opt-in "Use my location" |
| 4 | Forecast | FR-FORECAST-01..05 | 7 day cards; 48h hourly chart; sunrise/sunset; in-memory re-fetch on location change |
| 5 | Top clock | FR-CLOCK-01 | Live, hydration-safe, accessible header clock |
| 6 | Footer jokes | FR-JOKES-01 | Deterministic Ukrainian weather jokes, no external API |
| 7 | Map | FR-MAP-01..05 | Client-only OSM Leaflet map; marker + popup; click-to-set-location; attribution |
| 8 | Animated background | FR-ANIM-01..04 | Day/night gradient + rain/snow/cloud particles by the location's sun times; reduced-motion safe |
| 9 | Weekend compare | FR-COMPARE-01..03 | Pin up to 3 cities; Sat/Sun comparison table with sticky headers + make-active |

Full requirement-to-evidence mapping:
[traceability matrix](./qa/requirements-traceability-matrix.md). Every MVP FR is
owned by exactly one slice with no gaps or duplicates.

## How quality was assured

- **Test-first, per slice.** Each slice wrote its unit tests from the spec first
  (confirmed red), then implemented to green. Result: **399 unit + 32 integration
  tests, all green**, across 24 files
  ([automated verification](./qa/automated-verification-latest.md)). Coverage
  baseline: lib lines 94.77%, branches 88.95%.
- **Maker ≠ checker.** The agent that built a slice never reviewed it. The git
  history shows a `fix(...): … (review)` commit on almost every slice — real code
  changes from review (combobox/listbox accessibility, AA-contrast backings,
  calm error copy, spec reconciliation). See [estimation](./estimation.md).
- **An eval gate that caught a real bug.** The graded eval suite checks quality a
  unit test cannot — copy tone, error clarity, comfort-rationale accuracy. It
  failed `eval-comfort-rationale-wet`: the comfort rationale read as a pleasant
  day at 95% precipitation, ignoring the rain. The fix
  (`lib/scoring/comfort.ts`, commit `7afb504`) makes a single notably-adverse
  driver always surface. The suite now passes **8/8** (copy-tone 94.4,
  error-clarity 100; [eval report](./qa/eval-report.md)) and the baseline is
  committed so CI guards against regression.
- **Browser smoke against live data.** Per TC-STACK-05 (no Playwright in MVP),
  E2E is verified via browser MCP against the running app with live Open-Meteo
  data: empty state, deep-link location view, both themes, mobile + desktop, with
  a **silent console** throughout ([browser smoke](./qa/g5-browser-smoke.md)).

## Gates passed

| Gate | Meaning | Status |
|---|---|---|
| G0–G3 | Setup, requirements, specs, planning | Passed |
| G4 (×9) | Per-slice review + archive | Passed — all 9 slices archived, trajectory clean |
| G5 | Cross-cutting battery + live browser smoke | Passed — `qa:verify` green, smoke recorded |
| G6 | Eval suite + demo recordings | Passed — eval 8/8, baseline committed, recordings manifest in place |
| G7 | Deploy + Lighthouse + global review | **In progress** — Vercel deploy + 4 deploy-dependent measurements outstanding |

> Note on QA-pack snapshots: the
> [acceptance report](./qa/mvp-acceptance-report.md) and
> [traceability matrix](./qa/requirements-traceability-matrix.md) were authored
> against the pre-fix eval snapshot (7/8, wet case failing) and have not been
> regenerated since the fix. The current, authoritative state — confirmed by the
> code, the [eval report](./qa/eval-report.md), and
> [automated verification](./qa/automated-verification-latest.md) — is **8/8 with
> the baseline committed**.

## Keyless & privacy posture

- **Keyless, free** (NFR-COST-01): Open-Meteo (forecast + geocoding) and OSM
  tiles need no API key; the app runs with zero environment variables.
- **No persistence:** no database, no accounts, no server-side state. The active
  location lives only in the URL (`?lat&lon&name`), which makes views shareable.
- **No tracking:** no analytics, no third-party trackers, no fingerprinting, no
  application-set cookies (BC-PRIVACY-01/03). Geolocation only on the explicit
  "Use my location" button, never on load (BC-PRIVACY-02).
- **Honest under failure:** every external call degrades to a calm inline state
  with retry — never a 500 or a blank — and the runtime console stays silent on a
  healthy session (NFR-OBS-01).
- **Ukrainian-first, calm:** UI strings are centralised and Ukrainian-first with
  no exclamation marks (NFR-I18N-01, BC-BRAND-01); the footer credits Open-Meteo
  and OpenStreetMap (BC-BRAND-02).

## Open items

1. **Deploy + measurement (G7).** Deploy to Vercel, then measure on the live URL
   and record against the NFR rows: homepage p95 TTFB ≤ 300 ms (NFR-PERF-01),
   Lighthouse Performance ≥ 90 (NFR-PERF-02), initial JS ≤ 200 KB gzipped
   (NFR-PERF-03), Lighthouse Accessibility ≥ 95 (NFR-A11Y-01). Code-level
   mitigations are in place and reviewed (heavy libs deferred via
   `dynamic({ ssr:false })`, bounded particle count, focus styles, accessible
   names, AA-contrast tokens), but a score is not a score until it is measured.
   Steps in [operations](./technical/operations.md).
2. **`npm audit` (G7).** Three advisories remain, all in the dev/build toolchain
   (postcss via Next, esbuild via Vitest), not the shipped keyless runtime; the
   only "fix" downgrades Next to v9, a breaking change that violates TC-STACK-01,
   so it is not applied. Detail and rationale in
   [operations](./technical/operations.md) and risk R-11.

## Limitations stated plainly

- **Map clicks show coordinates, not city names** (FR-MAP-03, amended by
  [ADR-0004](./adr/ADR-0004-map-click-coordinate-label.md)): Open-Meteo has no
  reverse-geocoding endpoint, so clicked points use a calm rounded-coordinate
  label. Forecast, comfort, map, and background all work from lat/lon; named
  cities still come from forward search. This was an accepted product decision at
  Checkpoint 2.
- **The four deploy-dependent NFRs are not asserted as passing** here — they are
  measured at G7 on the live URL.

## Optional future scope (not in MVP)

From the PRD's explicit out-of-scope list, none built: push notifications /
scheduled refresh; user accounts, history, or server-side favorites; marine /
aviation / agriculture variables; localisation beyond Ukrainian + English labels;
a native mobile app; climate or historical analysis beyond the 7-day forecast.
Server-side favorites would require a new ADR re-introducing storage; pinned
cities are client-only today.

## Effort

This was an automated multi-agent build under Project Factory; the
[estimation](./estimation.md) reconstructs the delivery from git timestamps
(48 commits, 2026-06-21 23:04 → 2026-06-22 05:40, ~6.5 hours wall-clock). The
rough human-equivalent for the same scope is on the order of **13–17
engineer-days** (a scoping aid, not measured time).
