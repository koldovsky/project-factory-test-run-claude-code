# Comfort Score Specification

## ADDED Requirements

### Requirement: Pure framework-free scoring function

The system SHALL expose `comfortScore(daily): { value: number; rationale: string }` as a pure
function in `lib/scoring/comfort.ts` that contains no `next/*`, no `react`, and no DOM globals,
so it is 100% unit-testable in isolation (FR-COMFORT-01, TC-PURE-01).

#### Scenario: Module has no framework imports

- **GIVEN** the file `lib/scoring/comfort.ts`
- **WHEN** a reviewer inspects its import statements and identifier references
- **THEN** it imports nothing from `next/*`, `react`, or `react-dom`, and references no DOM
  globals (`window`, `document`, `navigator`)

#### Scenario: Function is callable without a framework runtime

- **GIVEN** a Vitest unit test that imports only `comfortScore` from `lib/scoring/comfort.ts`
- **WHEN** the test calls `comfortScore` with a plain daily object and no React/Next/DOM environment present
- **THEN** the call returns an object with a numeric `value` and a string `rationale` without throwing

#### Scenario: Function is deterministic

- **GIVEN** one fixed daily input object
- **WHEN** `comfortScore` is called twice with that same input
- **THEN** both calls return an identical `value` and an identical `rationale`

### Requirement: Scoring inputs

The system SHALL compute the comfort value from these daily inputs: feels-like temperature,
precipitation probability, wind, cloud cover, and UV index (FR-COMFORT-02).

#### Scenario: All five inputs influence the score

- **GIVEN** a baseline daily input that yields a known comfort value
- **WHEN** exactly one of feels-like temperature, precipitation probability, wind, cloud cover,
  or UV index is changed to a markedly worse value while the others are held constant
- **THEN** the returned `value` is less than or equal to the baseline value for each such change,
  and at least one of these single-input changes produces a strictly lower value

#### Scenario: Pleasant conditions score high

- **GIVEN** a daily input with comfortable feels-like temperature, 0% precipitation probability,
  light wind, moderate cloud cover, and a low-to-moderate UV index
- **WHEN** `comfortScore` is called
- **THEN** the returned `value` is at least 70

#### Scenario: Hostile conditions score low

- **GIVEN** a daily input with near-freezing feels-like temperature, 100% precipitation
  probability, strong wind, full cloud cover, and a zero (or near-zero) UV index consistent with
  the full cloud cover
- **WHEN** `comfortScore` is called
- **THEN** the returned `value` is below 40

### Requirement: Ukrainian rationale copy

The system SHALL return a `rationale` that is a single Ukrainian sentence, at most 80 characters
long, containing no emojis and no exclamation marks (FR-COMFORT-03, NFR-I18N-01).

#### Scenario: Rationale length and language

- **GIVEN** any daily input
- **WHEN** `comfortScore` returns its result
- **THEN** `rationale` is a non-empty string of at most 80 characters written in Ukrainian as a
  single sentence

#### Scenario: Rationale contains no emojis or exclamation marks

- **GIVEN** any daily input
- **WHEN** `comfortScore` returns its result
- **THEN** `rationale` contains no emoji characters and no `!` character

### Requirement: Total and safe scoring

The system SHALL keep `comfortScore` total: it is defined for every input combination, returns a
`value` that is an integer in the inclusive range 0..100 (clamped and rounded), tolerates missing,
`undefined`, `NaN`, non-numeric, or wrong-typed inputs, and never throws (FR-COMFORT-01,
FR-COMFORT-02).

#### Scenario: Value is always an integer within range

- **GIVEN** any daily input, including extreme or out-of-range field values
- **WHEN** `comfortScore` is called
- **THEN** the returned `value` is an integer (no fractional component) greater than or equal to 0
  and less than or equal to 100

#### Scenario: Missing or undefined inputs do not throw

- **GIVEN** a daily input where one or more of feels-like temperature, precipitation probability,
  wind, cloud cover, or UV index is missing or `undefined`
- **WHEN** `comfortScore` is called
- **THEN** the call returns a result object with an integer in-range `value` and a non-empty
  string `rationale` without throwing

#### Scenario: NaN or non-numeric field values do not throw

- **GIVEN** a daily input where one or more of feels-like temperature, precipitation probability,
  wind, cloud cover, or UV index is `NaN`, a string, a boolean, `null`, or any other non-numeric
  value arriving from upstream parsing
- **WHEN** `comfortScore` is called
- **THEN** the call returns a result object with an integer `value` greater than or equal to 0 and
  less than or equal to 100 and a non-empty string `rationale` without throwing

#### Scenario: Empty object does not throw

- **GIVEN** an empty object `{}` passed as the daily input
- **WHEN** `comfortScore` is called
- **THEN** the call returns an integer in-range `value` and a non-empty `rationale` without throwing

### Requirement: Per-day colored badge

The system SHALL display each day's comfort score on its day card as a colored badge, evaluating
the band against the integer comfort value with half-open ranges so every value maps to exactly
one band: green when the value is at least 70 (>= 70), yellow when the value is from 40 up to but
not including 70 (40 <= value < 70), and red when the value is below 40 (< 40) (FR-COMFORT-04).

#### Scenario: Green badge for high comfort

- **GIVEN** a day whose integer comfort value is 70 or higher (>= 70)
- **WHEN** the day card renders
- **THEN** the comfort badge shows the value and uses the green band styling

#### Scenario: Yellow badge for moderate comfort

- **GIVEN** a day whose integer comfort value is at least 40 and below 70 (40 <= value < 70)
- **WHEN** the day card renders
- **THEN** the comfort badge shows the value and uses the yellow band styling

#### Scenario: Red badge for low comfort

- **GIVEN** a day whose integer comfort value is below 40 (< 40)
- **WHEN** the day card renders
- **THEN** the comfort badge shows the value and uses the red band styling

#### Scenario: Badge has an accessible name

- **GIVEN** any day card with a comfort badge
- **WHEN** the badge is inspected by assistive technology
- **THEN** the badge exposes an accessible name that conveys the comfort value in Ukrainian and
  does not rely on color alone to communicate the comfort band

### Requirement: Highlighted upcoming-weekend score

The system SHALL highlight the upcoming weekend comfort score, computed as the arithmetic mean of
the upcoming Saturday and Sunday integer day scores rounded to the nearest integer (rounding half
up, so a `.5` mean rounds upward) into an integer in 0..100, at the top of the forecast grid, where
"weekend" means the upcoming Saturday and Sunday in the active location's LOCAL calendar dates
(FR-COMFORT-05).

#### Scenario: Weekend average is shown at the top of the grid

- **GIVEN** a 7-day forecast for the active location that includes the upcoming Saturday and Sunday
- **WHEN** the forecast grid renders
- **THEN** a highlighted weekend summary appears at the top of the grid showing an integer comfort
  value equal to the arithmetic mean of that Saturday's and Sunday's integer comfort values rounded
  to the nearest integer (for example, a mean of 70.5 from values 71 and 70 is displayed as 71)

#### Scenario: Weekend is resolved in the active location's local calendar

- **GIVEN** an active location whose local calendar date differs from the visitor's own clock date
  (for example, across a date-line or timezone boundary)
- **WHEN** the upcoming weekend is determined
- **THEN** Saturday and Sunday are identified from the active location's local calendar dates, not
  from the visitor's device clock and not from a UTC-based date slice

#### Scenario: Only one weekend day is present in the forecast window

- **GIVEN** a 7-day forecast window that contains exactly one of the upcoming Saturday or Sunday
- **WHEN** the weekend summary renders
- **THEN** the highlighted weekend value is taken from the single available weekend day, and the
  summary indicates calmly in Ukrainian that it reflects one day rather than crashing or showing a blank

#### Scenario: Weekend summary badge follows the same color bands

- **GIVEN** a computed, rounded integer weekend average comfort value
- **WHEN** the weekend summary renders
- **THEN** its badge band is evaluated against that rounded integer value and uses the same
  half-open green/yellow/red bands as per-day badges (green when value >= 70, yellow when
  40 <= value < 70, red when value < 40)

### Requirement: Fixed thresholds (exclusion)

The system SHALL treat the comfort color thresholds of 70 and 40 as fixed for the MVP and SHALL
NOT expose any user control to change them (FR-COMFORT-04).

#### Scenario: No threshold control in the UI

- **GIVEN** the forecast view and any day card
- **WHEN** a tester surveys all interactive controls
- **THEN** there is no control to adjust, configure, or override the 70/40 comfort thresholds

## Exclusions

- The comfort thresholds (70 and 40) are fixed for the MVP and are not user-tunable.
- The comfort score uses only the five named inputs (feels-like temperature, precipitation
  probability, wind, cloud cover, UV index); no additional weather variables (for example,
  humidity, air quality, or marine/aviation data) are in scope for the MVP.
- The rationale is a single Ukrainian sentence; there is no multi-sentence explanation, no
  per-factor breakdown UI, and no English-language rationale in the MVP.
