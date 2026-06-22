# animated-bg Specification

## Purpose
TBD - created by archiving change add-animated-bg. Update Purpose after archive.
## Requirements
### Requirement: Condition-driven background scene

The system SHALL render a background scene whose gradient and particle layer reflect the active location's current weather condition: a day or night gradient plus rain particles, snow particles, or drifting clouds selected from the weather code (FR-ANIM-01). The condition-to-visual mapping (gradient choice and particle type) SHALL be a pure, framework-free helper in `lib/` with no `next/*`, `react`, or DOM imports (TC-PURE-01, FR-ANIM-01).

#### Scenario: Rain condition shows rain particles

- **GIVEN** an active location whose current weather code denotes rain
- **WHEN** the background renders for that condition
- **THEN** the background shows the rain particle layer (and not snow or clouds) over the gradient

#### Scenario: Snow condition shows snow particles

- **GIVEN** an active location whose current weather code denotes snow
- **WHEN** the background renders for that condition
- **THEN** the background shows the snow particle layer (and not rain or clouds) over the gradient

#### Scenario: Cloudy condition shows drifting clouds

- **GIVEN** an active location whose current weather code denotes cloud cover without precipitation
- **WHEN** the background renders for that condition
- **THEN** the background shows the drifting cloud layer (and not rain or snow) over the gradient

#### Scenario: Clear condition shows gradient only

- **GIVEN** an active location whose current weather code denotes clear sky
- **WHEN** the background renders for that condition
- **THEN** the background shows only the gradient with no precipitation or cloud particle layer

#### Scenario: Mapping helper is a pure lib function

- **GIVEN** the condition-to-visual mapping helper in `lib/`
- **WHEN** the helper module is inspected and unit-tested in isolation
- **THEN** it imports no `next/*`, `react`, or DOM globals and returns the gradient and particle type for a given weather code as a plain, deterministic value

#### Scenario: Unknown weather code falls back to gradient only

- **GIVEN** a weather code the mapping helper does not recognize
- **WHEN** the helper is asked for the scene for that code
- **THEN** it returns a valid default gradient with no particle layer and does not throw

### Requirement: Day/night driven by active location sun times

The system SHALL choose the day gradient versus the night gradient using today's sunrise and sunset for the active location, derived from that location's local calendar date, and SHALL NOT use the visitor's device clock or `toISOString().slice(0,10)` for this decision (FR-ANIM-02).

#### Scenario: Local time after sunrise and before sunset renders day gradient

- **GIVEN** an active location whose local current time is after today's sunrise and before today's sunset
- **WHEN** the background computes day versus night
- **THEN** it renders the day gradient

#### Scenario: Local time before sunrise or after sunset renders night gradient

- **GIVEN** an active location whose local current time is before today's sunrise or after today's sunset
- **WHEN** the background computes day versus night
- **THEN** it renders the night gradient

#### Scenario: Decision follows the active location, not the visitor clock

- **GIVEN** an active location where it is currently daytime but the visitor's own device clock is in the middle of the night in a different time zone
- **WHEN** the background computes day versus night
- **THEN** it renders the day gradient based on the active location's sun times, independent of the visitor's device clock

### Requirement: Reduced-motion renders a static gradient

The system SHALL respect the `prefers-reduced-motion` setting: when reduced motion is requested, the background SHALL render only the static day or night gradient with no particle motion and no animated drift (FR-ANIM-03, NFR-A11Y-01).

#### Scenario: Reduced motion suppresses all particle animation

- **GIVEN** a visitor whose environment reports `prefers-reduced-motion: reduce`
- **WHEN** the background renders for any weather condition
- **THEN** only the static gradient is shown and no rain, snow, or cloud-drift animation plays

#### Scenario: Normal motion preference allows particle animation

- **GIVEN** a visitor whose environment does not request reduced motion
- **WHEN** the background renders for a condition with a particle layer
- **THEN** the corresponding particle layer is shown and animates

### Requirement: Background never blocks interaction

The system SHALL render the animated background so it never intercepts pointer events: the background layer SHALL have `pointer-events` disabled so clicks, taps, and hovers pass through to the content above it (FR-ANIM-04).

#### Scenario: Pointer events pass through the background

- **GIVEN** the animated background rendered behind interactive content
- **WHEN** a user clicks or taps at a point where the background overlaps an interactive element
- **THEN** the event reaches the interactive element and the background does not capture or block it

#### Scenario: Background is non-focusable decoration

- **GIVEN** the animated background layer
- **WHEN** a keyboard user moves focus through the page
- **THEN** the background receives no focus stop and exposes no interactive controls

### Requirement: Background fails calm without breaking the page

The system SHALL treat the animated background as non-essential decoration: when the current weather condition or the active location's sun times are missing or unavailable, the background SHALL fall back to a neutral static gradient with no particles and SHALL NOT show an error, a blank crash, or a generic 500 (FR-ANIM-01, FR-ANIM-02).

#### Scenario: Missing weather condition falls back to neutral gradient

- **GIVEN** an active location for which the current weather condition is not yet loaded or failed to load
- **WHEN** the background renders
- **THEN** it shows a neutral static gradient with no particle layer and surfaces no error message

#### Scenario: Missing sun times default to day gradient

- **GIVEN** an active location for which today's sunrise/sunset values are unavailable
- **WHEN** the background computes day versus night
- **THEN** it renders a neutral day gradient as the default and does not throw

### Requirement: Animated background rendering exclusions

The system SHALL implement the animated background using CSS or a lightweight canvas only; it SHALL NOT use heavy WebGL rendering and SHALL NOT play audio. The background SHALL be condition-driven and independent of the UI light/dark theme, and the MVP ships no user control to toggle, pause, or change the background.

#### Scenario: No WebGL or audio in the background

- **GIVEN** the shipped animated background
- **WHEN** its implementation and runtime are inspected
- **THEN** it uses CSS or a lightweight canvas, initializes no WebGL context, and plays no audio

#### Scenario: No background control in the MVP

- **GIVEN** the shipped MVP UI
- **WHEN** a user looks for a way to toggle, pause, or switch the background
- **THEN** no such control is present, and the background remains driven solely by weather condition and the active location's sun times

