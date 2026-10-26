/**
 * The model expression samples verified through the real CLI. Each of
 * model-expression.tsx (one literal with creation, computation and
 * reference), configurable-approval.tsx (a model template) and
 * generic-approval.tsx (a higher-order model template) is imported and
 * validated, then transformed to BPMN. The import stores the source as
 * written, so the evaluated elements (names and counts) are checked in
 * the BPMN result, where every workflow step appears as a node.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-workflow-to-bpmn-verify-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home, USERPROFILE: home }, stdio: 'pipe' }).toString()

const modelPath = (ref) => join(home, '.synth', 'models', ...ref.split('/')) + '.tsx'
const read = (ref) => readFileSync(modelPath(ref), 'utf-8')
const count = (text, needle) => text.split(needle).length - 1
// A BPMN flow lists its source node, then its target node.
const flows = (text, from, to) =>
  new RegExp(`<Node \\$refByName="${from}" />\\s*<Node \\$refByName="${to}" />`).test(text)

let failures = 0
const expect = (what, cond) => {
  if (cond) return
  failures += 1
  console.error(`FAIL: ${what}`)
}

// Import and validate a sample, transform it to BPMN, check the result.
const sample = (file, ref, check) => {
  cli(['model', 'import', join(pkgDir, 'sample', file), '--as', ref])
  expect(`${file} validates`, cli(['model', 'validate', ref]).includes(`Model ${ref} is valid`))
  cli(['transformation', 'run', 'workflow-to-bpmn', '--in', ref, '--out', `${ref}-bpmn`])
  check(read(`${ref}-bpmn`))
}

try {
  cli(['init'])
  cli(['namespace', 'mk', 'demo'])
  cli(['transformation', 'install', pkgDir])

  // ── one literal: creation, computation and reference ──────────────
  sample('model-expression.tsx', 'demo/model-expression', (m) => {
    expect('computation: the process is named from the variable',
      m.includes('<Process store={store} name="DocumentApproval_bpmn">'))
    expect('the proposal is written first', m.includes('<Task name="WriteProposal" />'))
    expect('computation: two approval tasks generated in the parallel',
      m.includes('<Gateway name="approvals_split" kind="parallel" />')
      && m.includes('<Task name="Approve1" />') && m.includes('<Task name="Approve2" />')
      && !m.includes('Approve3'))
    expect('reference: the invocation embeds the model-level Publishing process',
      m.includes('<SubProcess name="Publishing">')
      && m.includes('<Task name="Publishing_Format" />') && m.includes('<Task name="Publishing_Publish" />'))
    expect('the parallel flows into the publishing step',
      flows(m, 'approvals_join', 'Publishing'))
    expect('five tasks in all', count(m, '<Task ') === 5)
  })

  // ── a model template ──────────────────────────────────────────────
  sample('configurable-approval.tsx', 'demo/configurable-approval', (m) => {
    expect('the process is named from the document', m.includes('<Process store={store} name="ContractApproval_bpmn">'))
    expect('the document is written first', m.includes('<Task name="WriteContract" />'))
    expect('mode parallel: the approvals are a parallel split and join',
      m.includes('<Gateway name="approvals_split" kind="parallel" />')
      && m.includes('<Gateway name="approvals_join" kind="parallel" />'))
    expect('three approvers: three approval tasks',
      m.includes('<Task name="Approve3" />') && !m.includes('Approve4') && count(m, '<Task ') === 4)
  })

  // ── a higher-order model template ─────────────────────────────────
  sample('generic-approval.tsx', 'demo/generic-approval', (m) => {
    expect('the process is named from the document', m.includes('<Process store={store} name="ContractApproval_bpmn">'))
    expect('the writing step is the two-step template: draft, then final',
      m.includes('<Task name="Draft" />') && m.includes('<Task name="Final" />')
      && flows(m, 'Draft', 'Final'))
    expect('mode parallel, two approvers',
      m.includes('<Gateway name="approvals_split" kind="parallel" />')
      && m.includes('<Task name="Approve2" />') && !m.includes('Approve3'))
    expect('four tasks in all', count(m, '<Task ') === 4)
  })

  if (failures > 0) {
    console.error(`workflow-to-bpmn verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('workflow-to-bpmn verify: OK (model expression, model template and higher-order template samples)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`workflow-to-bpmn verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
