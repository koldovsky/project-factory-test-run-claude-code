# Tasks — add-forecast

> No DB. Server-side keyless Open-Meteo fetch (TC-DATA-01). Pure total mappers in
> lib/weather are the unit-test core; rendering/lazy-chart/console-silent are
> verified in the browser at G6. Use exact field names from
> docs/open-meteo-reference.md.

## 1. Contracts
- [x] 1.1 `lib/weather/types.ts` — `DailyForecast`, `Forecast`, map result union.

## 2. Failing tests first (red)
- [x] 2.1 `lib/weather/map.test.ts`: `mapForecast` on a well-formed daily+hourly
        fixture → `{ ok:true, forecast }` with correct fields; partial (≥1 day +
        hourly) → ok with available days. `@trace FR-FORECAST-01, FR-FORECAST-02`.
- [x] 2.2 `lib/weather/map.test.ts` (failures): empty/missing `daily`, missing
        hourly temps, null sunrise/sunset, malformed/unparseable → `{ ok:false }`,
        NEVER throws. `@trace FR-FORECAST-01, NFR-OBS-01`.
- [x] 2.3 `lib/weather/code.test.ts`: `weatherCodeToCondition` maps representative
        WMO codes to an icon key + Ukrainian condition name. `@trace FR-FORECAST-02`.
- [x] 2.4 `lib/weather/weekday.test.ts`: `ukWeekday(localDateStr)` returns the
        Ukrainian weekday from the LOCAL date string (timezone-invariant, never
        UTC slice). `@trace FR-FORECAST-02`.
- [x] 2.5 Eval case `evals/cases/forecast.eval.ts`: forecast-error copy + condition
        names — calm Ukrainian, no "!"/emoji. `@trace FR-FORECAST-01, BC-BRAND-01`.
- [x] 2.6 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [x] 3.1 `lib/weather/*` — pure types + `mapForecast` (total), `weatherCodeToCondition`,
        `ukWeekday`. No next/react/DOM.
- [x] 3.2 Forecast fetch helper: `fetchForecast(lat,lon)` server-side, wrapped in
        React `cache()` (request-scoped, coord-keyed; not process-wide); builds the
        Open-Meteo URL with the in-scope variables only; validates coords first.
- [x] 3.3 `components/forecast/DayCard.tsx` (server) — weekday, hi/lo °C,
        weather-code icon w/ UA alt, precip %, wind, `ComfortBadge`.
- [x] 3.4 `components/forecast/HourlyChart.tsx` (`"use client"`, Recharts) +
        `HourlyChartLazy.tsx` (`"use client"` wrapper using
        `dynamic(() => import('./HourlyChart'), { ssr:false })`); UA accessible name.
- [x] 3.5 `components/forecast/SunTimes.tsx`, `ForecastError.tsx` (calm inline +
        retry), and the weekend comfort highlight (uses `weekendComfort`).
- [x] 3.6 Wire the location view in `app/page.tsx`: validate coords → fetch → map →
        render weekend highlight + day cards + lazy chart + sun times, or the calm
        inline error. Add i18n keys.

## 4. Validation, docs, archive prep
- [x] 4.1 `npm run test:run` (green)
- [x] 4.2 `npm run lint`
- [x] 4.3 `npx tsc --noEmit`
- [x] 4.4 `npm run build`
- [x] 4.5 `npx openspec validate add-forecast --strict` + `--all --strict`
- [x] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
        (2 confirmed fixed: nullable optional fields; invalid-coord spec reconciled.)
- [x] 4.7 Update `docs/current-state.md`.
- [x] 4.8 Real fetch smoke: `fetchForecast` for a known city returns a mapped
        forecast (exercise the real Open-Meteo path once).
- [x] 4.9 Archive after 4.1–4.8: `npx openspec archive add-forecast --yes`.
