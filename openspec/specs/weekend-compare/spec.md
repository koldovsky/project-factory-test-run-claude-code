# weekend-compare Specification

## Purpose
TBD - created by archiving change add-weekend-compare. Update Purpose after archive.
## Requirements
### Requirement: Pin cities to a chip row

The system SHALL let the visitor pin the active city and SHALL render the set of pinned cities as a chip row positioned directly above the forecast (FR-COMPARE-01). Each chip SHALL show the city name and SHALL provide a control to remove (unpin) that city. Each pin, unpin, and chip control SHALL be a keyboard-operable element with an accessible name and a visible focus style (NFR-A11Y-01).

#### Scenario: Pin the active city

- **GIVEN** a city is active and is not yet pinned and fewer than 3 cities are pinned
- **WHEN** the visitor activates the "pin" control for that city
- **THEN** the city appears as a chip in the chip row above the forecast, showing the city name

#### Scenario: Unpin a city from its chip

- **GIVEN** a city is shown as a chip in the chip row
- **WHEN** the visitor activates the remove control on that chip
- **THEN** the chip is removed from the chip row and the city count decreases by one

#### Scenario: Chip controls are keyboard-accessible

- **GIVEN** the chip row contains at least one chip
- **WHEN** the visitor moves focus to a chip's pin/remove control with the keyboard
- **THEN** the control exposes an accessible name identifying the city and the action, and shows a visible focus indicator

### Requirement: Enforce the three-city pin limit

The system SHALL allow at most 3 pinned cities at any time (FR-COMPARE-01). When 3 cities are already pinned, the system SHALL prevent pinning a fourth and SHALL surface a calm inline message in Ukrainian explaining the limit, without exclamation marks and without a toast (BC-BRAND-01).

#### Scenario: Pinning is blocked at the limit

- **GIVEN** 3 cities are already pinned
- **WHEN** the visitor attempts to pin a fourth city
- **THEN** the fourth city is not added, the chip row still shows exactly 3 chips, and a calm inline message in Ukrainian explains that the limit of 3 cities is reached

#### Scenario: Pinning becomes available again after unpinning

- **GIVEN** 3 cities are pinned and the limit message is shown
- **WHEN** the visitor unpins one city
- **THEN** the chip row shows 2 chips and the visitor can pin another city successfully

### Requirement: Compare weekend toggle and table

The system SHALL provide a "Compare weekend" toggle that switches the view into a comparison table with one column per pinned city (up to 3) (FR-COMPARE-02). The table SHALL present, for the upcoming Saturday and Sunday, each city's hi/lo temperature, precipitation probability %, and comfort score. The upcoming Saturday and Sunday SHALL be derived from each pinned city's own local calendar date, not the visitor's clock. The toggle SHALL be keyboard-operable with an accessible name and a visible focus style (NFR-A11Y-01).

#### Scenario: Toggle into the compare table

- **GIVEN** at least one city is pinned
- **WHEN** the visitor activates the "Compare weekend" toggle
- **THEN** the view shows a table with one column per pinned city and rows for Saturday and Sunday, each cell showing hi/lo temperature, precipitation probability %, and comfort score

#### Scenario: Toggle back to the standard view

- **GIVEN** the compare table is shown
- **WHEN** the visitor deactivates the "Compare weekend" toggle
- **THEN** the view returns to the standard single-city forecast view

#### Scenario: Weekend days follow each city's local date

- **GIVEN** two pinned cities are in time zones whose local calendar dates differ
- **WHEN** the compare table is shown
- **THEN** each column's Saturday and Sunday rows correspond to that city's own upcoming Saturday and Sunday by its local calendar date

### Requirement: Sticky column header with make-active

The system SHALL render each compare-table column with a sticky header showing the city name and a "make active" button that switches the main single-city view to that city (FR-COMPARE-03). The header SHALL remain visible while the table body is scrolled. The "make active" button SHALL be keyboard-operable with an accessible name that identifies the target city and a visible focus style (NFR-A11Y-01).

#### Scenario: Make a column's city active

- **GIVEN** the compare table is shown with a column for a given city
- **WHEN** the visitor activates that column's "make active" button
- **THEN** the main single-city view switches to that city

#### Scenario: Column header stays visible on scroll

- **GIVEN** the compare table content is taller than its viewport
- **WHEN** the visitor scrolls the table body
- **THEN** each column's header with the city name and "make active" button remains visible at the top

#### Scenario: Make-active button is keyboard-accessible

- **GIVEN** the compare table is shown
- **WHEN** the visitor moves focus to a column's "make active" button with the keyboard
- **THEN** the button exposes an accessible name identifying the target city and shows a visible focus indicator

### Requirement: Empty compare state

The system SHALL handle the no-pins case gracefully (FR-COMPARE-01, FR-COMPARE-02). When no cities are pinned, the system SHALL NOT render an empty table or a blank area; instead it SHALL show a calm inline message in Ukrainian inviting the visitor to pin cities, without exclamation marks.

#### Scenario: No cities pinned

- **GIVEN** no cities are pinned
- **WHEN** the weekend-compare area is rendered
- **THEN** a calm inline message in Ukrainian invites the visitor to pin cities, and no empty comparison table is shown

#### Scenario: Compare toggle with no pins

- **GIVEN** no cities are pinned
- **WHEN** the visitor reaches the "Compare weekend" affordance
- **THEN** the view does not show a blank table and instead shows the calm "pin a city first" inline message in Ukrainian

### Requirement: Compare data unavailable degrades calmly

The system SHALL degrade honestly when forecast data for a pinned city cannot be loaded for the weekend comparison (NFR-OBS-01). On a fetch or network failure for a pinned city, the system SHALL NOT show a generic 500, a silent blank, or a console error on a healthy session; the affected column SHALL show a calm inline Ukrainian message with a retry affordance, while other columns continue to render their data.

#### Scenario: One city's forecast fails to load

- **GIVEN** two cities are pinned and the compare table is shown
- **WHEN** the forecast request for one pinned city fails
- **THEN** that city's column shows a calm inline Ukrainian message with a retry control, the other city's column still shows its hi/lo, precipitation %, and comfort score, and no generic 500 or blank area is shown

#### Scenario: Retry recovers a failed column

- **GIVEN** a pinned city's column shows the failure message with a retry control
- **WHEN** the visitor activates retry and the forecast request succeeds
- **THEN** that column shows the city's Saturday and Sunday hi/lo, precipitation %, and comfort score

### Requirement: Client-only state, no cookies

The system SHALL keep all weekend-compare state (the set of pinned cities and the compare toggle) client-only and SHALL NOT set any cookie for this capability (BC-PRIVACY-03). Pinned-city state MAY live in component and/or URL state and is NOT required to persist across a full page reload.

#### Scenario: No cookies set by pinning

- **GIVEN** the application is loaded with no cookies
- **WHEN** the visitor pins cities, toggles compare, and makes a column active
- **THEN** no cookie is set by the application for these actions

#### Scenario: Persistence across reload is not required

- **GIVEN** one or more cities are pinned via component-only state
- **WHEN** the visitor performs a full page reload
- **THEN** the absence of pinned cities after reload is acceptable behavior and the app shows the empty compare state rather than an error

### Requirement: Weekend Compare exclusions

The system SHALL limit weekend-compare scope to the listed behaviors and SHALL NOT add server-side persistence, accounts, or saved comparisons (FR-COMPARE-01, FR-COMPARE-02, FR-COMPARE-03). These exclusions are intentional and are not defects.

#### Scenario: No server-side persistence or accounts

- **GIVEN** the weekend-compare capability is in use
- **WHEN** a tester checks for saved comparisons, login, or server-stored pins
- **THEN** none exist, because pins are client-only and there are no accounts or server-side persistence in the MVP

#### Scenario: Pin limit is fixed at three

- **GIVEN** the weekend-compare capability is in use
- **WHEN** a tester checks the maximum number of pinnable cities
- **THEN** the maximum is exactly 3 and there is no configuration to raise it in the MVP

