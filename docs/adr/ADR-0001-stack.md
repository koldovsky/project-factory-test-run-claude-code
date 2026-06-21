# ADR-0001: Stack — keyless client weather app on Next.js, dropping DB/auth/email/Playwright

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** orchestrator + user

## Context

The PRD (FR/NFR/TC/BC ids in `docs/requirements.md`) describes a public,
read-only weather + weekend-planner web app. It locks the stack explicitly:
Next.js 16.2 App Router, TypeScript strict, React 19.2 (TC-STACK-01); Tailwind
CSS 4 + shadcn/ui + class-variance-authority (TC-STACK-02); Open-Meteo APIs only,
keyless (TC-STACK-03, NFR-COST-01); Leaflet + react-leaflet on OSM raster tiles
(TC-STACK-04, TC-MAP-01); Vitest with no Playwright in MVP — browser MCP for E2E
(TC-STACK-05). Privacy constraints forbid analytics, third-party trackers, and
application-set cookies (BC-PRIVACY-01/03). There are no user accounts, history,
or server-side persistence (Out of scope, MVP). The Project Factory default
stack assumes Postgres + Drizzle + Better Auth + Resend + Playwright.

## Decision

We will build a **database-free, auth-free, email-free** Next.js 16.2 App Router
app. All weather/geo data comes from the **keyless Open-Meteo** forecast +
geocoding APIs, called from Server Components / Route Handlers (TC-DATA-01).
We **drop** Postgres + Drizzle (no persistence needed), Better Auth (no
accounts), and Resend (no email). We **add** Tailwind CSS 4, shadcn/ui
(base-nova), Leaflet + react-leaflet, and Recharts. We **replace Playwright**
with browser-MCP-driven E2E verification recordings for the MVP (TC-STACK-05).
Domain logic lives in a framework-free `lib/` (TC-PURE-01) unit-tested with
Vitest. Hosting is Vercel (TC-DEPLOY-01).

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| Keyless client app (chosen) | Matches PRD exactly; zero cost/secrets; trivial deploy; fully demoable | Forecast accuracy bound to one provider (Open-Meteo) |
| Default PF stack (Postgres/Drizzle/Better Auth/Resend) | Reuses factory defaults verbatim | Violates PRD: no accounts, no DB, no email needed; adds cost + secrets the PRD forbids |
| Add a DB later for "favorites" | Server-side favorites | Explicitly out of scope for MVP; pinned cities are client-only (FR-COMPARE-01) |

## Consequences

- **Easier:** no migrations, no auth guards, no seed helpers, no secrets to
  manage; CI needs no services; deploy is a static-ish Vercel build.
- **We accept:** the Phase 4 per-slice loop has no "real-DB smoke test" step —
  the smoke equivalent is a real Open-Meteo fetch path exercised via a Route
  Handler / Server Component and verified in the browser (recordings). Seed
  helpers are replaced by recorded fixture responses for deterministic tests.
- **Follow-ups:** ADR-0002 records the context-architecture budget; future
  persistence (favorites) would require a new ADR re-introducing storage.
- Open-Meteo + OSM attribution is mandatory (FR-MAP-04, BC-BRAND-02) and OSM
  Tile Usage Policy must be respected (TC-MAP-01).
