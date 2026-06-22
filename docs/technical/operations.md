# Operations & environments

How to run, configure, and deploy the app. It is keyless and DB-free
([ADR-0001](../adr/ADR-0001-stack.md)), so operations are deliberately small. See
also [architecture](./architecture.md) · [integrations](./integrations.md).

## Run locally

Prerequisites: Node.js (the toolchain targets Node 20 `@types`) and npm. No
database, no services, no secrets.

```bash
npm install
npm run dev      # http://localhost:3000 (Next dev server)
npm run build    # production build
npm run start    # serve the production build
```

Validation battery (matches CI):

```bash
npm run lint
npm run test:run
npm run build
npx openspec validate --all --strict
npm run qa:verify          # the full all-green gate (NFR-DX-01)
```

## Environment variables

**Zero required.** The app runs with no env vars (NFR-COST-01): Open-Meteo and
OSM tiles are keyless, and there is no database, auth, email, or analytics.

`.env.example` documents only **optional public** overrides (`NEXT_PUBLIC_`
prefix = shipped to client; safe to expose) — the Open-Meteo forecast/geocode
base URLs, for self-hosting a proxy. Leave them unset for normal use:

```
# NEXT_PUBLIC_OPEN_METEO_FORECAST_URL=https://api.open-meteo.com/v1/forecast
# NEXT_PUBLIC_OPEN_METEO_GEOCODE_URL=https://geocoding-api.open-meteo.com/v1/search
```

There are **no secret env vars** — nothing to rotate, leak, or set in a
deployment dashboard.

## Deploy to Vercel (TC-DEPLOY-01)

1. Push the repository to Git (GitHub/GitLab/Bitbucket).
2. In Vercel, **New Project → Import** the repo. Vercel auto-detects Next.js;
   keep the defaults (build `next build`, output handled by the Next adapter).
3. **Environment variables:** none required. (Optionally set the two
   `NEXT_PUBLIC_OPEN_METEO_*` overrides; otherwise leave empty.)
4. Deploy. Each PR gets a Preview URL via the Git integration (TC-DEPLOY-01);
   merges to the default branch promote to Production.
5. The runtime is the home route `/` (server-rendered on demand) plus the two
   `/api/*` keyless proxy route handlers — no DB connection, no edge config.

### Post-deploy measurements (G7)

These NFRs are deploy-dependent and **cannot be asserted from the repo** — measure
on the live URL and record the results against the NFR rows in the
[acceptance report](../qa/mvp-acceptance-report.md):

- **NFR-PERF-01** — homepage p95 TTFB ≤ 300 ms (Vercel Preview analytics).
- **NFR-PERF-02** — Lighthouse Performance ≥ 90 (production URL, mobile + desktop).
- **NFR-PERF-03** — initial client JS ≤ 200 KB gzipped (confirm on the deployed
  build; Leaflet + Recharts are already kept out of the initial bundle via
  `dynamic({ ssr:false })`).
- **NFR-A11Y-01** — Lighthouse Accessibility ≥ 95.

Code-level mitigations are in place and reviewed (deferred heavy libs, bounded
particle count `PARTICLE_COUNT=14`, focus styles, accessible names, AA-contrast
tokens). A score is not a score until it is measured.

## Known `npm audit` advisories (dev-only, not release blockers)

`npm audit` reports 3 advisories (1 low, 2 moderate) as of 2026-06-22. All are in
the **dev/build toolchain**, not the shipped keyless runtime, so they are tracked
(R-11) rather than blocking:

| Advisory | Path | Why it is dev-only |
|---|---|---|
| **postcss** `<8.5.10` — XSS via unescaped `</style>` in CSS stringify output (moderate, GHSA-qx2v-qp2m-jg93) | `node_modules/next/node_modules/postcss` (transitive via Next) | A build-time CSS transform. The "fix" is `npm audit fix --force`, which would downgrade Next to `9.3.3` — a breaking change that violates TC-STACK-01 (Next 16.2). Not applied. No user-supplied CSS is stringified at runtime. |
| **esbuild** `0.27.3–0.28.0` — dev server arbitrary file read on Windows (low, GHSA-g7r4-m6w7-qqqr) | `node_modules/esbuild` (via Vitest) | Affects only esbuild's local **development** server, which this project does not expose; esbuild is a test-tooling transitive dep, not in the production bundle. |
| **next** (flagged for depending on the vulnerable postcss above) | `node_modules/next` | Same postcss transitive issue; resolving it means the same breaking downgrade. The production runtime ships no secrets and no server attack surface beyond the two keyless proxy routes. |

Action at G7: re-run `npm audit`; record the remaining advisories in the
[delivery report](../delivery-report.md); upgrade only if a **runtime-affecting**
advisory appears or a non-breaking fix becomes available.

## Operational posture

- **No persistence** to back up, migrate, or restore (no DB by design).
- **No secrets** to manage or rotate.
- **Availability** depends on Open-Meteo + OSM; every external failure degrades to
  a calm inline state (R-01) — the app never serves a 500 or a blank.
- **Fair-use:** request-scoped `cache()` dedupes per render; search is debounced
  (~300 ms); compare is capped at 3 cities. If demo traffic is heavy, consider a
  short server-side cache header at G7 (R-02).
