# Add animated-bg

## Why

A condition-driven background gives the app a calm sense of the weather: a
day/night gradient plus rain, snow, or drifting clouds chosen from the active
location's current weather code. Day vs night follows the location's sun times,
not the visitor's clock. It is purely decorative — respects reduced motion and
never blocks interaction. (FR-ANIM-01..04.)

## What Changes

- A pure `lib/sky` helper mapping a weather code → `{ gradient, particle }` scene,
  and a day/night decision from the active location's sun times + local now (total,
  never throws; unknown code → gradient-only; missing data → neutral gradient).
- A fixed full-viewport `AnimatedBackground` layer behind all content
  (`pointer-events: none`, non-focusable) that renders the gradient + particle
  layer (CSS/lightweight canvas), and a static gradient under
  `prefers-reduced-motion`.
- Rendered from the page using today's forecast condition + sun times; neutral
  gradient on the empty state or when data is unavailable.

## Impact

- Affected specs: animated-bg (ADDED).
- Affected code: `lib/sky/*` (pure scene mapping + day/night), `components/background/AnimatedBackground.tsx`,
  page-level wiring, `app/globals.css` (gradient/particle CSS + reduced-motion).
- Dependencies: add-app-shell, add-forecast (today's weather code + sun times).
  Independent of the UI light/dark theme.
