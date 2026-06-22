export const meta = {
  name: 'review-slice',
  description: 'Lean per-slice adversarial review of a scoped diff (correctness + spec-compliance), each finding refute-verified, then persist review-findings.json into the change folder. Security gets a dedicated global pass at G7. Edit SLICE/BASE per slice.',
  phases: [
    { title: 'Find', detail: 'code-reviewer + spec-compliance-auditor on the diff' },
    { title: 'Verify', detail: 'adversarial refutation of each finding' },
    { title: 'Persist', detail: 'write review-findings.json' },
  ],
}

// ---- EDIT THESE TWO PER SLICE ----
const SLICE = 'add-animated-bg'
const BASE = 'b5e9736'
// ----------------------------------
const HEAD = 'HEAD'

const FOCUS =
  'Keyless client app, no DB/auth/cookies (ADR-0001) — do NOT raise database/authz/session/tenant findings. ' +
  'Only review the BASE..HEAD diff for THIS slice; ignore unrelated uncommitted files. ' +
  'Focus: lib/ purity (TC-PURE-01, no react/next/DOM), calm inline error-surface (never 500/blank), ' +
  'i18n completeness + no exclamation marks, Next 16 async searchParams/dynamic-ssr-false correctness, ' +
  'accessibility (visible focus, accessible names, no empty named elements), hydration safety, ' +
  'Open-Meteo exact field names, and the slice spec scenarios.'

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'file', 'severity', 'evidence', 'suggestion'],
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { enum: ['critical', 'major', 'minor'] },
          evidence: { type: 'string' },
          suggestion: { type: 'string' },
          confidence: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'reasoning'],
  properties: { refuted: { type: 'boolean' }, reasoning: { type: 'string' } },
}

const diffInstruction = `Review the changes in \`git diff ${BASE}..${HEAD}\` (run that command yourself; also read the surrounding context of changed files and the slice spec under openspec/changes/${SLICE}/specs/).`

const DIMENSIONS = [
  {
    key: 'correctness',
    agentType: 'code-reviewer',
    prompt: `${diffInstruction}\nScope: ${SLICE}. ${FOCUS}\nReview for correctness, error handling (any user-input path that can throw raw / 500, silent failures, stale state), framework-version correctness (Next 16.2 App Router), data/round-trip integrity, accessibility, and maintainability. Return structured findings only (real defects in the diff; not style nitpicks, not out-of-scope security).`,
  },
  {
    key: 'spec-compliance',
    agentType: 'spec-compliance-auditor',
    prompt: `${diffInstruction}\nScope: ${SLICE}. ${FOCUS}\nAudit the implementation against openspec/changes/${SLICE}/specs/ requirements and scenarios: missing/partial/contradicted scenarios, undocumented scope drift, ticked tasks without artifacts, FR coverage. Note that some browser/visual scenarios (responsive breakpoints, AA contrast, no-cookies, JS budget) are verified via browser MCP at G5/G6 per TC-STACK-05 — flag only if the implementation makes them impossible. Return structured findings only.`,
  },
]

phase('Find')
const found = await parallel(
  DIMENSIONS.map((d) => () =>
    agent(d.prompt, { label: `find:${d.key}`, phase: 'Find', schema: FINDINGS_SCHEMA, agentType: d.agentType, effort: 'high' })
      .then((r) => (r?.findings ?? []).map((f) => ({ ...f, dimension: d.key }))),
  ),
)
const seen = new Set()
const deduped = []
for (const f of found.filter(Boolean).flat()) {
  const key = `${f.file}:${f.line ?? 0}:${f.title.toLowerCase().slice(0, 60)}`
  if (!seen.has(key)) { seen.add(key); deduped.push(f) }
}
log(`${deduped.length} unique findings`)

phase('Verify')
const verified = await parallel(
  deduped.map((f) => () =>
    agent(
      `Adversarially verify this review finding. Read the actual code at the cited location and its callers/spec. Try hard to REFUTE it (wrong file, guarded elsewhere, unreachable, framework handles it, out-of-scope per the keyless architecture, or a browser/visual scenario deferred to G6). Default refuted=true if you cannot positively confirm a real in-diff defect.\n\nFinding: ${JSON.stringify(f)}`,
      { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT_SCHEMA, effort: 'high' },
    ).then((v) => ({ ...f, verdict: v && !v.refuted ? 'confirmed' : 'rejected', verifierNote: v?.reasoning })),
  ),
)
const confirmed = verified.filter(Boolean).filter((f) => f.verdict === 'confirmed')
const rejected = verified.filter(Boolean).filter((f) => f.verdict === 'rejected')
log(`confirmed: ${confirmed.length}, rejected: ${rejected.length}`)

phase('Persist')
const dims = {}
for (const d of DIMENSIONS) dims[d.key] = { confirmed: 0, rejected: 0 }
for (const f of verified.filter(Boolean)) if (dims[f.dimension]) dims[f.dimension][f.verdict] += 1
const evidence = {
  generatedBy: 'review-slice',
  scope: SLICE,
  change: SLICE,
  baseRef: BASE,
  headRef: HEAD,
  dimensions: dims,
  confirmed: confirmed.map((f) => ({ title: f.title, file: f.file, line: f.line ?? null, severity: f.severity, suggestion: f.suggestion })),
  clean: confirmed.length === 0,
  generatedAt: 'WRITER_FILL_ISO_UTC',
}
await agent(
  `Persist review evidence. Stamp the real current UTC time (ISO 8601 via \`date -u +%Y-%m-%dT%H:%M:%SZ\`) where you see WRITER_FILL_ISO_UTC. Create parent dirs if needed. Write EXACTLY this JSON (byte-for-byte except the timestamp) to \`openspec/changes/${SLICE}/review-findings.json\`:\n\n\`\`\`json\n${JSON.stringify(evidence, null, 2)}\n\`\`\`\nConfirm the path written.`,
  { label: `persist:${SLICE}`, phase: 'Persist' },
)

return { slice: SLICE, confirmed, rejected, clean: confirmed.length === 0, evidence: `openspec/changes/${SLICE}/review-findings.json` }
