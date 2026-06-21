# Weather Explorer / Weekend Trip Planner — Agent Rules

# This may NOT be the Next.js you know

The installed version (Next.js 16.2, React 19.2) may differ from training data.
Read the relevant guide in `node_modules/next/dist/docs/` before writing any
code. Heed deprecation notices. This project is **App Router only**.

Use `docs/requirements.md` to understand the requirements for the project. The
upstream PRD uses the same `FR-/NFR-/TC-/BC-` ids — keep them stable.

## Project Factory (works in any tool)

This project is delivered with **Project Factory**, a spec-driven multi-agent
framework. The deterministic loop — `scripts/check-*` (traceability, coverage,
eval, trajectory), git hooks, CI, OpenSpec specs, and the gates — is pure
Node + git. Maker ≠ checker: the agent that builds a slice never reviews it.

## Project Handoff Protocol

Before planning or implementing any substantive change, read:

1. `docs/current-state.md` — latest persistent handoff and next-step guidance.
2. `docs/mvp-capability-plan.md` — change sequence and capability scope.
3. `openspec/project.md` and the relevant files under `openspec/specs/`.
4. `docs/adr/` for accepted architecture decisions.

Keep `docs/current-state.md` current at every milestone (OpenSpec change
created/implemented/validated/archived; capability planned→implemented; an ADR
accepted). Write last update date/time (timezone: Europe/Kyiv) and the current
phase. It is a handoff aid, not the source of truth — if it conflicts with
code/specs/tests, verify and update it.

## Context architecture (static vs dynamic)

This file is **static context** — paid for on every agent turn — so keep it to
durable cross-cutting rules. Per-domain detail lives in the spec, the code, or
`docs/context-architecture.md`. Token budget is enforced there; demote detail
when this file grows past it.

## Stack (locked — see docs/adr/)

- Next.js 16.2 App Router · TypeScript strict · React 19.2 (TC-STACK-01).
- Tailwind CSS 4 (PostCSS plugin) · shadcn/ui (base-nova) · class-variance-authority (TC-STACK-02).
- Open-Meteo forecast + geocoding APIs only; **keyless, no paid keys** (TC-STACK-03, NFR-COST-01).
- Leaflet + react-leaflet; OSM raster tiles only (TC-STACK-04, TC-MAP-01).
- Recharts for charts (FR-FORECAST-03); Vitest for `lib/` unit tests.
- **No database, no auth, no email, no cookies, no analytics** (BC-PRIVACY-01/02/03).
- E2E verification via browser MCP (Claude Preview / chrome-devtools), NOT Playwright (TC-STACK-05).

## Skills (load on demand)

- **`vercel-react-best-practices`** (`.agents/skills/vercel-react-best-practices/`,
  pinned in `skills-lock.json`): 70 React/Next.js performance rules in 8 priority
  categories (eliminating waterfalls, bundle size, server-side, client fetching,
  re-render, rendering, JS, advanced). Read its `SKILL.md` + the relevant
  `rules/*.md` when writing, reviewing, or refactoring React/Next code — it
  directly serves NFR-PERF-01/02/03 and the silent-console rule (NFR-OBS-01).

## Module conventions

- **`lib/` is framework-free (TC-PURE-01):** no `next/*`, no `react`, no DOM
  globals. Pure, 100% unit-testable. This is where domain logic lives:
  - `lib/scoring/comfort.ts` — pure `comfortScore(daily)` (FR-COMFORT-01).
  - `lib/weather/` — Open-Meteo response → domain types, mappers, fetch helpers
    (the fetch wrappers may use `fetch` but no React/Next imports).
  - `lib/geo/` — geocoding + reverse-geocoding mappers.
  - `lib/i18n/uk.ts` (primary) + `en.ts` (fallback); all UI strings centralised, no runtime i18n lib (NFR-I18N-01).
  - `lib/jokes/` — deterministic Ukrainian joke selection (FR-JOKES-01).
  - Colocated `*.test.ts` next to each pure module.
- **Open-Meteo calls** happen in Server Components or Route Handlers where
  possible; never present URLs to the client as if keys were required (TC-DATA-01).
- **Components:** server components by default; `"use client"` only when a
  component needs interactivity/browser APIs. Map is client-only via
  `dynamic({ ssr: false })` with a skeleton placeholder of equal footprint (FR-MAP-05).
- Pages are thin; one shared app shell (top bar + main + footer) (FR-SHELL-01).

## Correctness rules (learned from production bugs)

- **Error-surface:** no user input or external call produces a generic 500 or
  fails silently. Geocoding zero-results shows inline "Nothing found", no toast
  (FR-SEARCH-05). Forecast/map fetch failures degrade honestly (visible state),
  never a blank crash (NFR-OBS-01).
- Numeric/locale parsers accept trailing zeros and decimal commas.
- `comfortScore` is **pure and total** — defined for every input combination,
  clamps to 0..100, never throws (FR-COMFORT-01/02).
- Day-bound logic (weekend detection, sunrise/sunset, "today") uses the active
  location's local calendar dates, not the user's clock and not
  `toISOString().slice(0,10)` (FR-ANIM-02, FR-COMFORT-05).
- Animations respect `prefers-reduced-motion` (static gradient only) and never
  block pointer events (FR-ANIM-03/04).
- Geolocation only on explicit user action, never on load (BC-PRIVACY-02).
- Console silent at runtime — no warnings, no errors on a healthy session (NFR-OBS-01).
- Tone: Ukrainian-first, calm, practical, **no exclamation marks** (BC-BRAND-01).

## Test-first (per slice)

Write the slice's unit tests (from the spec) FIRST and confirm they FAIL (red);
then implement to green. Never weaken a test to pass it — if a test contradicts
the spec, change it deliberately, not silently. Every test file carries
`@trace FR-x` annotations.

## Validation cadence

Run before and after substantial changes:

```bash
npm run lint
npm run test:run
npm run build
npx openspec validate --all --strict
node scripts/check-eval-ratchet.mjs   # once evals exist — graded-quality bar
```

## Evals (graded quality, not just correctness)

Tests assert exact results; evals grade *quality* a unit test can't — error
clarity, empty-state usability, copy tone (Ukrainian, no exclamation marks),
comfort-rationale quality. Cases live in `evals/cases/*.eval.ts` (scenario +
`produce()` + rubric + `@trace`). The `eval-suite` workflow grades them with a
fresh `eval-judge` agent; `node scripts/check-eval-ratchet.mjs` guards the
committed score in CI (no API key). Quality may ratchet up, never silently drop.

## Environment notes

- OS/shell: Windows 11; primary shell PowerShell, Bash (Git Bash) also available.
  Use forward slashes in Node scripts; avoid bashisms in npm scripts.
- No database, no server secrets: `.env.example` documents only optional public
  config. The app runs with zero env vars (NFR-COST-01).
- Open-Meteo is keyless and free-tier; respect OSM Tile Usage Policy (HTTPS,
  valid Referer, attribution shown) (TC-MAP-01, FR-MAP-04).
