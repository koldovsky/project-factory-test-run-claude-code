# G7 — Global review + trajectory evaluation

Two fresh, maker≠checker reviews over the whole codebase, with every finding
adversarially verified. This records the outcomes and resolutions.

## Global review-gate (whole codebase, correctness + security + spec-compliance)

**9 confirmed, 3 contested, 4 rejected.** Resolutions:

### Fixed (code)
1. **CompareView stale "limit reached" notice** — navigating to a new unpinned
   city kept `atLimit`. Fixed: reset on `active` change via the React
   adjust-state-during-render pattern (no effect). Regression: `PinBar.test.tsx`.
2. **Duplicate `coordinateLabel` in CitySearch** (toFixed(2)) vs the canonical
   4dp `lib/location/coordinateLabel`. Fixed: import the shared helper; deleted
   the local copy (map-click and geolocation labels are now identical).
3. **No timeout on server Open-Meteo fetches** — `fetchForecast` and the geocode
   route now use `AbortSignal.timeout(8000)`, caught as a calm typed failure.
4. **Dead i18n keys** `locationLoadingTitle`/`locationLoadingHint` (app-shell
   placeholder, replaced by ForecastView) — removed from `uk.ts` + `en.ts`.
5. **current-state.md** self-contradiction (archive status) + double-counted test
   total — rewritten to the clean final state.

### Accepted / declined (with justification)
6. **No rate limiting on `/api/geocode`, `/api/forecast`** — ACCEPTED for MVP
   (risk R-17): keyless public proxies expose no secret/cost; Open-Meteo enforces
   its own limits; inputs are bounded and time-limited. Edge rate limiting is a
   scale-time follow-up (operations.md).
7. **PostCSS XSS advisory (bundled in Next 16.2.9)** + **esbuild dev-server
   advisory** — dev/transitive only, below `npm audit --audit-level=high`;
   downgrading Next is wrong. Tracked (operations.md, risk R-11).
8. **map.ts fails the whole forecast on null sunrise/sunset** (contested, major) —
   DECLINED: matches the forecast requirement TEXT ("treat ... null/absent sunrise
   or sunset ... as a forecast failure"). Sun times are always present in practice;
   the calm error + retry is the specified behavior.
9. **City-search button-list vs "combobox" in the slice DoD** (contested) —
   DECLINED: a deliberate, documented choice (a combobox without
   aria-activedescendant/arrow-nav advertises semantics it does not drive). The
   button list is fully keyboard-accessible; see the add-city-search review.
10. **weekendComfort prior-Sunday edge** (contested) — DECLINED: twice
    adversarially verified unreachable within the fixed 7-day forecast window.

## Trajectory-eval (9 archived slices, grades the build PATH)

**32/36 judgements pass.** Dimensions: process-order 93.2, in-scope 92.1,
craft 92.1, **test-integrity 80.4**. The 4 failing judgements are all
test-integrity on the UI slices (city-search, map, weekend-compare): their pure
logic is unit-tested, but the browser-only behavioral scenarios are verified via
browser-MCP + the manual test plan (TC-STACK-05, ADR-0005) rather than automated
assertions, and the judge noted some review-fixed UI behaviors lacked regression
tests. Response: added `PinBar.test.tsx` regression guards (WCAG 2.5.3 label,
stale-notice gating, chip accessible name) and `ComfortBadge.test.tsx` earlier;
the residual is the deliberate browser-MCP-not-Playwright strategy (ADR-0005),
which is the documented testing posture for this MVP, not an accidental gap.

## Deterministic release checks (all pass)

```
node scripts/check-traceability.mjs --release --strict-recordings --check-fresh   # 0 failures
node scripts/check-trajectory.mjs   --release --check-fresh                        # 0 failures
npm audit --audit-level=high                                                       # 0 high/critical
npm run qa:verify                                                                  # all green
```
