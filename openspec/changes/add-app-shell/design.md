# Design — add-app-shell

## Goals / Non-goals

- **Goals:** a lightweight, accessible, responsive shell; the three reusable
  contracts (location state, i18n, error-surface); empty-state vs deep-link
  routing; system-preference theming.
- **Non-goals:** the functional search input (city-search slice), the clock
  (top-clock slice), forecast/map/jokes content (their slices). The shell renders
  slots/placeholders only. No manual theme toggle (Checkpoint 1). No cookies.

## Key decisions

1. **Active-location state lives in the URL** (`?lat&lon&name`), parsed/validated
   by a pure `lib/location` module. Rationale: shareable deep links (FR-SEARCH-03),
   no cookies (BC-PRIVACY-03), no server state. Trade-off: state is stringly-typed
   in the URL — mitigated by a typed parser that validates ranges
   (lat ∈ [-90,90], lon ∈ [-180,180]) and returns a discriminated result
   (`{ ok: true, location } | { ok: false, reason }`).
2. **i18n without a runtime library** (NFR-I18N-01). `lib/i18n/uk.ts` is the
   source of truth; `en.ts` mirrors its keys; a typed `t(key)` accessor over a
   `const` object gives compile-time key safety. No switcher in MVP.
3. **Theme via CSS `prefers-color-scheme`** only — no JS, no class toggle, no
   cookie. The "indicator" is a small element whose label (from i18n) reflects the
   active theme via CSS. Trade-off: cannot override the OS preference — acceptable
   per Checkpoint 1.
4. **Error-surface = a shared inline `Notice` component** rendering a calm message
   (no toast, no exclamation marks). Every later slice reuses it. This is the
   error-surface principle realized once.
5. **shadcn/ui base** generated here (button, input, card primitives) using the
   neutral base color; CVA for variants (TC-STACK-02).

## Data model

No database. The only "model" is the pure TypeScript `ActiveLocation`:
`{ lat: number; lon: number; name: string }`, plus a parse result type. Lives in
`lib/location/types.ts` + `lib/location/url.ts` (parse/serialize/validate).

## Error handling

- Invalid/incomplete `?lat&lon&name` → `lib/location` returns `{ ok:false }`; the
  page renders the empty state + an inline `Notice` ("Не вдалося відкрити
  посилання") — never a 500, never blank (FR-SHELL deep-link fallback).
- All user-visible strings come from `lib/i18n`; missing keys are a compile error
  (typed accessor), so no runtime "undefined" leaks to the UI.

## Risks & mitigations

- **Shared-contract churn:** later slices depend on `ActiveLocation` + the URL
  shape. Mitigation: lock the type + parser here with exhaustive unit tests;
  changes after this slice flow through a spec amendment.
- **Theme indicator a11y:** ensure the indicator has an accessible name in both
  themes (i18n) and AA contrast (verified in browser at G6).
- **Perf budget (NFR-PERF-03):** keep the empty state free of feature bundles;
  Leaflet/Recharts are dynamically imported only by their own slices.
