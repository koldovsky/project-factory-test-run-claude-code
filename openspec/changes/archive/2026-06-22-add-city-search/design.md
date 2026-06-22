# Design — add-city-search

## Goals / Non-goals

- **Goals:** debounced keyless geocoding suggestions; selection → active location
  + URL; Enter-on-single; inline "Nothing found"; calm error + retry; opt-in
  geolocation; pure `lib/geo` mappers.
- **Non-goals:** search history / persisted autocomplete; reverse geocoding (the
  map slice labels by coordinates, ADR-0004); a key (Open-Meteo is keyless).

## Key decisions

1. **Geocoding via a Route Handler (`app/api/geocode/route.ts`).** The client
   calls `/api/geocode?q=...`; the handler calls Open-Meteo geocoding server-side
   and returns the mapped suggestions. This honors TC-DATA-01 (the Open-Meteo URL
   never ships in the client bundle) while keeping the debounced search-as-you-type
   UX client-side. Keyless. The handler validates/bounds `q` (trim; empty → empty;
   cap length ~200) and returns a typed `{ suggestions }` or a calm error status.
2. **`CitySearch` is a client component** (`"use client"`): debounce (~300 ms,
   trailing) with stale-response guards (ignore out-of-order responses), a
   listbox/combobox with accessible roles + visible focus, Enter auto-selects when
   exactly one suggestion, selection navigates to `?lat&lon&name` (router.push or
   replace) which sets the active location.
3. **`lib/geo` pure mappers:** `toSuggestion(raw)` (deterministic domain shape),
   `flagEmoji(countryCode)` (regional-indicator letters; returns "" for missing /
   invalid code so the flag is purely decorative and country text always shows),
   and `parseGeocodeResponse(json)` (tolerant: missing `results` → []). No
   next/react/DOM.
4. **"Use my location":** on button click only, call `navigator.geolocation`
   (client). On success → set active location (name = a calm coordinate label,
   since Open-Meteo has no reverse geocoding, ADR-0004) + URL. On denial/error →
   silent fallback to the empty state (no toast). Never called on load.
5. **States:** idle / loading / suggestions / nothing-found / error(+retry), all
   inline in the suggestion area, Ukrainian-first, no exclamation marks.

## Data model (pure)

`GeoSuggestion { name; admin1?; country; countryCode?; lat; lon }`;
`toSuggestion(raw): GeoSuggestion`; `flagEmoji(cc?): string`;
`parseGeocodeResponse(json): GeoSuggestion[]`.

## Error handling

- `/api/geocode`: invalid/oversized `q` → bounded; upstream failure → non-2xx with
  a small JSON body; never throws raw.
- Client: network/non-2xx → inline calm error + retry; zero results → inline
  "Nothing found"; whitespace-only → no request.

## Risks & mitigations

- **Debounce races:** track the latest query id; drop stale responses.
- **Accessibility:** combobox/listbox semantics, arrow-key navigation optional but
  Enter-on-single required; visible focus on input, options, retry, and the
  geolocation button.
- **No key leak:** the only Open-Meteo geocoding URL lives in the route handler
  (server), verified by the spec's no-key scenarios.
