# Tasks — add-app-shell

> No database in this project (ADR-0001). The "schema" section is dependencies +
> the pure location/i18n contracts. The smoke test is a real browser render, not
> a DB flow.

## 1. Dependencies and shared contracts
- [x] 1.1 Generate shadcn/ui base primitives (button, input, card) with the
        neutral base color; add `lib/utils.ts` (`cn` helper).
- [x] 1.2 Define `lib/location/types.ts` — `ActiveLocation { lat; lon; name }`
        and a parse-result discriminated union.

## 2. Failing tests first (red) — from the spec, before implementation
- [x] 2.1 Unit `lib/location/url.test.ts`: parse `?lat&lon&name` — valid, missing
        one param, non-numeric, out-of-range lat/lon, extra whitespace; serialize
        round-trip. Each `@trace FR-SHELL-03` (deep-link/empty-state).
- [x] 2.2 Unit `lib/i18n/i18n.test.ts`: `t(key)` returns the uk string; `uk` and
        `en` have identical key sets; no uk string contains "!". `@trace NFR-I18N-01, BC-BRAND-01`.
- [x] 2.3 Eval case `evals/cases/app-shell.eval.ts`: empty-state hero + deep-link
        error notice copy graded for calm Ukrainian tone, no exclamation marks
        (`@trace BC-BRAND-01, FR-SHELL-03`).
- [x] 2.4 Run `npm run test:run` — confirm RED (assertions fail, not import errors).

## 3. Domain logic (green) — implement until §2 unit tests pass
- [x] 3.1 `lib/location/url.ts` — `parseLocationParams(params)` →
        `{ ok:true, location } | { ok:false, reason }` with range validation;
        `toLocationQuery(location)` serializer.
- [x] 3.2 `lib/i18n/uk.ts` (primary strings), `lib/i18n/en.ts` (mirror),
        `lib/i18n/index.ts` (typed `t` accessor + key type).

## 4. Shell components
- [x] 4.1 `components/shell/Notice.tsx` — shared inline calm message (no toast).
- [x] 4.2 `components/shell/TopBar.tsx` — logo, theme indicator (system pref),
        clock slot (children/prop).
- [x] 4.3 `components/shell/Footer.tsx` — Open-Meteo + OpenStreetMap credit links.
- [x] 4.4 `components/shell/EmptyState.tsx` — hero + centered search slot.
- [x] 4.5 `components/shell/AppShell.tsx` — top bar + responsive `<main>` grid
        (1/2/3 col at 768/1280) + footer.

## 5. Routing and theme
- [x] 5.1 `app/layout.tsx` — html lang="uk", metadata, theme via globals.css;
        mount `AppShell`.
- [x] 5.2 `app/globals.css` — Tailwind 4 theme tokens, light/dark via
        `prefers-color-scheme`, AA-contrast palette, visible focus styles.
- [x] 5.3 `app/page.tsx` — read search params; valid deep link → location view
        placeholder; else empty state; invalid → empty state + `Notice`.
- [x] 5.4 Ensure no cookies are set anywhere in the shell path.

## 6. Validation, docs, and archive prep
- [x] 6.1 `npm run test:run` (green)
- [x] 6.2 `npm run lint`
- [x] 6.3 `npx tsc --noEmit`
- [x] 6.4 `npm run build`
- [x] 6.5 `npx openspec validate add-app-shell --strict`
- [x] 6.6 `npx openspec validate --all --strict`
- [x] 6.7 Run review-gate workflow; fix all confirmed findings; re-run 6.1–6.6.
        (3 review passes; all confirmed defects fixed; review-findings.json clean.)
- [x] 6.8 Update `docs/current-state.md`.
- [x] 6.9 Browser smoke (real render): implementer verified on the prod server —
        empty state, deep link `?lat=50.45&lon=30.52&name=Kyiv` skips hero,
        invalid `?lat=999` shows the calm Notice, no Set-Cookie, grid classes
        grid-cols-1 md:grid-cols-2 xl:grid-cols-3. Full responsive/contrast
        visual capture is recorded at G6 (browser MCP, TC-STACK-05).
- [x] 6.10 Archive only after 6.1–6.9 pass:
        `npx openspec archive add-app-shell --yes`.
