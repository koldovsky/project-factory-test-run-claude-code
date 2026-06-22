export const meta = {
  name: 'build-slice',
  description: 'Per-slice inner loop: test-engineer writes failing (red) tests from the change spec, then a DIFFERENT capability-implementer makes them green. Maker(tests) != Maker(code) != later reviewers. Pass args: { slice: "add-<cap>" }.',
  phases: [
    { title: 'Red', detail: 'test-engineer writes failing tests from the spec' },
    { title: 'Green', detail: 'implementer makes them pass without weakening tests' },
  ],
}

// EDIT PER WAVE (args passing is unreliable for scripted workflows here).
// Builds each slice sequentially (red -> green) — they must touch disjoint files.
const SLICES = ['add-map']

// Build each slice sequentially: red (test-engineer) then green (implementer).
// Sequential (not parallel) because the agents share one working tree.
const results = []
for (const slice of SLICES) {
  phase(`Red:${slice}`)
  const red = await agent(
    `You are the test-engineer. Working dir is the repo root (Windows; Bash tool with forward slashes). Write FAILING (red) unit tests FIRST for the "${slice}" slice, BEFORE implementation.\n\nREAD: openspec/changes/${slice}/tasks.md (section 2 lists exactly which tests to write), openspec/changes/${slice}/specs/*/spec.md (the requirements/scenarios), openspec/changes/${slice}/design.md (the contracts), AGENTS.md (lib/ framework-free per TC-PURE-01; Ukrainian-first, no exclamation marks), vitest.config.ts (test globs + @ alias), evals/README.md (eval-case shape).\n\nWrite ONLY the test files (and eval-case file) named in tasks.md section 2. Put pure-logic tests as lib/<domain>/*.test.ts. Add @trace FR-x annotations exactly as tasks.md specifies. Do NOT create the implementation modules — import from the not-yet-created paths so the tests fail at resolution/assertion level for the RIGHT reason.\n\nThen run \`npm run test:run\` and confirm the NEW tests are RED (other slices' tests stay green).\n\nReturn: the exact files created, the red output, and the PRECISE API contract the implementer must satisfy (signatures, types, i18n keys, component props). Do not weaken or skip any test.`,
    { label: `red:${slice}`, phase: `Red:${slice}`, agentType: 'test-engineer' },
  )

  phase(`Green:${slice}`)
  const green = await agent(
    `You are the capability-implementer. Working dir is the repo root. Implement the "${slice}" slice to GREEN. The test-engineer just wrote RED tests; make them pass WITHOUT weakening any test (if a test contradicts the spec, STOP and report — do not edit it silently).\n\nTEST CONTRACT FROM THE TEST-ENGINEER (satisfy exactly):\n${typeof red === 'string' ? red : JSON.stringify(red)}\n\nREAD: openspec/changes/${slice}/tasks.md (implement sections 3+; tick boxes), openspec/changes/${slice}/design.md, openspec/changes/${slice}/specs/*/spec.md, AGENTS.md (module conventions; lib/ framework-free; server components by default, "use client" only when needed; Ukrainian-first calm copy, no exclamation marks; all UI strings via lib/i18n), and .agents/skills/vercel-react-best-practices/SKILL.md + relevant rules/*.md.\n\nKEY GOTCHAS: Next.js 16.2 App Router; a live clock must be hydration-safe (mount-guard placeholder) and clear its interval on unmount; the footer joke must be server-rendered (no hydration mismatch, no Math.random/Date.now in lib); lib/ must have ZERO react/next/DOM imports.\n\nVERIFY and tick tasks.md boxes: \`npm run test:run\` (all green), \`npm run lint\`, \`npx tsc --noEmit\`, \`npm run build\`, \`npx openspec validate ${slice} --strict\`, \`npx openspec validate --all --strict\`. Do NOT run review-slice or archive (the orchestrator does those).\n\nReport: files created/changed, final test/lint/tsc/build/validate results, any contract deviation + why, and which tasks.md boxes you ticked.`,
    { label: `green:${slice}`, phase: `Green:${slice}`, agentType: 'capability-implementer' },
  )
  results.push({ slice, red, green })
}

return { built: results.map((r) => r.slice), results }
