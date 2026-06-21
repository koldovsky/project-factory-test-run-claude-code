# Project — Weather Explorer / Weekend Trip Planner

## Purpose

A public, keyless, Ukrainian-first web app that helps people decide where and
when to take a weekend trip based on weather. It surfaces a 7-day forecast, an
hourly temperature chart, an interactive map, and a comfort score per day, with
an animated weather background. No accounts, no database, no tracking.

## Tech stack

- Next.js 16.2 (App Router), React 19.2, TypeScript strict.
- Tailwind CSS 4 (PostCSS), shadcn/ui (base-nova), class-variance-authority.
- Open-Meteo APIs (forecast + geocoding) — keyless, free-tier, the only weather provider.
- Leaflet + react-leaflet, OSM raster tiles only.
- Recharts (charts), Vitest (unit tests on framework-free `lib/`).
- Hosting: Vercel. E2E verification: browser MCP recordings (no Playwright in MVP).

## Conventions

- Requirement ids `FR-/NFR-/TC-/BC-` from `docs/requirements.md` are stable and
  traced from specs (`## Requirements`), tests (`@trace FR-x`), and commits
  (`Slice:`/`Refs:`).
- `lib/` is framework-free (no `next/*`, no `react`, no DOM globals) — 100% unit-testable.
- Open-Meteo calls run in Server Components / Route Handlers where possible.
- UI strings centralised in `lib/i18n/uk.ts` (primary) + `en.ts` (fallback).
- Tone: calm, practical, Ukrainian-first, no exclamation marks.

## Capabilities (specs live under openspec/specs/<capability>/spec.md)

`app-shell`, `top-clock`, `city-search`, `forecast`, `map`, `comfort-score`,
`animated-bg`, `footer-jokes`, `weekend-compare` (optional).

## Out of scope (MVP)

Push notifications, scheduled jobs, accounts/history/server-side favorites,
marine/aviation/agriculture variables, localisation beyond UA+EN, native mobile,
historical/climate analysis beyond the 7-day forecast.
