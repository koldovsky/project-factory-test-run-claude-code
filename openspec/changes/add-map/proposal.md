# Add map

## Why

An interactive OSM map lets people set the active location by clicking, and shows
where the current location is. It is bounded to the active location with a marker
and popup, credits OpenStreetMap, and is client-only with an equal-footprint SSR
skeleton. (FR-MAP-01..05.)

## What Changes

- A client-only Leaflet map (`react-leaflet`) loaded via
  `dynamic(() => import(...), { ssr:false })` from a `"use client"` wrapper (the
  Next 16 gotcha), with an equal-footprint skeleton placeholder.
- Bound to the active location (~z10) with a marker + popup naming it; OSM raster
  tiles + "© OpenStreetMap contributors" attribution bottom-right (TC-MAP-01).
- Clicking the map sets the active location to the clicked coordinates and labels
  it with a rounded-coordinate string (no reverse geocoding — ADR-0004), then
  navigates to `?lat&lon&name` which re-fetches the forecast.
- Out-of-range/malformed clicks rejected without changing the location.

## Impact

- Affected specs: map (ADDED).
- Affected code: `components/map/*` (MapView client + dynamic wrapper + skeleton),
  a small `lib/map`/reuse of `lib/location` for the coordinate label + bounds,
  location-view wiring in `app/page.tsx`, Leaflet CSS + marker-icon asset config,
  i18n keys.
- Dependencies: add-app-shell (location state), add-forecast (the click re-fetch
  drives the forecast). Leaflet/react-leaflet kept out of the initial bundle via
  dynamic import (NFR-PERF-03).
