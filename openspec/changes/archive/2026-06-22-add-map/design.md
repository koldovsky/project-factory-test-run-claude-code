# Design — add-map

## Goals / Non-goals

- **Goals:** OSM Leaflet map bound to the active location; marker + popup; map
  click sets location by coordinates (+ re-fetch); OSM attribution; client-only
  with equal-footprint skeleton; bounds validation.
- **Non-goals:** reverse geocoding (none — ADR-0004 coordinate label), non-OSM
  tiles, vector tiles.

## Key decisions

1. **Client-only via dynamic import (Next 16 gotcha).** `dynamic(() => import('./MapView'),
   { ssr:false })` MUST live inside a `"use client"` wrapper (`MapPanel.tsx`), never
   a Server Component, or the build errors. The wrapper renders an equal-footprint
   skeleton (same width/height) as the `loading` placeholder and SSR output, so no
   layout shift (FR-MAP-05).
2. **Leaflet asset config.** Leaflet's default marker icon URLs break under
   bundlers; set marker icon options explicitly (import the marker images or set
   `L.Icon.Default` paths) so the marker renders. Import `leaflet/dist/leaflet.css`.
3. **Map click → coordinate location (ADR-0004).** On `click`, read `e.latlng`,
   validate bounds via `lib/location` (lat ∈ [-90,90], lon ∈ [-180,180]); if valid,
   navigate to `?lat&lon&name` where name = a rounded-coordinate label
   (`coordinateLabel(lat,lon)`), which re-renders the location view + re-fetches the
   forecast. Invalid → no change.
4. **Marker popup name:** the active location's name (city from search, or the
   coordinate label from a click).
5. **Bounded to the active location** at ~z10; recenters when the active location
   changes (key the map or use a recenter effect).

## Data model

Reuses `ActiveLocation` (`lib/location`). A pure `coordinateLabel(lat, lon): string`
(round to ~4 dp) — placed in `lib/location` (or `lib/map`) and unit-tested.

## Error handling

- Tile load failure → calm inline state in the map region (no 500/blank),
  attribution + footprint preserved.
- Out-of-range/malformed click or deep-link coords → rejected, prior location kept,
  calm inline message.

## Risks & mitigations

- **`ssr:false` from a Server Component → build error:** wrapper is `"use client"`.
- **Marker icon 404 under bundling:** explicit icon config (decision 2).
- **Bundle weight:** Leaflet only in the map chunk (dynamic), not the empty state.
- **Keyboard a11y:** Leaflet zoom controls are keyboard-reachable; map-click is a
  pointer affordance — the keyboard path to set a location is city search (FR-SEARCH),
  an explicit exclusion here.
