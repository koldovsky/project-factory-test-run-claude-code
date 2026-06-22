# G5 — Browser smoke (E2E layer)

> Per ADR-0001 / TC-STACK-05, E2E is verified via browser MCP (no Playwright in
> MVP). This records the Phase-5 cross-cutting smoke against the **real** running
> app (`npm run dev`) with **live Open-Meteo** data. Polished per-capability demo
> recordings follow at G6.

Date: 2026-06-22. Tool: Claude Preview MCP. Build: Next.js 16.2.9.

## States verified

| State | Viewport / theme | Result |
|---|---|---|
| First-load empty state | desktop / dark | Logo + live clock + theme indicator (top bar); hero "Дізнайтеся погоду у будь-якому місті" on a backing scrim; centered "Знайдіть місто" search; "Моє місцезнаходження" button. No forecast/map content. |
| Deep-link location view (`?lat=50.45&lon=30.52&name=Київ`) | desktop / dark | h1 "Київ"; OSM Leaflet map centered on Kyiv with marker; 7 day cards + weekend highlight (8 comfort badges total); "Порівняти вихідні" compare toggle; forecast loaded from live Open-Meteo (no error state). |
| Location view | mobile 375px / light | Single-column layout (FR-SHELL-02); city heading readable over the light day-gradient (NFR-A11Y-02 contrast fix); "© OpenStreetMap contributors" attribution visible (FR-MAP-04); weekend comfort highlight "88 сприятливо" (green); day card "Понеділок 76 сприятливо, 30°C / 19°C, 5%, 14 км/год"; pin + compare buttons. |

## DOM assertions (live page)

`{ h1: "Київ", dayCards(data-band): 8, comfortBadges: 8, hasMap(leaflet): true,
compareToggle: true, forecastError: false }` — the forecast → comfort → weekend
chain and the map all render from live data.

## NFR checks

- **NFR-OBS-01 (silent console):** zero console warnings and zero errors across the
  empty state, the location view (with Leaflet + Recharts + live fetch), and both
  themes/viewports.
- **Theme follows system preference:** dark scheme → "Темна тема" indicator + dark
  palette; light scheme → "Світла тема" indicator + light palette (no manual
  toggle, per Checkpoint 1).
- **Responsive (FR-SHELL-02):** mobile renders a single column; the grid uses
  `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
- **Keyless (NFR-COST-01):** forecast + geocode + tiles all loaded with no API key.

## Automated battery (G5)

`npm run qa:verify` is all-green (traceability, trajectory, 399 tests total
incl. 32 integration, lint, build, OpenSpec 9/9, no active changes). Coverage
baseline committed (`quality/coverage-baseline.json`: lib lines 94.77%,
branches 88.95%).
