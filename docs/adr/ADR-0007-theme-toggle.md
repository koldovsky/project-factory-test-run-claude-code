# ADR-0007: Clickable theme toggle (reverses "system-only, no toggle")

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** user + orchestrator
- **Reverses:** the Checkpoint-1 decision "theme = system preference + indicator, no toggle".

## Context

The MVP shipped a read-only theme **indicator** (system preference only, no
toggle). The user reported it as a defect: it looks like a control but does
nothing on click, and there was no way to choose a theme. Separately, dark mode
read as a light-blue page because the animated sky gradient is theme-independent
(a daytime sky is light blue even in dark mode).

## Decision

Replace the indicator with a real, clickable **theme toggle** (`ThemeToggle`,
client component):

- Default follows the OS (`prefers-color-scheme`); a click overrides it by setting
  `data-theme="light|dark"` on `<html>` and persisting the choice in
  `localStorage`. The CSS tokens flip on `data-theme` (and still on the media query
  when no choice is forced).
- A tiny inline script in the layout applies the stored choice before paint (no
  flash). State is read via `useSyncExternalStore` (the project's browser-state
  pattern — no setState-in-effect).
- A theme **veil** over the animated sky dims the gradient in dark mode so the page
  reads as dark and content stays readable; transparent in light mode.

`localStorage` for a theme preference is a benign UI setting, not a tracking
cookie — BC-PRIVACY-03 (no analytics / tracking cookies) is unaffected.

## Consequences

- FR-SHELL-01 now includes an interactive theme toggle; `globals.css` theming is
  attribute-driven; `AGENTS.md` updated.
- Validated by `clip-theme-toggle` (asserts a click changes `data-theme`) and the
  axe a11y suite (both themes) + visual review.
- Trade-off: a hydration-time icon settle (server renders a neutral label until
  the client resolves the theme) — acceptable and flash-free for the page itself.
