# ADR-0003: Preserve the PRD's semantic requirement-id grammar in the loop

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** orchestrator + user

## Context

The PRD declares itself the single source of truth and assigns every requirement
a **stable semantic id** of the form `PREFIX-CATEGORY-NN` — e.g. `FR-SEARCH-01`,
`NFR-A11Y-01`, `NFR-I18N-01`, `TC-STACK-01`, `BC-PRIVACY-02`. The PRD states
specs, tests, PRs, and recordings reference these ids to keep traceability
intact. The Project Factory loop shipped with a narrower id grammar
(`PREFIX-NN`, e.g. `FR-12`) hard-coded into `scripts/check-traceability.mjs`
(id scan, requirements-table parse, `@trace` parse) and the `commit-msg` hook
(`Refs:` trailer). Renumbering the PRD would destroy the user's traceability
scheme; that is unacceptable.

## Decision

We widen the loop's recognized id grammar to
`(FR|NFR|TC|BC|BUG)-([A-Z0-9]+-)?NN` — an optional category segment (which may
itself contain digits, for `A11Y`/`I18N`) followed by a numeric suffix. This
matches BOTH the PRD's semantic ids and the Factory's bare `BUG-3` form used for
UAT regressions. The change is confined to the id *pattern*; every enforcement
(each MVP FR cited by a spec, owned by the plan, `@trace`'d by a test, and
trailer-linked by its commit) is unchanged.

This is a **strengthening of recognition, not a weakening of a gate** — the loop
now correctly guards the project's real id scheme instead of silently ignoring
ids it could not parse.

## Alternatives considered

| Option | Pros | Cons |
|---|---|---|
| Widen the loop grammar (chosen) | Preserves PRD ids; gates still hard | Small edits to two scripts |
| Renumber PRD to `FR-01..` | No script edits | Destroys the PRD's stable, semantic source-of-truth ids |
| Maintain a mapping table FR-01 ↔ FR-SEARCH-01 | No script edits | Extra indirection; two id spaces to keep in sync; error-prone |

## Consequences

- **Easier:** specs/tests/commits cite the PRD ids verbatim; `git log --grep FR-SEARCH-01` is a complete audit trail.
- **We accept:** the loop scripts now differ from the upstream reference in the id regex only (documented here and in inline comments).
- **Follow-ups:** `docs/requirements.md` must use a Phase column (`MVP`/`Future`)
  in addition to the PRD's Status column so the traceability checker can classify
  each requirement's phase.
