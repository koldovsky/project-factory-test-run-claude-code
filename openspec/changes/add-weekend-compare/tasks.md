# Tasks — add-weekend-compare

> Client-only feature. Pure logic (weekendDays, pin-limit) is the unit-test core;
> chip row, toggle, sticky table, make-active, per-column retry are browser
> behaviors verified at G6. Per-city forecast via a keyless /api/forecast route.

## 1. Contracts
- [ ] 1.1 `weekendDays(days): { saturday: DailyForecast|null; sunday: DailyForecast|null }`
        in `lib/weather`; a pure pin-limit helper (max 3) if not inlined.

## 2. Failing tests first (red)
- [ ] 2.1 `lib/weather/weekendDays.test.ts`: returns the upcoming Sat/Sun from the
        LOCAL date strings; one-day-only; none-in-window → both null; never throws;
        timezone-invariant. `@trace FR-COMPARE-02`.
- [ ] 2.2 `lib/compare/pins.test.ts` (or inline): add/remove pins; max 3 enforced
        (4th rejected, atLimit flagged); unpin frees a slot; no duplicate pins.
        `@trace FR-COMPARE-01`.
- [ ] 2.3 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [ ] 3.1 `lib/weather/weekendDays.ts` (pure) + `lib/compare/pins.ts` (pure pin reducer).
- [ ] 3.2 `app/api/forecast/route.ts` — GET `?lat&lon` → `fetchForecast` → mapped
        `Forecast` JSON, keyless; invalid coords/upstream → calm non-2xx, never throws.
- [ ] 3.3 `components/compare/PinBar.tsx` (`"use client"`): pin the active city,
        chip row above the forecast, unpin per chip, 3-limit calm inline message,
        keyboard + visible focus + accessible names.
- [ ] 3.4 `components/compare/CompareTable.tsx` (`"use client"`): one column per
        pinned city (fetches `/api/forecast`), Sat/Sun rows (hi/lo, precip %,
        comfort score via `comfortScore` + `weekendDays`), sticky `<th>` header +
        "make active" button; per-column loading/error+retry; empty state.
- [ ] 3.5 `components/compare/CompareView.tsx` (`"use client"`): holds pin state +
        "Compare weekend" toggle; renders PinBar + (table | standard view).
- [ ] 3.6 Wire `CompareView` above the forecast in the location view (`app/page.tsx`);
        add i18n keys (pin, unpin, limit, compare toggle, make-active, empty,
        column error/retry, Sat/Sun row labels).

## 4. Validation, docs, archive prep
- [ ] 4.1 `npm run test:run` (green)
- [ ] 4.2 `npm run lint`
- [ ] 4.3 `npx tsc --noEmit`
- [ ] 4.4 `npm run build`
- [ ] 4.5 `npx openspec validate add-weekend-compare --strict` + `--all --strict`
- [ ] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
- [ ] 4.7 Update `docs/current-state.md`.
- [ ] 4.8 Archive after 4.1–4.7: `npx openspec archive add-weekend-compare --yes`.
