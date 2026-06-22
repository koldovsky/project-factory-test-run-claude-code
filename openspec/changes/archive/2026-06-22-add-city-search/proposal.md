# Add city-search

## Why

City search is the primary entry point: a person types a city, picks from
debounced keyless Open-Meteo geocoding suggestions, and the choice becomes the
active location (reflected in the URL for deep links). It also offers the single
opt-in "Use my location" path. (FR-SEARCH-01..06.)

## What Changes

- A `/api/geocode` Route Handler that proxies Open-Meteo geocoding server-side
  (keeps the Open-Meteo URL out of the client bundle, TC-DATA-01; keyless).
- A client `CitySearch` component: debounced (~300 ms) input, suggestion list
  (name, admin1, country, decorative flag emoji), Enter auto-selects a lone
  suggestion, selection sets the active location + URL `?lat&lon&name`, inline
  "Nothing found" and calm error+retry states (no toast/500), and a "Use my
  location" opt-in geolocation button (never on load, silent fallback on denial).
- Pure `lib/geo` mappers (raw Open-Meteo result → domain suggestion; country-code
  → flag emoji), framework-free and unit-tested.
- The component is mounted in the empty-state search slot and the header.

## Impact

- Affected specs: city-search (ADDED).
- Affected code: `app/api/geocode/route.ts`, `lib/geo/*`,
  `components/search/CitySearch.tsx`, empty-state/page wiring, i18n keys.
- Dependencies: add-app-shell (active-location state + empty-state slot).
