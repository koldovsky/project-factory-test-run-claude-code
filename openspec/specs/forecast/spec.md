# Forecast Specification

## Purpose

The forecast capability turns the active location into a readable weather outlook: a 7-day daily forecast, an hourly temperature trend for the next 48 hours, and today's sunrise and sunset. It fetches exclusively from the keyless Open-Meteo forecast API on the server, maps the response into pure domain types in `lib/weather`, and re-fetches whenever the active location changes. All failures surface as calm inline states so the reader is never met with a 500 page or a silent blank.

## Requirements

### Requirement: Fetch the 7-day daily forecast from Open-Meteo on the server

The system SHALL, once a location is active, fetch a 7-day daily forecast from the Open-Meteo forecast API, and the fetch SHALL execute from a Server Component or a Route Handler so that no Open-Meteo URL or key-like parameter is emitted into the client bundle (FR-FORECAST-01, TC-DATA-01, TC-STACK-03).

#### Scenario: Active location triggers a server-side daily fetch

- **GIVEN** a location with latitude, longitude, and name is active
- **WHEN** the forecast view renders
- **THEN** a request to the Open-Meteo forecast endpoint for 7 daily days is issued from a Server Component or Route Handler, and the rendered HTML contains forecast data for that location

#### Scenario: No key-like Open-Meteo parameter is shipped to the client

- **GIVEN** the forecast view has rendered for an active location
- **WHEN** the client JavaScript bundle and the page's client-executed code are inspected
- **THEN** no API key, token, or secret parameter for Open-Meteo appears in client-executed code, and any Open-Meteo host string that does appear carries no key-like parameter and is not presented in a way that suggests a key is required (consistent with the keyless nature of Open-Meteo)

#### Scenario: Open-Meteo is the only weather provider used

- **GIVEN** the forecast view fetches weather data
- **WHEN** the outbound forecast request host is inspected
- **THEN** the host is an Open-Meteo endpoint and no other weather provider is contacted, and the request carries no API key

### Requirement: Render seven day cards with Ukrainian weekday, hi/lo, icon, precipitation, and wind

The system SHALL render exactly 7 day cards when the Open-Meteo response contains 7 well-formed daily entries, each showing the Ukrainian weekday name, the high and low temperature in degrees Celsius, a weather icon derived from the Open-Meteo weather code, the precipitation probability as a percentage, and the wind speed (FR-FORECAST-02). When the response contains fewer than 7 well-formed daily entries but at least one, the system SHALL render one card per available well-formed day (a render-what-you-have case) rather than failing; the empty / no-usable-daily-data case is governed by the "Treat a successful-status but empty or incomplete payload as a calm inline state" requirement.

#### Scenario: Seven cards with all required fields

- **GIVEN** a successful Open-Meteo response containing 7 well-formed daily entries for the active location
- **WHEN** the day cards render
- **THEN** exactly 7 cards are shown, and each card displays a Ukrainian weekday name, a high temperature with a degrees-Celsius unit, a low temperature with a degrees-Celsius unit, a weather icon, a precipitation probability percentage, and a wind speed value

#### Scenario: Fewer than 7 well-formed days renders what is available

- **GIVEN** a successful Open-Meteo response containing at least one but fewer than 7 well-formed daily entries for the active location
- **WHEN** the day cards render
- **THEN** exactly one card is shown per available well-formed daily entry, each card displays all required fields, and no empty placeholder cards are rendered for the missing days and no generic 500 page and no blank area are shown

#### Scenario: Weather icon is derived from the weather code

- **GIVEN** a day whose Open-Meteo daily weather code maps to a known condition
- **WHEN** that day's card renders
- **THEN** the displayed icon corresponds to the condition mapped from the weather code, and the icon has an accessible text alternative naming the condition in Ukrainian

#### Scenario: Weekday names are Ukrainian and ordered from the location's today

- **GIVEN** a successful 7-day daily forecast
- **WHEN** the weekday labels are read top to bottom
- **THEN** the labels are Ukrainian weekday names and the first card corresponds to the active location's local calendar date for today

### Requirement: Render an hourly temperature line chart for the next 48 hours with Recharts

The system SHALL render an hourly temperature line chart covering the next 48 hours using Recharts (FR-FORECAST-03).

#### Scenario: Chart plots 48 hourly temperature points

- **GIVEN** a successful forecast containing hourly temperature data for the active location
- **WHEN** the hourly chart renders
- **THEN** a line chart plots 48 hourly temperature points in chronological order, with the temperature axis in degrees Celsius

#### Scenario: Chart exposes an accessible name

- **GIVEN** the hourly temperature chart has rendered
- **WHEN** the chart region is inspected by assistive technology
- **THEN** the chart region has an accessible name in Ukrainian describing it as the hourly temperature forecast

### Requirement: Show today's sunrise and sunset under the hourly chart

The system SHALL display today's sunrise and sunset times for the active location as small text positioned under the hourly chart, using the active location's local calendar date for "today" (FR-FORECAST-04).

#### Scenario: Sunrise and sunset shown for the location's today

- **GIVEN** a successful forecast that includes today's sunrise and sunset for the active location
- **WHEN** the hourly chart and its caption render
- **THEN** small text under the hourly chart shows today's sunrise time and sunset time for the active location, each labelled in Ukrainian

### Requirement: Re-fetch on location change and cache the last successful response per active location

The system SHALL re-fetch the forecast whenever the active location changes, and SHALL cache the last successful response for the active location and reuse it until the next location switch (FR-FORECAST-05). The cache SHALL be keyed by the active location's coordinates and SHALL be scoped to the request/render that serves the active location, NOT a process-wide in-memory store shared across users or unrelated requests, so that one reader's forecast is never served to a different reader.

#### Scenario: Location change triggers a fresh fetch

- **GIVEN** a forecast is displayed for one active location
- **WHEN** the active location changes to a different latitude/longitude
- **THEN** a new forecast fetch is issued for the new coordinates and the day cards, hourly chart, and sunrise/sunset update to the new location

#### Scenario: Cached response is reused for the unchanged location within a render pass

- **GIVEN** a successful forecast response has been received and cached for the active location, keyed by its coordinates
- **WHEN** the same coordinates are read again within the same request/render pass without a location change
- **THEN** the cached response is reused and no additional Open-Meteo forecast request is issued for those unchanged coordinates

#### Scenario: Cache is not a process-wide store shared across readers

- **GIVEN** the forecast fetch executes server-side for an active location
- **WHEN** the caching mechanism is inspected
- **THEN** the cache is keyed by the active location's coordinates and scoped to the request/render serving that location, and a different reader or a request for different coordinates never receives another reader's cached forecast

### Requirement: Surface forecast fetch failures as a calm inline state

The system SHALL surface any Open-Meteo forecast fetch failure as a calm inline error state within the forecast area, SHALL NOT render a generic 500 page or a silent blank, and SHALL keep the runtime console free of warnings and errors on a healthy session (NFR-OBS-01).

#### Scenario: Network or API failure shows an inline calm error with retry

- **GIVEN** an active location
- **WHEN** the Open-Meteo forecast request fails with a network error or a non-success status
- **THEN** the forecast area shows an inline calm error message in Ukrainian with no exclamation marks, a retry control with an accessible name and a visible focus style is offered, and no generic 500 page and no blank area are shown

#### Scenario: Retry re-issues the fetch

- **GIVEN** an inline forecast error state is shown after a failed fetch
- **WHEN** the user activates the retry control
- **THEN** the forecast is fetched again for the active location, and on success the day cards, hourly chart, and sunrise/sunset render

#### Scenario: Retry that fails again keeps the calm inline error

- **GIVEN** an inline forecast error state is shown after a failed fetch
- **WHEN** the user activates the retry control and the re-issued fetch fails again with a network error or a non-success status
- **THEN** the calm inline error message in Ukrainian and the retry control remain shown within the forecast area, the error state does not degrade to a generic 500 page or a blank area, and the retry control stays activatable for a further attempt

#### Scenario: Healthy session keeps the console silent

- **GIVEN** a successful forecast render for an active location
- **WHEN** the runtime console is observed during and after the render
- **THEN** no warnings and no errors are logged

### Requirement: Treat a successful-status but empty or incomplete payload as a calm inline state

The system SHALL treat an Open-Meteo response that returns a success status (e.g. HTTP 200) but lacks the required forecast fields — including a missing or empty `daily` array, missing or empty hourly temperature data, or null/absent sunrise or sunset — as a forecast failure, surfacing the same calm inline error state with a retry control rather than rendering zero day cards, a blank chart, or absent sunrise/sunset (FR-FORECAST-01, NFR-OBS-01). A success status with a usable payload that is merely partial (at least one well-formed daily entry plus usable hourly temperature) SHALL be rendered as available data and SHALL NOT be treated as this empty/incomplete failure.

#### Scenario: 200 response with no usable daily data shows the calm inline state

- **GIVEN** an active location
- **WHEN** the Open-Meteo request returns a success status but the body has a missing or empty `daily` array
- **THEN** the forecast area shows the calm inline error state in Ukrainian with a retry control, no day cards are rendered, and no generic 500 page and no blank area are shown

#### Scenario: 200 response missing hourly temperature shows the calm inline state

- **GIVEN** an active location
- **WHEN** the Open-Meteo request returns a success status but hourly temperature data is missing or empty
- **THEN** the forecast area shows the calm inline error state in Ukrainian with a retry control instead of a blank hourly chart, and no generic 500 page and no blank area are shown

#### Scenario: 200 response with null sunrise or sunset shows the calm inline state for that block

- **GIVEN** an active location
- **WHEN** the Open-Meteo request returns a success status but today's sunrise or sunset for the active location is null or absent
- **THEN** the sunrise/sunset area shows the calm inline state in Ukrainian instead of empty or absent text, and no generic 500 page and no blank area are shown

### Requirement: Surface invalid coordinates and unparseable responses as a calm inline state

The system SHALL validate the active location's coordinates before issuing a forecast fetch and SHALL surface invalid input as a calm inline error state rather than a thrown error or a generic 500 page. Coordinates whose latitude is outside -90..90, whose longitude is outside -180..180, or that are NaN/non-numeric — including those arriving from a malformed `?lat=&lon=&name=` deep link (FR-SEARCH-03) — SHALL be treated as invalid input. The system SHALL also surface an Open-Meteo response body that cannot be parsed by the mapper (malformed or unparseable) as the same calm inline error state (FR-FORECAST-01, FR-SEARCH-03, NFR-OBS-01).

#### Scenario: Out-of-range or NaN coordinates do not issue a fetch and show the calm inline state

- **GIVEN** an active location whose latitude or longitude is outside valid bounds (latitude not in -90..90, longitude not in -180..180) or is NaN/non-numeric
- **WHEN** the forecast view attempts to render for that location
- **THEN** no Open-Meteo forecast request is issued for the invalid coordinates, the forecast area shows the calm inline error state in Ukrainian with a retry control, and no generic 500 page and no blank area are shown

#### Scenario: Malformed deep link coordinates surface as the calm inline state

- **GIVEN** the page is opened with a malformed `?lat=&lon=&name=` deep link whose `lat` or `lon` is empty, non-numeric, or out of range
- **WHEN** the forecast view resolves the active location from the URL
- **THEN** the malformed coordinates are treated as invalid input, the forecast area shows the calm inline error state in Ukrainian, and no thrown error and no generic 500 page reaches the reader

#### Scenario: Unparseable response body surfaces as the calm inline state

- **GIVEN** an active location with valid coordinates
- **WHEN** the Open-Meteo request returns a body that the mapper cannot parse (malformed or unparseable)
- **THEN** the outcome is routed to the calm inline error state in Ukrainian with a retry control, no exception propagates to the reader, and no generic 500 page and no blank area are shown

### Requirement: Keep Open-Meteo mappers and types pure in lib/weather

The system SHALL place Open-Meteo response-to-domain mappers and forecast types in `lib/weather` as pure modules with no `next/*`, no `react`, and no DOM globals, so they are fully unit-testable (FR-FORECAST-01, FR-FORECAST-02, TC-DATA-01). The mappers SHALL be total over any structurally valid or invalid response shape: for a well-formed and complete response they SHALL return the domain forecast type, and for an empty, incomplete, or malformed/unparseable response they SHALL return a typed failure or empty result WITHOUT throwing, so the caller can route the outcome to the calm inline state.

#### Scenario: Mappers are framework-free and total over a representative response

- **GIVEN** the `lib/weather` modules that map an Open-Meteo forecast response to domain types
- **WHEN** the modules are imported and inspected
- **THEN** they import no `next/*`, no `react`, and reference no DOM globals, and a representative Open-Meteo daily-plus-hourly response maps to the domain forecast type without throwing

#### Scenario: Mappers do not throw on empty, incomplete, or malformed input

- **GIVEN** the `lib/weather` mappers
- **WHEN** they are given a response that is empty, missing the `daily` array, missing hourly temperature, has null sunrise/sunset, or is structurally malformed/unparseable
- **THEN** each mapper returns a typed failure or empty result that the caller can map to the calm inline state, and no mapper throws an exception

### Requirement: Bound forecast scope to the daily set plus 48-hour hourly temperature

The system SHALL request and render only the 7-day daily set (weekday, hi/lo, weather code, precipitation probability, wind, sunrise, sunset) plus the next 48 hours of hourly temperature, and SHALL NOT request marine, aviation, or agriculture variables and SHALL NOT perform historical analysis (FR-FORECAST-01, FR-FORECAST-02, FR-FORECAST-03, FR-FORECAST-04).

#### Scenario: Request is limited to the in-scope variables

- **GIVEN** the forecast fetch for an active location
- **WHEN** the requested Open-Meteo variables are inspected
- **THEN** the request asks only for the daily fields needed by the day cards plus today's sunrise/sunset and the hourly temperature for 48 hours, and it requests no marine, aviation, or agriculture variables and no historical date range
