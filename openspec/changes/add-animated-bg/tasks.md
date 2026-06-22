# Tasks — add-animated-bg

> Pure `lib/sky` scene mapping is the unit-test core; rendering, reduced-motion,
> pointer-pass-through, and perf are browser behaviors verified at G6. The scene
> is condition-driven and theme-independent.

## 1. Contracts
- [x] 1.1 `lib/sky` types + `sceneForWeatherCode`, `isDaytime`, `skyScene` signatures.

## 2. Failing tests first (red)
- [x] 2.1 `lib/sky/scene.test.ts`: `sceneForWeatherCode` — rain code → particle
        'rain'; snow → 'snow'; cloud → 'cloud'; clear → 'none'; unknown code →
        neutral gradient + 'none' (no throw). `@trace FR-ANIM-01`.
- [x] 2.2 `lib/sky/daynight.test.ts`: `isDaytime` true between sunrise/sunset,
        false outside; follows the LOCAL now + sun-time strings, not the visitor
        clock; missing sun times → default day (no throw). `@trace FR-ANIM-02`.
- [x] 2.3 `lib/sky/scene.test.ts`: `skyScene` missing/invalid inputs → neutral
        static gradient, never throws. `@trace FR-ANIM-01, FR-ANIM-02`.
- [x] 2.4 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [x] 3.1 `lib/sky/*` — pure total helpers (no next/react/DOM).
- [x] 3.2 `components/background/AnimatedBackground.tsx` — fixed inset-0 -z-10
        layer, `pointer-events:none`, aria-hidden, no focusable children; gradient
        class + particle layer (CSS/lightweight canvas); reduced-motion → static
        gradient only (CSS media query).
- [x] 3.3 `app/globals.css` — gradient + particle CSS, `prefers-reduced-motion`
        guard freezing/hiding particles.
- [x] 3.4 Render `AnimatedBackground` from `app/page.tsx` using today's weather
        code + sun times from the (cached) forecast + location-local now; neutral
        gradient on empty state / missing data. Add any i18n (none expected —
        decoration is aria-hidden).

## 4. Validation, docs, archive prep
- [x] 4.1 `npm run test:run` (green)
- [x] 4.2 `npm run lint`
- [x] 4.3 `npx tsc --noEmit`
- [x] 4.4 `npm run build`
- [x] 4.5 `npx openspec validate add-animated-bg --strict` + `--all --strict`
- [ ] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
- [ ] 4.7 Update `docs/current-state.md`.
- [ ] 4.8 Archive after 4.1–4.7: `npx openspec archive add-animated-bg --yes`.
