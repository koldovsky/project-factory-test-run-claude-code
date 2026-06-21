# ADR-0004: Map clicks set location by coordinates (no reverse geocoding)

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** orchestrator + user (Checkpoint 2)

## Context

FR-MAP-03 states map clicks update the active location "reverse-geocoded via
Open-Meteo". Verified against the Open-Meteo docs (see
`docs/open-meteo-reference.md`): **Open-Meteo provides forward geocoding only —
there is no reverse-geocoding endpoint.** The literal requirement is therefore
impossible without introducing a second provider. TC-STACK-03 favors Open-Meteo
only and NFR-COST-01 requires keyless/free.

## Decision

On a map click, set the active location to the **clicked coordinates** (lat/lon)
and re-fetch the forecast (which works fully from coordinates). Label the point
by **rounded coordinates** (e.g. `50.45, 30.52`) in the marker popup and the URL
`name` param, since no place name is obtainable from Open-Meteo for an arbitrary
point. No reverse-geocoding provider is added. The forecast, comfort score, map,
and animated background all function from lat/lon; only the human-readable city
name is unavailable for arbitrary clicked points (named cities still come from
the forward geocoding search, FR-SEARCH-01/02).

FR-MAP-03's wording is amended in `docs/requirements.md` and the `map` baseline
spec to reflect this.

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| Coordinate label (chosen) | 100% keyless; no new provider; simplest; matches privacy ethos | Clicked points show coordinates, not a city name |
| OSM Nominatim reverse geocoding | Real city names; keyless; OSM-consistent | New provider; ~1 req/s rate limit + attribution; stretches TC-STACK-03 |
| Nearest-city heuristic via forward geocoding | Open-Meteo only | Unreliable; no "search by coordinates" exists; complex |

## Consequences

- **Easier:** no second integration, no extra rate-limit/attribution handling.
- **We accept:** map-click locations display coordinates instead of a city name; the popup uses a calm coordinate label.
- **Follow-ups:** the `add-map` slice implements the coordinate-label behavior; the baseline `map` spec is corrected as part of the slice's change (OpenSpec Option B) or up front here.
