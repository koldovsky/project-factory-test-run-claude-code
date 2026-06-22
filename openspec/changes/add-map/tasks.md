# Tasks — add-map

> Client-only Leaflet map. Pure logic is the coordinate label + bounds (lib);
> rendering, tiles, attribution, click→re-fetch, and skeleton are browser
> behaviors verified at G6. dynamic(ssr:false) ONLY inside a "use client" wrapper.

## 1. Contracts
- [ ] 1.1 `coordinateLabel(lat, lon): string` (rounded ~4 dp) in `lib/location`
        (or `lib/map`); reuse `lib/location` bounds validation.

## 2. Failing tests first (red)
- [ ] 2.1 `lib/location/coordinateLabel.test.ts` (or lib/map): deterministic
        rounded "lat, lon" label; handles negatives, zero, sub-1e-6; matches what
        a map click would store. `@trace FR-MAP-03`.
- [ ] 2.2 Run `npm run test:run` — confirm RED.

## 3. Implementation (green)
- [ ] 3.1 `coordinateLabel` pure helper (no next/react/DOM).
- [ ] 3.2 `components/map/MapView.tsx` (`"use client"`, react-leaflet): MapContainer
        bound to active location (~z10), OSM TileLayer with attribution, Marker +
        Popup naming the location, click handler → validate bounds → navigate to
        `?lat&lon&name` (name = coordinateLabel) → forecast re-fetch. Import
        leaflet CSS; configure marker icon assets.
- [ ] 3.3 `components/map/MapPanel.tsx` (`"use client"`): `dynamic(() => import('./MapView'),
        { ssr:false })` with an equal-footprint skeleton `loading`.
- [ ] 3.4 Render `MapPanel` in the location view (`app/page.tsx`); add i18n keys
        (map region label, attribution text, tile-error/calm states).

## 4. Validation, docs, archive prep
- [ ] 4.1 `npm run test:run` (green)
- [ ] 4.2 `npm run lint`
- [ ] 4.3 `npx tsc --noEmit`
- [ ] 4.4 `npm run build`
- [ ] 4.5 `npx openspec validate add-map --strict` + `--all --strict`
- [ ] 4.6 Run review-slice; fix confirmed findings; re-run 4.1–4.5.
- [ ] 4.7 Update `docs/current-state.md`.
- [ ] 4.8 Archive after 4.1–4.7: `npx openspec archive add-map --yes`.
