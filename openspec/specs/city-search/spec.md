# City Search Specification

## Purpose

City Search lets a person find any worldwide city by typing a free-form name and choosing from debounced suggestions backed by the keyless Open-Meteo geocoding API. Selecting a suggestion sets the application's active location and reflects it in the URL so the view is deep-linkable. It also offers a single opt-in "Use my location" path. The capability is the primary entry point that drives the rest of the app (forecast, map, comfort), and it keeps all data calls keyless, all copy calm and Ukrainian-first, and all failures inline rather than as toasts or 500s.

## Requirements

### Requirement: Debounced geocoding suggestions

The system SHALL provide a single free-form text input that fetches city suggestions from the Open-Meteo geocoding API, debouncing user keystrokes by approximately 300 ms before issuing a request, so that suggestions appear as the user types without a request per keystroke (FR-SEARCH-01). The geocoding call SHALL be keyless and SHALL NOT expose any API key to the client bundle (TC-DATA-01, NFR-COST-01).

#### Scenario: Typing a city name shows suggestions after debounce

- **GIVEN** the city search input is empty and focused
- **WHEN** the user types "Kyiv" and pauses for more than 300 ms
- **THEN** exactly one Open-Meteo geocoding request is issued for the final query "Kyiv"
- **AND** a list of suggestions returned by Open-Meteo is rendered below the input

#### Scenario: Rapid typing debounces to a single request

- **GIVEN** the city search input is empty and focused
- **WHEN** the user types five characters within a 300 ms window without pausing
- **THEN** no geocoding request is issued before the user pauses for at least 300 ms
- **AND** when the pause occurs, only one geocoding request is issued, for the latest input value

#### Scenario: No API key is present in client requests

- **GIVEN** the city search input is in use
- **WHEN** a geocoding request is issued and inspected
- **THEN** the request contains no API key parameter, header, or secret
- **AND** no Open-Meteo URL is presented to the client as if a key were required

### Requirement: Suggestion content and accessible flag emoji

The system SHALL render each suggestion showing the city name, its administrative region (admin1), and its country, plus an optional flag emoji derived from the country code when a country code is available (FR-SEARCH-02). The flag emoji SHALL be decorative and SHALL NOT be the sole carrier of the country information, so that the country is conveyed by text regardless of emoji support (NFR-A11Y-01).

#### Scenario: Suggestion shows name, region, and country

- **GIVEN** the geocoding API returns a result with name "Lviv", admin1 "Lviv Oblast", and country "Ukraine"
- **WHEN** the suggestion is rendered
- **THEN** the suggestion text includes "Lviv", "Lviv Oblast", and "Ukraine"

#### Scenario: Flag emoji derived from country code

- **GIVEN** a geocoding result includes country_code "UA"
- **WHEN** the suggestion is rendered
- **THEN** a flag emoji corresponding to country code "UA" is shown alongside the textual country name

#### Scenario: Missing admin region or country code degrades gracefully

- **GIVEN** a geocoding result has no admin1 value and no country_code
- **WHEN** the suggestion is rendered
- **THEN** the suggestion still shows the city name and country as text
- **AND** no empty separator, "undefined", or placeholder flag box is shown

### Requirement: Selecting a suggestion sets active location and updates the URL

The system SHALL, when a suggestion is selected, set the active location to that suggestion's coordinates and name, and reflect the selection in the URL query string as `?lat=&lon=&name=` (FR-SEARCH-03). Loading the app with those query parameters present SHALL set the active location directly from the URL (deep link).

#### Scenario: Selecting a suggestion writes lat, lon, and name to the URL

- **GIVEN** a suggestion list is shown with a suggestion for "Kyiv" at lat 50.45 and lon 30.52
- **WHEN** the user selects the "Kyiv" suggestion
- **THEN** the active location is set to lat 50.45, lon 30.52, name "Kyiv"
- **AND** the URL query string contains `lat=50.45`, `lon=30.52`, and `name=Kyiv` (name URL-encoded)

#### Scenario: Deep link sets active location on load

- **GIVEN** the app is opened with the URL query `?lat=49.84&lon=24.03&name=Lviv`
- **WHEN** the page finishes loading
- **THEN** the active location is set to lat 49.84, lon 24.03, name "Lviv" without requiring any further user action

### Requirement: Enter auto-selects a single suggestion

The system SHALL, when exactly one suggestion is present in the list, auto-select that suggestion if the user presses Enter while the input is focused (FR-SEARCH-04). When the suggestion count is not exactly one, pressing Enter SHALL NOT silently select an arbitrary suggestion.

#### Scenario: Enter selects the only suggestion

- **GIVEN** the suggestion list contains exactly one suggestion, "Odesa"
- **WHEN** the user presses Enter while the input is focused
- **THEN** the "Odesa" suggestion is selected and becomes the active location
- **AND** the URL is updated with that suggestion's lat, lon, and name

#### Scenario: Enter with multiple suggestions does not auto-select

- **GIVEN** the suggestion list contains two or more suggestions and none is highlighted
- **WHEN** the user presses Enter while the input is focused
- **THEN** no suggestion is selected and the active location does not change

#### Scenario: Enter with zero suggestions does nothing

- **GIVEN** the suggestion list is empty
- **WHEN** the user presses Enter while the input is focused
- **THEN** no selection occurs and the active location does not change

### Requirement: Zero results show inline "Nothing found"

The system SHALL, when the geocoding API returns zero results for a non-empty query, show an inline "Nothing found" message in the suggestion area and SHALL NOT show a toast or any transient popup (FR-SEARCH-05). The message copy SHALL be calm, Ukrainian-first, and contain no exclamation marks (BC-BRAND-01).

#### Scenario: Empty result set shows inline message

- **GIVEN** the user has typed a query that the geocoding API resolves to zero results
- **WHEN** the geocoding response is received
- **THEN** an inline "Nothing found" message (Ukrainian-first, no exclamation mark) is rendered in the suggestion area
- **AND** no toast or transient notification is shown

#### Scenario: Inline message clears when input changes

- **GIVEN** the inline "Nothing found" message is displayed
- **WHEN** the user edits the query and a new search yields one or more results
- **THEN** the "Nothing found" message is removed and the suggestions are rendered instead

### Requirement: Network and geocoding failures surface a calm inline error with retry

The system SHALL, when a geocoding request fails due to a network error or a non-success API response, surface a calm inline error message with a retry affordance, and SHALL NOT show a generic 500 page, a toast, or a silent blank (FR-SEARCH-05, TC-DATA-01). The error copy SHALL be Ukrainian-first and contain no exclamation marks (BC-BRAND-01), and the retry control SHALL have an accessible name and visible focus style (NFR-A11Y-01).

#### Scenario: Network failure shows inline error with retry

- **GIVEN** the user has typed a query
- **WHEN** the geocoding request fails (network error or non-2xx response)
- **THEN** an inline, calm error message is shown in the suggestion area with no exclamation mark
- **AND** a "retry" control with an accessible name is shown
- **AND** no generic 500 page, toast, or blank crash is shown

#### Scenario: Retry re-issues the request

- **GIVEN** an inline geocoding error with a retry control is displayed for query "Kyiv"
- **WHEN** the user activates the retry control and the next request succeeds
- **THEN** the error message is removed and the returned suggestions are rendered

### Requirement: Oversized or whitespace-only input is handled without errors

The system SHALL treat an empty or whitespace-only query as "no search" (no request, no error), and SHALL safely bound an oversized query string so it never throws or produces a generic 500 (TC-DATA-01).

#### Scenario: Whitespace-only input issues no request

- **GIVEN** the city search input is focused
- **WHEN** the user types only spaces and pauses past the debounce window
- **THEN** no geocoding request is issued
- **AND** no suggestions, "Nothing found", or error message is shown

#### Scenario: Oversized input does not crash

- **GIVEN** the user pastes a query longer than 200 characters
- **WHEN** the debounce elapses
- **THEN** the input is handled without throwing and without a generic 500
- **AND** the result is either suggestions, an inline "Nothing found", or an inline calm error — never a blank crash

### Requirement: "Use my location" is the only opt-in geolocation path

The system SHALL expose a "Use my location" button as the only path that requests the browser geolocation permission, and SHALL NOT request geolocation on page load or any time other than the user activating that button (FR-SEARCH-06, BC-PRIVACY-02). On permission grant, the system SHALL set the active location to the resolved coordinates and update the URL as in selection. On permission denial or geolocation failure, the system SHALL fall back silently to the search empty state with no toast and no error dialog (FR-SEARCH-06). The button SHALL have an accessible name and a visible focus style (NFR-A11Y-01).

#### Scenario: No geolocation request on page load

- **GIVEN** the app is freshly loaded with no location query parameters
- **WHEN** the page finishes loading and no user interaction has occurred
- **THEN** the browser geolocation permission is never requested

#### Scenario: Button grants and sets active location

- **GIVEN** the empty search state is shown and the user has not yet granted geolocation
- **WHEN** the user activates the "Use my location" button and grants permission
- **THEN** the browser geolocation permission is requested exactly once
- **AND** the active location is set to the resolved coordinates and the URL is updated with lat, lon, and name

#### Scenario: Permission denial falls back silently

- **GIVEN** the user activates the "Use my location" button
- **WHEN** permission is denied or geolocation fails
- **THEN** the app falls back to the search empty state
- **AND** no toast, no error dialog, and no generic 500 is shown

#### Scenario: Button is keyboard accessible

- **GIVEN** the "Use my location" button is rendered
- **WHEN** the user navigates to it with the keyboard
- **THEN** the button exposes an accessible name and shows a visible focus style when focused

### Requirement: Geo response mappers are pure and framework-free

The system SHALL place geocoding and reverse-geocoding response mappers in `lib/geo` as pure, framework-free functions with no `next/*`, no `react`, and no DOM globals, so they are fully unit-testable (TC-DATA-01). Mapping a raw Open-Meteo geocoding result to the domain suggestion shape SHALL be deterministic for a given input.

#### Scenario: Mapper produces deterministic domain shape

- **GIVEN** a raw Open-Meteo geocoding result object with name, admin1, country, country_code, latitude, and longitude
- **WHEN** the `lib/geo` mapper is called with that object
- **THEN** it returns a domain suggestion containing name, admin region, country, country code, lat, and lon
- **AND** calling the mapper again with the same input returns an equal result

#### Scenario: Mapper imports no framework modules

- **GIVEN** the source files under `lib/geo`
- **WHEN** their imports are inspected
- **THEN** they import no `next/*`, no `react`, and reference no DOM globals

### Requirement: City Search exclusions

The system SHALL NOT persist search history and SHALL NOT persist autocomplete suggestions across sessions; the city search retains no record of prior queries beyond the current in-memory interaction (FR-SEARCH-01). This is a deliberate scope exclusion, not a defect.

#### Scenario: No search history is shown

- **GIVEN** the user previously searched and selected a city earlier in the session or a prior session
- **WHEN** the user focuses the empty search input
- **THEN** no list of previously searched cities or recent queries is shown

#### Scenario: No persisted autocomplete across reloads

- **GIVEN** the user performed a search in a previous session
- **WHEN** the user reloads the app and focuses the empty input without typing
- **THEN** no stored or restored autocomplete suggestions appear
