# Tasks — add-top-clock

> Pure helper + a thin client component. Smoke = unit tests + a real browser
> render (live tick, silent console) verified at G6.

## 1. Contracts
- [x] 1.1 `formatClock(date, { locale, timeZone }): string` signature in `lib/clock/format.ts`.

## 2. Failing tests first (red)
- [x] 2.1 `lib/clock/format.test.ts`: deterministic format for a fixed instant +
        fixed locale + fixed timeZone (assert exact string); different timeZone
        yields a different time; calm fallback (no throw) for an invalid
        locale/timeZone. `@trace FR-CLOCK-01`.
- [x] 2.2 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [x] 3.1 `lib/clock/format.ts` — pure `formatClock` via `Intl.DateTimeFormat`,
        try/catch fallback; no next/react/DOM imports.
- [x] 3.2 `components/clock/Clock.tsx` — `"use client"`; 1s interval → state;
        cleanup clears interval; mount-guard placeholder (no hydration mismatch);
        `tabular-nums` (no layout shift); `aria-label={t("clockRegionLabel")}`.
- [x] 3.3 Mount `<Clock />` into the TopBar clock slot (AppShell passes it, or
        layout provides it) so the slot now renders the live clock.

## 4. Validation, docs, archive prep
- [x] 4.1 `npm run test:run` (green)
- [x] 4.2 `npm run lint`
- [x] 4.3 `npx tsc --noEmit`
- [x] 4.4 `npm run build`
- [x] 4.5 `npx openspec validate add-top-clock --strict` + `--all --strict`
- [ ] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
- [x] 4.7 Update `docs/current-state.md`.
- [ ] 4.8 Archive after 4.1–4.7: `npx openspec archive add-top-clock --yes`.
