# App Shell Specification

## ADDED Requirements

### Requirement: Single-page shell structure

The system SHALL render a single-page application whose shell consists of a top
bar containing the logo and a theme indicator, a main content area, and a footer,
with a slot in the top bar reserved for the live clock (FR-SHELL-01). The top bar
SHALL be the only navigation chrome: no auth controls and no navigation menu
beyond the shell exist in the MVP.

#### Scenario: Top bar shows logo and theme indicator

- **GIVEN** the application is loaded at the root route
- **WHEN** the page finishes rendering
- **THEN** the top bar contains the product logo and a theme indicator element
- **AND** the top bar contains a slot/region where the clock is mounted

#### Scenario: Main area and footer are present

- **GIVEN** the application is loaded
- **WHEN** the page finishes rendering
- **THEN** exactly one main content region (`<main>`) is present between the top
  bar and the footer
- **AND** a footer region (`<footer>`) is rendered below the main content

#### Scenario: No navigation menu, auth, or theme toggle in the shell

- **GIVEN** the application is loaded
- **WHEN** a tester inspects the top bar and footer
- **THEN** there is no sign-in/sign-up control, no navigation menu beyond the
  shell, and no manual theme-toggle control

### Requirement: Theme follows system preference with an indicator

The system SHALL set the light/dark theme from the operating-system color-scheme
preference and SHALL display a theme indicator reflecting the active theme
(FR-SHELL-01). The MVP SHALL NOT provide a manual theme-toggle control
(Checkpoint 1 decision). The shell color palette SHALL meet WCAG AA contrast in
both light and dark themes (NFR-A11Y-02).

#### Scenario: Theme matches the system light preference

- **GIVEN** the operating system color-scheme preference is set to light
- **WHEN** the application is loaded
- **THEN** the shell renders in the light theme
- **AND** the theme indicator reflects the light theme

#### Scenario: Theme matches the system dark preference

- **GIVEN** the operating system color-scheme preference is set to dark
- **WHEN** the application is loaded
- **THEN** the shell renders in the dark theme
- **AND** the theme indicator reflects the dark theme

#### Scenario: Theme indicator has an accessible name

- **GIVEN** the application is loaded in either theme
- **WHEN** a screen-reader user reaches the theme indicator
- **THEN** the indicator exposes an accessible name describing the active theme,
  sourced from `lib/i18n/uk.ts`

#### Scenario: Shell text meets AA contrast in both themes

- **GIVEN** the shell is rendered in the light theme and again in the dark theme
- **WHEN** the contrast ratio of top-bar and footer text against its background
  is measured in each theme
- **THEN** every measured ratio meets WCAG AA (at least 4.5:1 for normal text,
  3:1 for large text)

### Requirement: Footer credits Open-Meteo and OpenStreetMap

The system SHALL render a footer that credits Open-Meteo and OpenStreetMap, each
as a working hyperlink to its respective site (FR-SHELL-01, BC-BRAND-02). The
footer links SHALL have visible focus styles and accessible names (NFR-A11Y-01).

#### Scenario: Both data providers are credited with links

- **GIVEN** the application is loaded
- **WHEN** a tester inspects the footer
- **THEN** the footer contains a hyperlink whose text/accessible name credits
  Open-Meteo and whose `href` points to the Open-Meteo site
- **AND** the footer contains a hyperlink whose text/accessible name credits
  OpenStreetMap and whose `href` points to the OpenStreetMap site

#### Scenario: Footer links are keyboard accessible with visible focus

- **GIVEN** the application is loaded
- **WHEN** a keyboard user tabs to each footer link
- **THEN** each focused link shows a visible focus indicator
- **AND** each link has an accessible name drawn from `lib/i18n/uk.ts`

### Requirement: Responsive layout across breakpoints

The system SHALL adapt the layout at 768 px and 1280 px breakpoints: a single
column below 768 px, two columns from 768 px to 1279 px, and three columns at
1280 px and wider (FR-SHELL-02). The shell SHALL remain usable at each
breakpoint with no horizontal scrolling of the page body.

#### Scenario: Mobile uses a single column

- **GIVEN** the viewport width is below 768 px (for example 375 px)
- **WHEN** the application is loaded
- **THEN** the main content is laid out in a single column
- **AND** the page body does not scroll horizontally

#### Scenario: Tablet uses two columns

- **GIVEN** the viewport width is between 768 px and 1279 px inclusive (for
  example 1024 px)
- **WHEN** the application is loaded
- **THEN** the main content is laid out in two columns

#### Scenario: Desktop uses three columns

- **GIVEN** the viewport width is 1280 px or wider (for example 1440 px)
- **WHEN** the application is loaded
- **THEN** the main content is laid out in three columns

#### Scenario: Breakpoint boundaries are exact

- **GIVEN** the viewport width is exactly 768 px and then exactly 1280 px
- **WHEN** the application is loaded at each width
- **THEN** at 768 px the layout uses two columns (not one)
- **AND** at 1280 px the layout uses three columns (not two)

### Requirement: First-load empty state with centered search

The system SHALL, when no `lat`, `lon`, or `name` query parameters are present on
first load, render an empty state consisting of hero copy plus a prominently
centered city search, and SHALL NOT render forecast, map, or other
location-dependent content (FR-SHELL-03). The hero copy and search labels SHALL
come from `lib/i18n/uk.ts` and follow the calm, practical, no-exclamation-mark
tone (NFR-I18N-01, BC-BRAND-01).

#### Scenario: First load with no location shows hero and centered search

- **GIVEN** the URL has no `lat`, `lon`, or `name` query parameters
- **WHEN** the application is loaded
- **THEN** hero copy is displayed
- **AND** a city search input is displayed centered as the primary call to action
- **AND** no forecast, hourly chart, or map content is rendered

#### Scenario: Empty-state copy is Ukrainian-first and calm

- **GIVEN** the empty state is displayed
- **WHEN** a tester reads the hero copy and search label
- **THEN** the visible strings are the Ukrainian values from `lib/i18n/uk.ts`
- **AND** none of those strings contain an exclamation mark

#### Scenario: Empty-state search input is focusable with visible focus and accessible name

- **GIVEN** the empty state is displayed
- **WHEN** a keyboard user tabs to the city search input
- **THEN** the input shows a visible focus indicator
- **AND** the input has an accessible name drawn from `lib/i18n/uk.ts`

### Requirement: Deep-link loads location and skips the hero

The system SHALL, when `lat`, `lon`, and `name` query parameters are present on
load, treat that as the active location and render the location view directly,
skipping the first-load hero/empty state (FR-SHELL-03). If the location
parameters are invalid or incomplete, the system SHALL fall back to the
first-load empty state with an inline, calm message rather than a generic error
page or a blank screen.

#### Scenario: Valid deep link loads the location directly

- **GIVEN** the URL contains valid `lat`, `lon`, and `name` parameters
- **WHEN** the application is loaded
- **THEN** the hero/empty state is not shown
- **AND** the named location is treated as the active location

#### Scenario: Invalid or incomplete location parameters fall back calmly

- **GIVEN** the URL contains location parameters that are missing one of
  `lat`/`lon`/`name`, or non-numeric/out-of-range coordinates
- **WHEN** the application is loaded
- **THEN** the first-load empty state (hero plus centered search) is shown
- **AND** an inline message from `lib/i18n/uk.ts` explains the link could not be
  opened, with no exclamation mark
- **AND** no generic 500 page and no blank screen is shown

### Requirement: Shell sets no cookies and uses centralized strings

The system SHALL NOT set any cookie from application code as part of rendering or
operating the shell (BC-PRIVACY-03), and ALL shell UI strings SHALL be sourced
from `lib/i18n/uk.ts` rather than hard-coded inline (NFR-I18N-01).

#### Scenario: No cookies are set by the shell

- **GIVEN** a fresh browser session with no prior cookies
- **WHEN** the application is loaded and the shell renders in any state
  (empty state or deep-linked location)
- **THEN** no cookie is set by application code (`document.cookie` remains empty
  of app-set cookies and no `Set-Cookie` is emitted by the app)

#### Scenario: Shell strings come from the i18n table

- **GIVEN** the shell is rendered
- **WHEN** a tester compares the visible top-bar, footer, and empty-state strings
  against `lib/i18n/uk.ts`
- **THEN** each visible shell string matches a value defined in `lib/i18n/uk.ts`

### Requirement: Shell stays within the performance budget

The system SHALL keep the shell lightweight so the initial client JavaScript
payload of the homepage stays at or below 200 KB gzipped (NFR-PERF-03). The shell
SHALL not pull location-dependent feature bundles (forecast, map) into the
first-load empty state.

#### Scenario: Empty-state homepage stays within the JS budget

- **GIVEN** the homepage is built for production and loaded with no location
  parameters
- **WHEN** the initial client JavaScript payload is measured
- **THEN** the total initial client JS is at most 200 KB gzipped

#### Scenario: Empty state does not load feature bundles

- **GIVEN** the first-load empty state is rendered
- **WHEN** the loaded client chunks are inspected
- **THEN** the map and forecast feature bundles are not included in the initial
  load
