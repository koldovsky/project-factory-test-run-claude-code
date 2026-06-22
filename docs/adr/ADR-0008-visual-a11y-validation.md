# ADR-0008: Visual + accessibility validation in the recording loop

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** user + orchestrator
- **Builds on:** ADR-0006 (automated Playwright recordings).

## Context

Two "very obvious" defects shipped: a theme control that did nothing on click,
and poor color contrast / readability. The audit and harness missed both because
they were **structural and textual** — they asserted that elements exist and that
text matches, but never **measured contrast** or **looked at the rendered
pixels**. Code-reading agents cannot see rendering; assertion-only E2E cannot see
"looks interactive but isn't" or "too faint to read". The recordings were also
too short (async content like map tiles had not rendered) and had no written
explanation or independent confirmation that a requirement was actually shown.

## Decision

Add two validation layers to the loop, and richer recordings:

1. **Automated accessibility + contrast gate** (`e2e/a11y.spec.ts`, axe-core):
   scans empty + forecast in light + dark, fails on WCAG AA color-contrast and
   serious/critical a11y violations. Deterministic; catches measurable contrast.

2. **Vision verification of recordings** (`recording-vision-verify` workflow):
   each clip captures a settled proof still; a **fresh** vision agent (maker≠
   checker) reads the image and confirms the requirement is *visibly* met **and**
   readable. Verdicts are folded into the manifest; `check-recordings` fails unless
   every clip is vision-met + readable. This catches what axe and assertions can't
   (perceptual readability, half-rendered states, misleading affordances). On a
   failed verdict: fix → re-record → re-verify until met.

3. **Recordings are real proof:** clips are paced so async content renders (longer
   videos), each carries a Markdown description tying steps to requirements
   (`demo-recordings/README.md`), a video, and a vision-verified proof still.

`npm run test:e2e` runs the recordings + a11y suites; `npm run qa:record-demos`
regenerates the manifest/README; `npm run check:recordings` guards the committed
evidence (validated + frame + vision-met). `qa:verify` runs the live e2e suite and
the recordings gate.

## Consequences

- A whole class of "looks fine to code, broken to a human" defects now fails a
  gate (contrast via axe; readability/affordance/rendering via vision).
- Cost: the e2e + vision steps need a browser (Playwright) and a few agent calls
  per recording run — run by the maker and in CI (`npx playwright install`).
- The lesson is encoded as process, not memory: **validate the rendered result,
  not just the code and the DOM.**
