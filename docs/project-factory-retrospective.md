# Project Factory — Retrospective & Improvement Suggestions

> Audience: the agent/maintainer who owns the **/project-factory** plugin & skill.
> Source: one full greenfield test run — "Weather Explorer / Weekend Trip
> Planner" (Next.js 16.2, keyless Open-Meteo, no DB/auth/email), built end to end
> with the framework, plus two rounds of human feedback that exposed gaps.
> Every item below is something actually hit during the run, not hypothetical.

## TL;DR — the five that matter most

1. **The bundled recording/proof approach doesn't actually work.** It shipped as
   stubs + stack-coupled reference scripts, produced recordings that needed the
   *user's own browser* and a *manual save dialog*, and never validated anything.
   Replace it with a real automated headless harness. (§A)
2. **No visual or accessibility validation anywhere in the loop.** Every gate is
   structural/textual, so "obvious" visual defects (a dead theme toggle, poor
   color contrast) sailed through all gates *and* the maker≠checker code audit.
   Add axe + vision verification. (§B)
3. **`--strict-recordings` is a paper gate** — it only checks that FR ids are
   *mentioned* in a manifest, not that any recording exists or passed. (§A2)
4. **Workflow `args` don't reach the script** (silent: 0 agents, `{}` result).
   Hit twice. (§C1)
5. **Stack swaps fight the framework** — default Postgres/Drizzle/Auth/Resend/
   Playwright assumptions are baked into reference scripts, the per-slice loop,
   and the ID/Recording gates, so a legitimately different stack needed manual
   ADRs, deletions, and regex-widening to get a green build. (§D)

What's genuinely good and should be protected is in §F.

---

## A. Recordings & proof — the biggest gap

### A1. The default recording path is unusable and not automated
**What happened.** `qa:record-demos` / `qa:record-proof` shipped as
`node -e "console.log(...)"` placeholders. The bundled `record-demos.reference.ts`
/ `record-proof-recordings.reference.ts` imported Drizzle/Playwright modules that
don't exist on a keyless/no-DB stack, so they broke `tsc`/`build` and had to be
deleted. The documented fallback — "browser-MCP recordings" — in practice routed
the capture through the **user's real Chrome**, and exporting a clip triggered a
**Save-As dialog the user had to click**. The recordings also only *illustrated*
flows; nothing asserted a requirement.

**Impact.** The single loudest piece of user feedback: *"it shouldn't work this
way… it should be completely automated… I don't believe we should use the user's
browser at all."* Manual, user-browser-coupled, non-validating recordings are
worse than none — they create false confidence and a bad experience.

**Suggestion.** Ship a **real automated headless recording+validation harness**
as the default (we used Playwright; Puppeteer works too): its own background
browser, no user interaction, no save dialog. Each clip should **drive a real
flow and assert the FRs it proves** (the assertion *is* the validation) while
recording video. Provide `record-demos.mjs` that turns the run into committed
artifacts + a manifest, and a pure-Node `check-recordings.mjs` for CI.

**Why.** "Record" and "prove the requirement" must be the same step; otherwise
recordings drift from reality and prove nothing.

### A2. `check-traceability --strict-recordings` is a paper gate
**What happened.** The gate passes if each MVP FR id merely *appears as text* in
any `docs/qa/**/manifest.json`. A hand-authored manifest listing every FR — with
**zero actual recordings on disk** — passes `--strict-recordings`.

**Impact.** False "every FR has recorded evidence" signal. We literally had a
green `--strict-recordings` while no video files existed.

**Suggestion.** The recordings gate should verify the **artifact exists** (video
file present + non-trivial size) and carries a **validated/passed status from an
actual run**, not just an id mention. Keep the id-mention check as a *separate,
weaker* "coverage map" signal.

**Why.** A gate that can be satisfied by writing a JSON file is not a gate.

### A3. Nothing confirms a recording actually *shows* the requirement
**What happened.** Even with real assertions, an assertion confirms DOM state
("element is visible"), not the user-visible result (did the map tiles actually
paint? is the text legible?). Our first automated clips were ~0.5–2s, so async
content (Leaflet tiles) hadn't rendered, and proof stills captured the wrong
moment (viewport top / end-state).

**Impact.** Recordings that "pass" but don't visibly demonstrate the requirement.
User feedback: *"recordings are too short… map event can't render in time… I
expect… real validation by video recording recognition that requirement is met,
and if not — it should be fixed and re-recorded until met."*

**Suggestion.** Add a **vision-verification stage**: capture a settled full-page
proof still per clip; a **fresh** agent (maker≠checker) reads the image and
returns `{met, readable, notes}`; the gate fails unless every clip is met +
readable; on failure **fix → re-record → re-verify until met**. Pace clips so
async content renders. Emit a per-clip **Markdown description** tying steps to
requirements alongside the video + still.

**Why.** This is the only layer that catches "looks broken to a human." In our
run it immediately flagged a real low-contrast forecast state and wrong-moment
frames that *both axe and the assertions passed*. It is the difference between
"a test went green" and "a person can see the requirement is met."

---

## B. Visual & accessibility validation — missing entirely

### B1. Every gate is structural/textual; none looks at pixels
**What happened.** Gates covered traceability, unit/integration tests, evals,
coverage, lint, build, OpenSpec. **None measured color contrast or rendered
appearance.** Two "very obvious" defects shipped through all of them: a theme
control that looked interactive but did nothing on click, and poor contrast /
unreadable text (dark mode rendered as a light-blue page; faint footer + small
secondary text).

**Impact.** The largest class of escaped defects in the run was visual, and the
user found them in seconds.

**Suggestion.** For any UI capability, add to the loop:
- an **axe-core a11y/contrast gate** (WCAG-AA, run in **light and dark**), and
- the **vision verification** from §A3.
Make *"validate the rendered result, not just the code and the DOM"* an explicit
first-class principle in the skill's operating rules.

**Why.** Code-reading and assertion-only E2E are *blind to rendering*. A toggle
that renders but is inert, or AA-borderline text that reads as faint, is invisible
to them by construction. Note: **axe alone is insufficient** — it passed our app
while a human (and the vision agent) judged the contrast poor; you need both.

### B2. The maker≠checker audit can't see the running app
**What happened.** The review/audit agents have `Read/Grep/Glob/Bash` only. The
independent UX audit (4 lenses + adversarial verify) was excellent and found
**7 real structural defects** — but it is code-only, so it **missed the 2 visual
ones**.

**Suggestion.** Give UI review/audit a path to the rendered UI — screenshots +
a vision pass — not just source. Keep the code audit; add an eyes-on-pixels lens.

**Why.** "Can't see pixels" is exactly the blind spot that let the visual defects
through an otherwise strong audit.

---

## C. Framework mechanics / runtime bugs

### C1. Workflow `args` don't reach the script
**What happened.** Passing `args` to the Workflow tool produced a script where
`args` was `undefined`/empty — the workflow ran **0 agents and returned `{}`**
with no error. Hit twice (slice fan-out; vision-verify). Fix was to **hardcode**
the data into the persisted `scriptPath` file and re-invoke.

**Impact.** Silent, hard-to-diagnose failure; wastes a run; non-obvious workaround.

**Suggestion.** Fix the `args` plumbing; failing that, make an empty `args` when
the caller passed one a **loud error**, and document the hardcode-into-scriptPath
pattern prominently.

### C2. Project subagent types aren't available at session start
**What happened.** On a fresh project the project-factory agents
(`requirements-analyst`, `spec-writer`, `capability-implementer`, …) weren't in
the Agent registry until after `init` copied them — Phases 1–2 had to fall back to
`general-purpose` with inlined instructions.

**Suggestion.** Ensure the registry picks up `.claude/agents/*` immediately after
`init` (reload), or document explicitly that the first phase runs on
`general-purpose` until a reload.

**Why.** The skill's playbook tells you to dispatch named agents that don't exist
yet — confusing on the very first run.

### C3. Reference scripts are brittle / not stack-agnostic
**What happened.** Besides the recorder references (§A1), `check-eval-ratchet`
**failed** before any eval output existed (no summary + no baseline) and had to be
made tolerant; the recorders assumed Drizzle/Playwright.

**Suggestion.** Reference scripts must (a) be stack-agnostic or clearly gated by
declared stack, and (b) **no-op gracefully before their inputs exist** (ratchets
should SKIP, not FAIL, pre-baseline).

**Why.** The framework shipped code that **fails its own gates** on a supported
stack-swap — I had to delete/patch bundled files just to get a green build.

### C4. ID grammar too narrow
**What happened.** `check-traceability` and the `commit-msg` hook assumed
`FR-\d+`; the PRD used categorized ids (`FR-SHELL-01`, `NFR-A11Y-02`). I had to
widen the regex to `(?:FR|NFR|TC|BC|BUG)-(?:[A-Z0-9]+-)?\d+` (recorded in ADR-0003).

**Suggestion.** Support categorized ids out of the box, or make the id pattern a
documented config value.

**Why.** Real PRDs use semantic ids; the default silently rejected the project's
own requirement ids.

### C5. Trajectory check vs OpenSpec archive naming
**What happened.** `openspec archive` produces `2026-06-22-add-x`; `check-trajectory`
matched `Slice: add-x` trailers and the **date prefix broke the match** — I patched
the check to strip it.

**Suggestion.** The trajectory check should tolerate OpenSpec's archive date
prefix natively.

**Why.** One bundled tool produced names another bundled tool rejected.

---

## D. Stack-swap handling

### D1. The default stack is baked in deeper than it should be
**What happened.** Postgres/Drizzle/Better-Auth/Resend/Playwright assumptions
appear in reference scripts, the per-slice loop (a "real-DB smoke test" step), and
templates. The PRD explicitly dropped all of them (keyless, no DB/auth/email).
Reconciling required ADR-0001 plus deleting/patching shipped files and removing
loop steps that didn't apply.

**Suggestion.** Make the stack a **first-class declared configuration** that the
loop and reference scripts adapt to: no DB → omit the DB-smoke step; no Playwright
→ select the configured E2E/recording strategy; etc. `init` already takes
stack-swap flags — push that signal all the way through.

**Why.** A spec-driven framework should treat the *spec's* stack as the source of
truth, not fight it at every checkpoint.

### D2. "No Playwright" as a default constraint was net-negative
**What happened.** The default steered away from Playwright toward "browser-MCP
recordings," which is what produced the unusable, manual, user-browser recording
path (§A1). When the constraint was lifted, a headless Playwright harness solved
recording **and** validation **and** vision cleanly.

**Suggestion.** Don't ban a capable browser-automation tool by default. Make the
*recording/E2E strategy* an explicit decision and default it to something that
actually runs headless and validates.

**Why.** The constraint's stated rationale (keep the stack lean) didn't survive
contact with the real requirement (automated, validated, headless proof).

---

## E. Gate & release model

### E1. Deploy-gated NFRs aren't distinguished from locally-verifiable ones
**What happened.** The release gate assumes deploy + live measurement (Lighthouse,
p95 TTFB) but deploy is user-gated and those NFRs **can't be measured locally**.
They ended up as "open / verify at G7" risk-register notes rather than gated.

**Suggestion.** Split NFRs into **local-verifiable** vs **deploy-gated**; mark
deploy-gated ones explicitly as "pending live URL" in the gate output instead of
silently skipping or blocking.

**Why.** Otherwise "done" is ambiguous — it's unclear what truly remains versus
what was quietly skipped.

---

## F. What worked — protect and amplify these

- **The backbone is strong:** spec-driven + test-first + maker≠checker +
  deterministic `check-*` scripts + git hooks + a real traceability chain
  (FR → spec → slice → test/recording → commit). This structure is the reason the
  project stayed honest and reviewable. Keep it.
- **Evals as a graded quality bar earned their keep.** The eval-suite caught a
  genuine semantic bug a unit test could not — a 95%-rain day scoring ~70 with a
  "pleasant day" rationale. Expand evals; they catch quality, not just correctness.
- **The parallel multi-agent audit is powerful.** Diverse lenses + adversarial
  per-finding verification found 7 real UX defects independently. Promote this to
  a **standard gate for UI projects** (and pair it with the visual lens from §B2).
- **OpenSpec integration works** once the layout is understood; the change →
  archive lifecycle kept specs and code in sync.
- **Coverage/eval ratchets** (quality may rise, never silently drop) are a good
  pattern; just make them graceful before their baseline exists (§C3).

---

## Prioritized roadmap for the plugin

1. **(Critical)** Replace the recording/proof system with a real automated
   headless harness that asserts FRs and (optionally) vision-verifies; never use
   the user's browser; no manual steps. Make `--strict-recordings` verify real
   artifacts, not id mentions. (§A)
2. **(Critical)** Add visual + a11y validation (axe + vision) to the UI loop and
   make "validate the rendered result" an operating principle. Give the audit an
   eyes-on-pixels lens. (§B)
3. **(High)** Fix Workflow `args`; surface empty-args as an error. Fix agent
   registration timing after `init`. (§C1, §C2)
4. **(High)** Make reference scripts stack-agnostic and ratchets graceful before
   inputs exist — don't ship code that fails the framework's own gates. (§C3, §D1)
5. **(Medium)** Widen the requirement-id grammar (categorized ids) and reconcile
   `check-trajectory` with OpenSpec archive naming. (§C4, §C5)
6. **(Medium)** Distinguish deploy-gated NFRs from locally-verifiable ones in the
   release gate. (§E1)

## Pointers / evidence in this repo

The workarounds above are documented as accepted decisions the maintainer can read
as concrete examples:
- `docs/adr/ADR-0001` — stack swap (keyless, drop DB/auth/email/Playwright).
- `docs/adr/ADR-0003` — widened requirement-id grammar.
- `docs/adr/ADR-0005` — traceability gate calibration for browser-only FRs.
- `docs/adr/ADR-0006` — automated headless Playwright recordings (replaces §A1).
- `docs/adr/ADR-0007` — clickable theme toggle (the visual defect from §B1).
- `docs/adr/ADR-0008` — visual + a11y validation in the loop (§A3, §B).
- `docs/qa/ux-defects.md` — the 9 confirmed UX defects (7 structural + 2 visual).
- `e2e/recordings.spec.ts`, `e2e/a11y.spec.ts`, `scripts/record-demos.mjs`,
  `scripts/check-recordings.mjs` — a working reference implementation of the
  proposed recording+validation+vision approach.
</content>
