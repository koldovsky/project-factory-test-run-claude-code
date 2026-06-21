# Map Specification

## Purpose

The map capability renders an interactive, OSM-tiled Leaflet map (via react-leaflet) bound to the active location at roughly city zoom, with a marker and city popup. Clicking the map picks a new active location by reverse-geocoding the clicked point through Open-Meteo, which drives a forecast re-fetch. The map renders client-only with an equal-footprint SSR skeleton to avoid layout shift, shows the required OpenStreetMap attribution, and degrades calmly when reverse-geocoding fails so the user never sees a 500 or a silent blank.

## Requirements

### Requirement: Interactive OSM-tiled map bound to the active location

The system SHALL render an interactive Leaflet map (via react-leaflet) using OpenStreetMap raster tiles, initially centered on the active location at roughly city-level zoom (approximately z=10) (FR-MAP-01, TC-STACK-04). Tile requests SHALL use HTTPS and present a valid Referer, and the implementation SHALL NOT scrape or bulk-download tiles, per the OSM Tile Usage Policy (TC-MAP-01).

#### Scenario: Map centers on the active location at city zoom

- **GIVEN** an active location with latitude and longitude is set
- **WHEN** the map finishes loading
- **THEN** the map is centered on the active location's coordinates
- **AND** the initial zoom level is approximately 10 (city level)
- **AND** OpenStreetMap raster tiles are displayed

#### Scenario: Tile requests follow the OSM Tile Usage Policy

- **GIVEN** the map is loading OSM raster tiles
- **WHEN** the browser issues tile requests
- **THEN** every tile URL uses the HTTPS scheme
- **AND** the requests carry a Referer header identifying the application
- **AND** no batch or pre-fetch routine downloads tiles outside the visible viewport

#### Scenario: User can pan and zoom

- **GIVEN** the map is loaded
- **WHEN** the user drags the map or uses the zoom controls
- **THEN** the visible area pans or zooms accordingly
- **AND** the zoom controls are reachable by keyboard and expose accessible names

#### Scenario: OSM tiles fail to load

- **GIVEN** the map is mounted within its fixed-footprint container
- **WHEN** one or more tile requests fail (tile server unreachable, network error, or blocked tiles)
- **THEN** the map region shows a calm inline state indicating the map could not load, with no exclamation marks
- **AND** no generic 500 page and no silent grey or blank map region is shown
- **AND** the OpenStreetMap attribution and the map's fixed footprint are preserved so no layout shift occurs

### Requirement: Marker with city popup at the active location

The system SHALL place a marker at the active location's coordinates, and the marker's popup SHALL name the city of the active location (FR-MAP-02). When the active location has no resolved city name, the popup SHALL display a calm fallback label rather than an empty popup or raw coordinates only. The marker SHALL expose an accessible name, and the popup SHALL be reachable and dismissable by keyboard (NFR-A11Y-01).

#### Scenario: Marker popup names the city

- **GIVEN** an active location whose resolved city name is "Київ"
- **WHEN** the user opens the marker's popup
- **THEN** the popup text includes "Київ"

#### Scenario: Marker moves when the active location changes

- **GIVEN** the marker is shown at the previous active location
- **WHEN** the active location changes to new coordinates
- **THEN** the marker is repositioned to the new coordinates
- **AND** the popup reflects the new location's city name

#### Scenario: Popup fallback when no city name is available

- **GIVEN** an active location with coordinates but no resolved city name
- **WHEN** the user opens the marker's popup
- **THEN** the popup shows a calm fallback label (for example the coordinates) with no exclamation marks
- **AND** the popup is not empty

#### Scenario: Marker and popup are keyboard-accessible

- **GIVEN** the map is loaded with a marker at the active location
- **WHEN** the user navigates with the keyboard
- **THEN** the marker is reachable by keyboard and exposes an accessible name
- **AND** the user can open the marker's popup and dismiss it using the keyboard

### Requirement: Map click sets the active location and re-fetches the forecast

The system SHALL, when the user clicks a point on the map, reverse-geocode the clicked coordinates via the keyless Open-Meteo API to determine the new active location, set that as the active location, and trigger a forecast re-fetch for the new location (FR-MAP-03, TC-STACK-03). Reverse-geocoding SHALL use no API key. Map-click is a pointer-only affordance for setting the active location; the keyboard-accessible path for setting the active location is the city search capability (FR-SEARCH), which is owned outside this capability and is an explicit exclusion here (NFR-A11Y-01). Before issuing a reverse-geocode request, the system SHALL validate that the candidate coordinates are well-formed and within valid bounds (latitude in [-90, 90], longitude in [-180, 180]); out-of-range or malformed coordinates — whether produced by a click or supplied via a deep link — SHALL be rejected without changing the active location.

#### Scenario: Clicking the map updates the active location and forecast

- **GIVEN** the map is loaded with an active location
- **WHEN** the user clicks a different point on the map and reverse-geocoding succeeds
- **THEN** the active location is updated to the clicked point's resolved location
- **AND** the marker moves to the clicked point with a popup naming the resolved city
- **AND** a forecast re-fetch is triggered for the new active location

#### Scenario: Reverse-geocode call is keyless

- **GIVEN** the user clicks a point on the map
- **WHEN** the reverse-geocode request to Open-Meteo is issued
- **THEN** the request includes no API key or secret
- **AND** Open-Meteo is the only geocoding provider used

#### Scenario: Reverse-geocode failure keeps the prior location and surfaces an inline message

- **GIVEN** the map has an active location and a forecast already displayed
- **WHEN** the user clicks a point and the reverse-geocode request fails (network or API error)
- **THEN** the active location remains the prior location
- **AND** an inline, calm message is shown explaining the click could not be resolved, with no exclamation marks
- **AND** no generic 500 page and no silent blank is shown
- **AND** a retry affordance is available

#### Scenario: Click over open water or an unresolvable point

- **GIVEN** the user clicks a point for which reverse-geocoding returns zero results
- **WHEN** the response is processed
- **THEN** the active location remains the prior location
- **AND** an inline, calm message indicates no place was found for that point, with no exclamation marks
- **AND** no error toast is shown

#### Scenario: Out-of-range or malformed coordinates are rejected

- **GIVEN** candidate coordinates outside valid bounds (latitude outside [-90, 90] or longitude outside [-180, 180]) or otherwise malformed, whether derived from a click or supplied via a deep link
- **WHEN** the system prepares to set the active location from those coordinates
- **THEN** the coordinates are rejected before any reverse-geocode request is issued
- **AND** the active location remains the prior valid location
- **AND** an inline, calm message indicates the point was out of range, with no exclamation marks
- **AND** no generic 500 page and no silent blank is shown

#### Scenario: Keyboard path for setting the active location is delegated to city search

- **GIVEN** a keyboard-only user who needs to change the active location
- **WHEN** the user wants to set a new location without a pointer click on the map
- **THEN** map-click is not required, because setting the active location by keyboard is provided by the city search capability (FR-SEARCH), which is owned outside this capability
- **AND** the map's own interactive controls (zoom controls and marker popup) remain keyboard-reachable per NFR-A11Y-01

### Requirement: OpenStreetMap attribution

The system SHALL display the attribution text "© OpenStreetMap contributors" at the bottom-right of the map at all times, as required by the OSM Tile Usage Policy (FR-MAP-04, TC-MAP-01).

#### Scenario: Attribution is visible bottom-right

- **GIVEN** the map is loaded
- **WHEN** the map is displayed
- **THEN** the text "© OpenStreetMap contributors" is visible in the bottom-right corner of the map

#### Scenario: Attribution remains visible after interaction

- **GIVEN** the map is loaded with attribution visible
- **WHEN** the user pans or zooms the map, or the active location changes
- **THEN** the "© OpenStreetMap contributors" attribution remains visible in the bottom-right corner

### Requirement: Client-only rendering with equal-footprint SSR skeleton

The system SHALL load the map as a client-only component via `dynamic({ ssr: false })`, and during server-side rendering and before the client map mounts SHALL render a skeleton placeholder with the same footprint (width and height) as the map so no layout shift occurs when the map mounts (FR-MAP-05).

#### Scenario: SSR renders a skeleton, not the Leaflet map

- **GIVEN** the page is server-side rendered
- **WHEN** the server-rendered HTML for the map region is produced
- **THEN** a skeleton placeholder is rendered in place of the interactive map
- **AND** no Leaflet map instance is rendered on the server

#### Scenario: No layout shift when the client map mounts

- **GIVEN** the skeleton placeholder is shown before hydration
- **WHEN** the client-only map mounts and replaces the skeleton
- **THEN** the map occupies the same width and height as the skeleton
- **AND** surrounding content does not move (no cumulative layout shift from the map region)

### Requirement: Map provider exclusions

The system SHALL use OpenStreetMap raster tiles only and SHALL NOT use vector tiles or any other map provider such as Mapbox or Google (TC-STACK-04). This is an explicit scope exclusion, not a defect.

#### Scenario: Only OSM raster tiles are requested

- **GIVEN** the map is loaded and the user pans or zooms
- **WHEN** tile requests are inspected
- **THEN** all tile requests target OpenStreetMap raster tile endpoints
- **AND** no requests are made to Mapbox, Google, or any vector-tile endpoint
