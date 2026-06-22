# Design — add-animated-bg

## Goals / Non-goals

- **Goals:** condition→scene mapping (pure); day/night from location sun times;
  reduced-motion static fallback; never blocks pointer/focus; calm neutral
  fallback when data missing.
- **Non-goals:** WebGL, audio, any user control to toggle/pause; coupling to the
  UI light/dark theme.

## Key decisions

1. **Pure `lib/sky` helpers (TC-PURE-01):**
   - `sceneForWeatherCode(code): { gradientKey; particle: 'rain'|'snow'|'cloud'|'none' }`
     — total; unknown code → `{ gradientKey:'neutral', particle:'none' }`.
   - `isDaytime(nowLocal, sunrise, sunset): boolean` — uses the active location's
     local "now" and sun-time strings; missing sun times → default day. Never uses
     the visitor clock or `toISOString().slice`.
   - Combine into `skyScene({ weatherCode?, sunrise?, sunset?, nowLocal? }): { gradient; particle }`.
2. **`AnimatedBackground` component:** a `position:fixed inset-0 -z-10` layer with
   `pointer-events:none` and `aria-hidden`/no focusable children (FR-ANIM-04). The
   gradient is a CSS class; particles are CSS-animated elements (or a lightweight
   canvas) gated so `@media (prefers-reduced-motion: reduce)` hides/);freezes them,
   leaving only the static gradient (FR-ANIM-03).
3. **Data source:** rendered from `app/page.tsx` using today's `weather_code`
   (daily[0]) + today's sunrise/sunset from the already-fetched (request-cached)
   forecast, plus the location-local "now". On the empty state or when the forecast
   is unavailable, render the neutral static gradient (FR-ANIM fail-calm). This
   reuses the forecast fetch (no extra request).
4. **Theme independence:** the scene is condition-driven; it does not read the UI
   light/dark theme.

## Data model

Pure: scene types as above; `skyScene(input): { gradient: string; particle: 'rain'|'snow'|'cloud'|'none' }`.

## Error handling

Totally defensive: any missing/invalid input → neutral static gradient, no error,
no throw, no 500 (FR-ANIM fail-calm). Console stays silent.

## Risks & mitigations

- **Perf (NFR-PERF-02):** bound particle count; CSS animations (GPU-friendly) or a
  small canvas; no heavy loops.
- **Reduced motion:** the static fallback is enforced in CSS media query, not just
  JS, so it holds even before hydration.
- **Local-now correctness:** derive "now" for the location from its timezone
  (from the forecast `timezone`/utc_offset), never the visitor clock.
- **Pointer/focus:** `pointer-events:none` + no interactive/focusable nodes.
