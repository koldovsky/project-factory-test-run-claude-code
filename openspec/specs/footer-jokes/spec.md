# footer-jokes Specification

## Purpose
TBD - created by archiving change add-footer-jokes. Update Purpose after archive.
## Requirements
### Requirement: Local curated joke source

The system SHALL source footer jokes only from a local, curated, in-repo list of
Ukrainian weather-themed jokes, with no external joke API, no user-submitted
jokes, and no network request to obtain a joke (FR-JOKES-01, BC-PRIVACY-01).

#### Scenario: Jokes are bundled locally

- **GIVEN** the application is built and running
- **WHEN** the footer joke is rendered on any page load
- **THEN** no network request is made to fetch the joke text
- **AND** the displayed joke text matches an entry in the in-repo curated joke list

#### Scenario: No tracking or analytics tied to the joke

- **GIVEN** the footer joke is displayed
- **WHEN** the joke is shown, changes, or is re-rendered
- **THEN** no analytics event, tracker, fingerprint, or third-party request is emitted (BC-PRIVACY-01)

#### Scenario: Joke list is non-empty Ukrainian weather-themed copy

- **GIVEN** the curated joke list in `lib/jokes`
- **WHEN** the list is inspected
- **THEN** it contains at least one joke
- **AND** every joke is written in Ukrainian
- **AND** no joke contains an exclamation mark

### Requirement: Deterministic joke selection

The system SHALL select the footer joke deterministically from a stable input
(such as the day-of-year or a stable rotating index) so that the same input
always yields the same joke, and the server-rendered and client-rendered joke are
identical for a given page load (FR-JOKES-01, NFR-I18N-01).

#### Scenario: Same input yields the same joke

- **GIVEN** the pure selector in `lib/jokes` and a fixed selection input (e.g. a given day-of-year)
- **WHEN** the selector is called multiple times with that same input
- **THEN** it returns the same joke string every time

#### Scenario: No hydration mismatch between server and client

- **GIVEN** a single page load
- **WHEN** the server renders the footer joke and the client hydrates the footer
- **THEN** the joke text rendered on the server equals the joke text after client hydration
- **AND** the browser console reports no hydration-mismatch warning or error

#### Scenario: Selection stays within list bounds

- **GIVEN** the pure selector and a curated list of N jokes
- **WHEN** the selector is called with any integer selection input, including 0, large values, and negative values
- **THEN** it returns a valid joke from the list
- **AND** it never throws and never returns null, undefined, or empty string

#### Scenario: Selection rotates over time

- **GIVEN** the curated list contains two or more jokes
- **WHEN** the selector is evaluated for two different days that map to different list positions
- **THEN** the two days produce different jokes (the selection is not pinned to a single constant joke)

### Requirement: Pure framework-free selector

The system SHALL implement the joke selector as a pure, total function in
`lib/jokes` that imports no `next/*`, no `react`, and uses no DOM globals or
randomness, so it is deterministic and fully unit-testable (FR-JOKES-01, TC-PURE-01).

#### Scenario: Selector has no framework or environment dependencies

- **GIVEN** the source of the joke selector module in `lib/jokes`
- **WHEN** its imports and references are inspected
- **THEN** it imports no `next/*` and no `react`
- **AND** it references no DOM globals (such as `window` or `document`)
- **AND** it calls no randomness source (such as `Math.random` or `Date.now`)

#### Scenario: Selector is unit-testable in isolation

- **GIVEN** a Vitest unit test importing only the `lib/jokes` selector
- **WHEN** the test runs without any browser or Next.js runtime
- **THEN** the selector executes and returns a deterministic joke for a given input

### Requirement: Calm Ukrainian footer presentation

The system SHALL display the selected joke in the footer as plain text in
Ukrainian, with calm, practical tone and no exclamation marks, and SHALL never
render a broken, blank, or error placeholder in place of the joke (FR-JOKES-01,
NFR-I18N-01, BC-PRIVACY-01).

#### Scenario: Joke is shown in the footer

- **GIVEN** any page of the app is loaded
- **WHEN** the footer renders
- **THEN** the selected Ukrainian joke text is visible in the footer

#### Scenario: Footer joke degrades calmly if the list is unexpectedly empty

- **GIVEN** the curated joke list is empty (a degenerate state)
- **WHEN** the footer renders
- **THEN** the footer area renders without throwing and without a generic 500 or blank crash
- **AND** the footer either omits the joke line entirely or shows calm static fallback text with no exclamation mark

### Requirement: Scope exclusions

The system SHALL NOT add joke-related scope beyond a deterministic local joke:
specifically no external joke API, no user-submitted or editable jokes, no
joke-related analytics, and no interactive joke controls (such as a "next joke"
button) in the MVP (FR-JOKES-01, BC-PRIVACY-01).

#### Scenario: No external joke API integration exists

- **GIVEN** the codebase and footer joke feature
- **WHEN** the joke feature is inspected
- **THEN** there is no call to any external or third-party joke service

#### Scenario: No user-facing joke controls in MVP

- **GIVEN** the rendered footer
- **WHEN** the footer is inspected for interactive controls
- **THEN** there is no "next joke", "refresh joke", or joke-submission control
- **AND** there is no input that lets a user submit or edit a joke

