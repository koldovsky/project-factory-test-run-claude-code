# top-clock Specification

## Purpose
TBD - created by archiving change add-top-clock. Update Purpose after archive.
## Requirements
### Requirement: Live visitor local-time clock in header

The system SHALL render a compact clock in the application header that shows the visitor's own local time, derived from the browser locale and timezone, and SHALL keep it updating live while the page is open so the displayed time stays current (FR-CLOCK-01).

#### Scenario: Clock displays the visitor's local time on load

- **GIVEN** the page is open in a browser whose locale and timezone resolve the current local time to a known value
- **WHEN** the header first renders
- **THEN** the clock shows the current visitor local time formatted for that browser locale, matching the time reported by the visitor's own system clock to the minute

#### Scenario: Clock advances live without a page reload

- **GIVEN** the clock is visible in the header showing a given time
- **WHEN** enough wall-clock time passes for the displayed minute to change while the page stays open
- **THEN** the clock updates to the new time on its own, with no page reload and no user interaction

#### Scenario: Clock uses the visitor timezone, not the weather location

- **GIVEN** an active weather location is selected whose timezone differs from the visitor's browser timezone
- **WHEN** the visitor reads the header clock
- **THEN** the clock still shows the visitor's own local time, and does not change to the weather location's timezone

### Requirement: Accessible name and no layout shift

The system SHALL give the clock an accessible name and SHALL render it so that updating digits cause no layout shift, honoring the accessibility bar that every interactive or informational element has an accessible name and visible focus where focusable (NFR-A11Y-01).

#### Scenario: Clock exposes an accessible name to assistive technology

- **GIVEN** a screen reader is inspecting the header
- **WHEN** it reaches the clock element
- **THEN** the clock has a non-empty accessible name in Ukrainian that identifies it as the current local time, so it is not announced as an unlabeled string of numbers

#### Scenario: Updating digits do not shift surrounding layout

- **GIVEN** the clock is visible and its digits change as time advances (for example from a narrow digit such as "1" to a wide digit such as "0", or across a minute rollover)
- **WHEN** the displayed time updates
- **THEN** the clock's rendered width stays stable and no header or page content around it moves as the digits change

### Requirement: Pure framework-free time-formatting helper

The system SHALL implement the clock's time formatting as a pure, framework-free helper under `lib/` that takes a point in time plus locale and timezone inputs and returns the formatted display string, with no `next/*`, no `react`, and no DOM globals, so it is fully unit-testable (FR-CLOCK-01, TC-PURE-01).

#### Scenario: Helper formats a given instant deterministically

- **GIVEN** the pure formatting helper in `lib/` is called with a fixed instant, a fixed locale, and a fixed timezone
- **WHEN** it returns the formatted time string
- **THEN** the result is the same on every call for those inputs and contains no framework or DOM dependencies, so it can be asserted directly in a Vitest unit test

#### Scenario: Helper falls back calmly when locale or timezone is unavailable

- **GIVEN** the pure formatting helper is called and the requested locale or timezone cannot be resolved
- **WHEN** it formats the time
- **THEN** it returns a readable time string using a safe default rather than throwing, so the clock never renders an error or a blank value

### Requirement: Silent teardown of the clock timer

The system SHALL tear down the clock's update timer when the clock component unmounts, leaving no leaked interval and producing no console warnings or errors on a healthy session (NFR-OBS-01).

#### Scenario: Timer is cleared on unmount with a silent console

- **GIVEN** the clock is mounted and updating live on a healthy session
- **WHEN** the clock component unmounts
- **THEN** its update timer is cleared, no further updates are attempted against the removed element, and the browser console shows no warnings and no errors

### Requirement: Top-clock scope exclusions

The system SHALL keep the top-clock capability limited to the visitor's single local-time display and SHALL NOT add world-clock behavior, a timezone picker, or any binding to the active weather location (FR-CLOCK-01).

#### Scenario: No timezone picker or world-clock control is present

- **GIVEN** the header clock is rendered
- **WHEN** a tester inspects it and the surrounding header
- **THEN** there is exactly one local-time display with no timezone selector, no additional city clocks, and no control to switch the clock to another timezone

#### Scenario: Changing the active weather location does not change the clock

- **GIVEN** the clock is showing the visitor's local time
- **WHEN** the visitor selects a different active weather location
- **THEN** the clock's displayed time and timezone are unchanged, confirming the clock is not tied to the weather location

