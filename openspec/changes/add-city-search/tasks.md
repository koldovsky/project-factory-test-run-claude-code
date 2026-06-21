# Tasks — add-city-search

> No DB. The route handler proxies keyless Open-Meteo geocoding server-side
> (TC-DATA-01). Smoke = unit tests on lib/geo + a real browser search verified
> at G6. Debounce/keyboard/geolocation are browser behaviors verified at G6.

## 1. Contracts
- [x] 1.1 `GeoSuggestion` type + `toSuggestion`, `flagEmoji`, `parseGeocodeResponse`
        signatures in `lib/geo`.

## 2. Failing tests first (red)
- [x] 2.1 `lib/geo/map.test.ts`: `toSuggestion` deterministic domain shape from a
        raw Open-Meteo result; missing admin1/country_code degrade (no "undefined",
        no empty separator). `@trace FR-SEARCH-02`.
- [x] 2.2 `lib/geo/flag.test.ts`: `flagEmoji("UA")` → 🇺🇦; missing/invalid code → ""
        (decorative, country still shown as text). `@trace FR-SEARCH-02, NFR-A11Y-01`.
- [x] 2.3 `lib/geo/parse.test.ts`: `parseGeocodeResponse` maps a results array;
        omitted/empty `results` → [] (zero results, no throw). `@trace FR-SEARCH-01, FR-SEARCH-05`.
- [x] 2.4 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [x] 3.1 `lib/geo/*` — pure mappers per the contract (no next/react/DOM).
- [x] 3.2 `app/api/geocode/route.ts` — GET handler: trim/bound `q` (empty → empty;
        cap ~200); call Open-Meteo geocoding (keyless, `language=uk`); return
        `{ suggestions }` via `parseGeocodeResponse`; non-2xx upstream → calm error
        status, never throw raw.
- [x] 3.3 `components/search/CitySearch.tsx` — `"use client"`: debounced (~300 ms)
        calls to `/api/geocode` with stale-response guard; accessible
        combobox/listbox + visible focus; Enter auto-selects a lone suggestion;
        selection → `?lat&lon&name`; inline "Nothing found" + calm error/retry;
        "Use my location" opt-in geolocation (never on load, silent fallback).
- [x] 3.4 Mount `CitySearch` in the empty-state search slot (and header search if
        applicable); add i18n keys (placeholder, nothing-found, error, retry,
        use-my-location, locating).

## 4. Validation, docs, archive prep
- [x] 4.1 `npm run test:run` (green)
- [x] 4.2 `npm run lint`
- [x] 4.3 `npx tsc --noEmit`
- [x] 4.4 `npm run build`
- [x] 4.5 `npx openspec validate add-city-search --strict` + `--all --strict`
- [ ] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
- [ ] 4.7 Update `docs/current-state.md`.
- [ ] 4.8 Archive after 4.1–4.7: `npx openspec archive add-city-search --yes`.
