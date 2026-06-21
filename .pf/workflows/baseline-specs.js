export const meta = {
  name: 'baseline-specs',
  description: 'Phase 2: author baseline OpenSpec capability specs (draft -> critique -> revise per capability), then cross-check that every MVP FR is owned exactly once with no contradictions.',
  phases: [
    { title: 'Author', detail: 'draft + critique + revise per capability' },
    { title: 'Cross-check', detail: 'FR coverage + consistency over all specs' },
  ],
}

const REQ = 'docs/requirements.md'

// Exact OpenSpec strict format verified against @fission-ai/openspec 1.4.1.
const FORMAT = [
  'Write the file at openspec/specs/<cap>/spec.md in this EXACT strict OpenSpec format (verified to pass `npx openspec validate`):',
  '',
  '# <Capability Title> Specification',
  '',
  '## Purpose',
  '<2-4 sentences on what this capability does and why.>',
  '',
  '## Requirements',
  '',
  '### Requirement: <Short name>',
  'The system SHALL <behavior>. (Cite the FR id(s) in the requirement text, e.g. "(FR-SEARCH-01)".)',
  '',
  '#### Scenario: <Short name>',
  '- **GIVEN** <precondition>',
  '- **WHEN** <action>',
  '- **THEN** <observable, objectively checkable outcome>',
  '',
  'RULES: every `### Requirement:` MUST have at least one `#### Scenario:`. Every scenario must be objectively pass/fail decidable by a tester reading only the scenario. Use SHALL in requirement statements. Keep bullets in GIVEN/WHEN/THEN form.',
].join('\n')

const QUALITY = [
  'QUALITY BAR:',
  '- Cover EVERY owned FR (one or more requirements per FR; cite the FR id in the requirement text).',
  '- Error paths are scenarios too: network/API failure, zero-results, invalid/oversized input, permission denial. The app must NEVER show a generic 500 or a silent blank; failures surface inline and calm (no exclamation marks), with retry where sensible.',
  '- State explicit EXCLUSIONS (e.g. "No theme toggle in MVP", "OSM raster tiles only") so testers do not file scope as bugs.',
  '- Honor travelling NFRs/constraints in scenarios where they bite (accessible names + visible focus for interactive elements; keyless Open-Meteo; lib/ purity for pure functions; Ukrainian-first copy).',
  '- Do NOT invent scope beyond the listed FRs. Tone of any in-spec UI copy: calm, practical, Ukrainian-first, no exclamation marks.',
].join('\n')

const CAPS = [
  {
    name: 'app-shell',
    title: 'App Shell',
    frIds: ['FR-SHELL-01', 'FR-SHELL-02', 'FR-SHELL-03'],
    nfrIds: ['NFR-A11Y-01', 'NFR-A11Y-02', 'NFR-PERF-03', 'NFR-I18N-01', 'BC-BRAND-01', 'BC-BRAND-02', 'BC-PRIVACY-03'],
    notes: `Single-page app: top bar (logo + theme indicator + a slot the clock fills), a main content area, and a footer that credits Open-Meteo and OpenStreetMap with hyperlinks (BC-BRAND-02). Theme follows the system light/dark preference and shows an indicator; there is NO manual theme toggle in MVP (Checkpoint 1 decision). Responsive layout: mobile single-column below 768px, tablet two-column 768-1279px, desktop three-column at 1280px and up (FR-SHELL-02). First-load empty state (no ?lat/?lon/?name in the URL): hero copy plus a prominently centered city search (FR-SHELL-03); when lat/lon/name ARE present, load that location directly and skip the hero. All UI strings come from lib/i18n/uk.ts (NFR-I18N-01). No cookies are set by app code (BC-PRIVACY-03). Exclusions: no theme toggle, no auth, no nav menu beyond the shell.`,
  },
  {
    name: 'top-clock',
    title: 'Top Clock',
    frIds: ['FR-CLOCK-01'],
    nfrIds: ['NFR-A11Y-01', 'NFR-OBS-01'],
    notes: `A compact, accessible local-time clock in the header that updates live while the page is open (FR-CLOCK-01). It shows the VISITOR local time (browser locale/timezone) and is explicitly distinct from the weather day/night logic which uses the active location sunrise/sunset. It has an accessible name, causes no layout shift as digits change, and tears down its timer on unmount so the console stays silent (NFR-OBS-01). A pure time-formatting helper lives in lib/ (framework-free). Exclusions: not a world clock, no timezone picker, not tied to the weather location.`,
  },
  {
    name: 'city-search',
    title: 'City Search',
    frIds: ['FR-SEARCH-01', 'FR-SEARCH-02', 'FR-SEARCH-03', 'FR-SEARCH-04', 'FR-SEARCH-05', 'FR-SEARCH-06'],
    nfrIds: ['NFR-A11Y-01', 'BC-PRIVACY-02', 'TC-DATA-01'],
    notes: `A single free-form text input; debounced (~300ms) suggestions come from the Open-Meteo geocoding API (FR-SEARCH-01). Each suggestion shows city name, admin region (admin1), country, and an optional flag emoji derived from the country code (FR-SEARCH-02). Selecting a suggestion sets the active location and reflects it in the URL as ?lat=&lon=&name= (FR-SEARCH-03). Pressing Enter when exactly one suggestion exists auto-selects it (FR-SEARCH-04). Zero geocoding results show an inline "Nothing found" message, never a toast (FR-SEARCH-05). A "Use my location" button is the only sanctioned, opt-in geolocation path: never on page load, and on permission denial or failure it falls back silently to the search empty state (FR-SEARCH-06, BC-PRIVACY-02). Network/geocoding failures surface an inline calm error with retry, never a 500 (TC-DATA-01, keyless calls). Geo response mappers live in lib/geo (pure). Exclusions: no search history, no persisted autocomplete.`,
  },
  {
    name: 'footer-jokes',
    title: 'Footer Jokes',
    frIds: ['FR-JOKES-01'],
    nfrIds: ['BC-PRIVACY-01', 'NFR-I18N-01'],
    notes: `The footer shows a deterministic Ukrainian weather-themed joke selected from a local curated list, with NO external API and NO tracking (FR-JOKES-01, BC-PRIVACY-01). Selection must be deterministic so server and client render the same text (no hydration mismatch, no per-render randomness) - e.g. chosen by day-of-year or a stable rotating index. A pure selector lives in lib/jokes (framework-free). Tone: calm, no exclamation marks. Exclusions: no joke API, no user-submitted jokes, no analytics.`,
  },
  {
    name: 'forecast',
    title: 'Forecast',
    frIds: ['FR-FORECAST-01', 'FR-FORECAST-02', 'FR-FORECAST-03', 'FR-FORECAST-04', 'FR-FORECAST-05'],
    nfrIds: ['TC-STACK-03', 'TC-DATA-01', 'NFR-OBS-01'],
    notes: `Once a location is active, fetch a 7-day daily forecast from the Open-Meteo forecast API, from a Server Component or Route Handler (FR-FORECAST-01, TC-DATA-01). Render 7 day cards: Ukrainian weekday name, hi/lo in degrees C, a weather icon derived from the weather code, precipitation probability %, and wind speed (FR-FORECAST-02). Render an hourly temperature line chart for the next 48 hours using Recharts (FR-FORECAST-03). Show the sunrise and sunset for today as small text under the hourly chart (FR-FORECAST-04). Re-fetch when the location changes and cache the last successful response in memory until the next location switch (FR-FORECAST-05). Open-Meteo is the only weather provider (TC-STACK-03). A fetch failure surfaces an inline calm error and never a 500 or a silent blank (NFR-OBS-01). Open-Meteo response-to-domain mappers and types live in lib/weather (pure). Exclusions: only the 7-day daily set plus 48h hourly temperature; no marine/aviation/agriculture variables, no historical analysis.`,
  },
  {
    name: 'map',
    title: 'Map',
    frIds: ['FR-MAP-01', 'FR-MAP-02', 'FR-MAP-03', 'FR-MAP-04', 'FR-MAP-05'],
    nfrIds: ['TC-STACK-04', 'TC-MAP-01'],
    notes: `An OSM-tiled interactive Leaflet map (via react-leaflet) bounded to the current location at roughly city zoom (~z10) (FR-MAP-01, TC-STACK-04). A marker at the current location has a popup naming the city (FR-MAP-02). Clicking the map updates the active location (reverse-geocoded via Open-Meteo) and triggers a forecast re-fetch (FR-MAP-03). The map shows "(c) OpenStreetMap contributors" attribution at the bottom-right, required by the OSM Tile Usage Policy (FR-MAP-04, TC-MAP-01: HTTPS, valid Referer, no scraping). The map is client-only via dynamic({ ssr: false }); the SSR placeholder is a skeleton with the same footprint to avoid layout shift (FR-MAP-05). A reverse-geocode failure keeps the prior location and surfaces an inline message, never a 500. Exclusions: OSM raster tiles only - no vector tiles, no Mapbox/Google or other providers.`,
  },
  {
    name: 'comfort-score',
    title: 'Comfort Score',
    frIds: ['FR-COMFORT-01', 'FR-COMFORT-02', 'FR-COMFORT-03', 'FR-COMFORT-04', 'FR-COMFORT-05'],
    nfrIds: ['TC-PURE-01', 'NFR-I18N-01'],
    notes: `comfortScore(daily): { value: 0..100; rationale: string } is a PURE function in lib/scoring/comfort.ts - framework-free, no next/react/DOM (FR-COMFORT-01, TC-PURE-01). Inputs: feels-like temperature, precipitation probability, wind, cloud cover, UV index (FR-COMFORT-02). The rationale is a single Ukrainian sentence, at most 80 characters, with no emojis (FR-COMFORT-03). Each day card shows the score as a colored badge: green for value >= 70, yellow for 40-69, red for < 40 (FR-COMFORT-04). The upcoming weekend score (average of Saturday and Sunday) is highlighted at the top of the forecast grid; "weekend" means the upcoming Sat+Sun in the active location LOCAL calendar date (FR-COMFORT-05). The function is TOTAL: defined for every input combination, clamps the result to 0..100, tolerates missing/undefined inputs, and never throws. Exclusions: thresholds (70/40) are fixed for MVP and not user-tunable.`,
  },
  {
    name: 'animated-bg',
    title: 'Animated Background',
    frIds: ['FR-ANIM-01', 'FR-ANIM-02', 'FR-ANIM-03', 'FR-ANIM-04'],
    nfrIds: ['NFR-A11Y-01'],
    notes: `The background reflects the current condition: a day/night gradient plus rain particles, snow particles, or drifting clouds depending on the weather code (FR-ANIM-01). Day versus night is driven by the sunrise/sunset for TODAY at the ACTIVE LOCATION, not the visitor clock (FR-ANIM-02) - contrast with the top clock which uses the visitor clock. When prefers-reduced-motion is set, render only a static gradient with no particle motion (FR-ANIM-03). The background never blocks interaction: pointer-events are disabled on it (FR-ANIM-04). The condition-to-visual mapping (gradient + particle type) is a pure helper in lib/ (framework-free). Exclusions: CSS/lightweight canvas only, no heavy WebGL, no audio.`,
  },
  {
    name: 'weekend-compare',
    title: 'Weekend Compare',
    frIds: ['FR-COMPARE-01', 'FR-COMPARE-02', 'FR-COMPARE-03'],
    nfrIds: ['BC-PRIVACY-03'],
    notes: `The visitor can pin up to 3 cities; pinned cities appear as a small chip row above the forecast (FR-COMPARE-01). A "Compare weekend" toggle switches the view to a 3-column table for Saturday and Sunday showing hi/lo, precipitation %, and comfort score per city (FR-COMPARE-02). Each column has a sticky header with the city name and a "make active" button that switches the main view to that city (FR-COMPARE-03). The pin limit (3) is enforced. State is client-only - no cookies are set (BC-PRIVACY-03); pins live in component/URL state and need not persist across reloads. Handle the empty compare state (no pins yet) gracefully. Exclusions: no server-side persistence, no accounts.`,
  },
]

const CRITIQUE_SCHEMA = {
  type: 'object',
  required: ['acceptable', 'issues'],
  properties: {
    acceptable: { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } },
  },
}

const COVERAGE_SCHEMA = {
  type: 'object',
  required: ['allCovered', 'gaps', 'duplicates', 'contradictions'],
  properties: {
    allCovered: { type: 'boolean' },
    gaps: { type: 'array', items: { type: 'string' } },
    duplicates: { type: 'array', items: { type: 'string' } },
    contradictions: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

phase('Author')
const authored = await pipeline(
  CAPS,
  (cap) =>
    agent(
      `You are an OpenSpec specification author (the project spec-writer). Read ${REQ} (rows for ${JSON.stringify(cap.frIds)}), AGENTS.md, and openspec/project.md first.\n\nAuthor the baseline spec for capability "${cap.name}" (title: "${cap.title}"). This capability OWNS exactly these FRs: ${JSON.stringify(cap.frIds)}. Travelling NFRs/constraints to honor: ${JSON.stringify(cap.nfrIds)}.\n\nCapability notes: ${cap.notes}\n\n${FORMAT}\n\n${QUALITY}\n\nAfter writing openspec/specs/${cap.name}/spec.md, validate ONLY this spec with: npx openspec validate ${cap.name} --type spec --strict  (do NOT run --all; other specs are being written in parallel). Fix until it passes. Return the list of Requirement names you authored and the validate result.`,
      { label: `draft:${cap.name}`, phase: 'Author' },
    ),
  (draft, cap) =>
    agent(
      `Critique the spec at openspec/specs/${cap.name}/spec.md against ${REQ} (owned FRs: ${JSON.stringify(cap.frIds)}). Read the actual file.\nChecklist: (1) every owned FR is covered and its id cited; (2) every scenario is objectively pass/fail decidable; (3) error-path scenarios exist (API/network failure, zero-results, denial, invalid/oversized input) and none implies a raw 500 or silent blank; (4) explicit exclusions are stated; (5) no scope invented beyond the FRs; (6) travelling NFRs honored (a11y names/focus, keyless, lib purity, Ukrainian-first, no exclamation marks); (7) strict OpenSpec format (### Requirement: with >=1 #### Scenario:, SHALL statements, GIVEN/WHEN/THEN). Set acceptable=true ONLY if you found nothing material; otherwise list concrete, actionable issues.`,
      { label: `critique:${cap.name}`, phase: 'Author', schema: CRITIQUE_SCHEMA, effort: 'high' },
    ),
  async (critique, cap) => {
    if (critique && !critique.acceptable && critique.issues && critique.issues.length > 0) {
      await agent(
        `Revise openspec/specs/${cap.name}/spec.md to resolve these critique issues, keeping the strict OpenSpec format. Then validate with: npx openspec validate ${cap.name} --type spec --strict and fix any errors.\nIssues:\n${critique.issues.map((i, n) => `${n + 1}. ${i}`).join('\n')}`,
        { label: `revise:${cap.name}`, phase: 'Author' },
      )
      return { capability: cap.name, revised: true, issuesFixed: critique.issues.length }
    }
    return { capability: cap.name, revised: false, issuesFixed: 0 }
  },
)

phase('Cross-check')
// Barrier justified: the coverage check must read every spec after all are written.
const coverage = await agent(
  `Cross-check ALL baseline specs under openspec/specs/ against ${REQ}. Read the actual spec files.\nOwnership map: ${JSON.stringify(CAPS.map((c) => ({ name: c.name, frIds: c.frIds })))}.\nVerify: (1) every MVP FR in ${REQ} appears in EXACTLY ONE spec - list any gaps (FR owned by no spec) and duplicates (FR cited by >1 spec) by FR id; (2) no two specs contradict each other (e.g. clock-vs-animated-bg day/night source, theme behavior, URL param shape, error-surface rules); (3) cross-cutting NFRs are not silently claimed as owned by a single spec. Set allCovered=true only if there are zero gaps and zero duplicates. Put any consistency observations in notes.`,
  { label: 'coverage-check', phase: 'Cross-check', schema: COVERAGE_SCHEMA, effort: 'high' },
)

log(
  coverage && coverage.allCovered
    ? 'Coverage check PASSED: every MVP FR owned exactly once.'
    : `Coverage issues - gaps:${coverage ? coverage.gaps.length : '?'} duplicates:${coverage ? coverage.duplicates.length : '?'} contradictions:${coverage ? coverage.contradictions.length : '?'}`,
)

return { authored: authored.filter(Boolean), coverage }
