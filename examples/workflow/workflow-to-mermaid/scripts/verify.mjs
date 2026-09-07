/**
 * The structure view's verification: three samples rendered as
 * nested-subgraph flowcharts in one CLI run without configuration
 * flags. The approval samples assert the basic conventions (a subgraph
 * per composite step with its kind label, chain edges in sequential
 * blocks, the ABSENCE of edges inside a parallel, sanitized ids
 * carrying the authored spaced labels, the inline process recursion);
 * the expense sample asserts the v2 conventions (the choice subgraph
 * with guard-labeled branches and the else label, the loop label, the
 * process invocation as a subroutine shape, two distinct occurrence
 * nodes of one shared definition). A deliberately invalid model then
 * exercises the metamodel's declared constraints through
 * `synth model validate`.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const bpmnPkgDir = resolve(pkgDir, '..', 'workflow-to-bpmn')
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-wf-mmd-verify-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home }, stdio: 'pipe' }).toString()

let failures = 0
const expect = (what, cond) => {
  if (cond) return
  failures += 1
  console.error(`FAIL: ${what}`)
}

try {
  cli(['init'])
  cli(['namespace', 'mk', 'demo'])
  cli(['transformation', 'install', pkgDir])
  cli(['model', 'import', join(bpmnPkgDir, 'sample', 'approval.tsx'), '--as', 'demo/approval'])
  cli(['model', 'import', join(bpmnPkgDir, 'sample', 'reviewed-approval.tsx'), '--as', 'demo/reviewed'])
  cli(['model', 'import', join(bpmnPkgDir, 'sample', 'expense-approval.tsx'), '--as', 'demo/expense'])

  const genDir = join(home, 'generated')
  cli(['transformation', 'run', 'workflow-to-mermaid', '--in', 'demo/approval', '--out-dir', genDir])
  cli(['transformation', 'run', 'workflow-to-mermaid', '--in', 'demo/reviewed', '--out-dir', genDir])
  cli(['transformation', 'run', 'workflow-to-mermaid', '--in', 'demo/expense', '--out-dir', genDir])

  const approval = readFileSync(join(genDir, 'Approval.mmd'), 'utf-8')
  const reviewed = readFileSync(join(genDir, 'ReviewedApproval.mmd'), 'utf-8')
  const expense = readFileSync(join(genDir, 'ExpenseApproval.mmd'), 'utf-8')

  const balanced = (text) =>
    text.split('\n').filter((l) => /^\s*subgraph /.test(l)).length
    === text.split('\n').filter((l) => /^\s*end$/.test(l)).length

  expect('the document opens with the flowchart header',
    approval.split('\n')[0] === 'flowchart TD')
  expect('a process body is an implicit sequence: its top-level steps chain',
    approval.includes('  Write["Write"]') && approval.includes('  Write --> approvals'))
  expect('the parallel is a subgraph labeled with its kind',
    approval.includes('  subgraph approvals["approvals (parallel)"]'))
  expect('a parallel has NO edge between its children',
    !approval.includes('Approve_1 --> Approve_2')
    && !approval.includes('Approve_2 --> Approve_1'))
  expect('ids are sanitized while labels keep the authored spaced names',
    approval.includes('    Approve_1["Approve 1"]')
    && approval.includes('    Approve_2["Approve 2"]'))
  expect('every subgraph closes with end', balanced(approval))

  expect('an inline process is a subgraph labeled with its kind',
    reviewed.includes('  subgraph WriteDocument["WriteDocument (process)"]'))
  expect('an inline process body is implicitly sequential: its steps chain',
    reviewed.includes('    Draft --> ReviewDraft'))
  expect('the enclosing body chains the inline process to its successor',
    reviewed.includes('  WriteDocument --> approvals'))

  expect('a loop is a subgraph labeled with its kind and guard',
    expense.includes('  subgraph loop1["(loop until approved)"]'))
  expect('a process invocation renders as a subroutine shape',
    expense.includes('    ManagerSignoff[["ManagerSignoff"]]'))
  expect('a choice is a subgraph', expense.includes('  subgraph choice1["(choice)"]'))
  expect('a branch subgraph is labeled with its guard',
    expense.includes('    subgraph choice1_b1["amount > 1000"]'))
  expect('the guardless branch is labeled else',
    expense.includes('    subgraph choice1_b2["else"]'))
  expect('one shared definition yields two distinct occurrence nodes',
    expense.includes('      ArchiveHighValue["ArchiveHighValue"]')
    && expense.includes('      ArchiveStandard["ArchiveStandard"]'))
  expect('a branch body is implicitly sequential: its steps chain',
    expense.includes('      NotifyFinance --> ArchiveHighValue'))
  expect('branches carry no edges between one another',
    !expense.includes('choice1_b1 --> choice1_b2'))
  expect('the top-level steps chain through the operators',
    expense.includes('  Submit --> loop1') && expense.includes('  loop1 --> choice1'))

  // ── declared constraints: the validation point ────────────────────
  const validateOut = cli(['model', 'validate', 'demo/expense'])
  expect('model validate runs the declared constraints', validateOut.includes('[ok] declared constraints hold'))

  // a model that renders fine but violates the doctrine three ways: an
  // invocation reading a document whose type is not among the called
  // definition's inputs, a choice with two guardless branches, and a
  // loop without a guard.
  const badPath = join(home, 'invalid.tsx')
  writeFileSync(badPath, `/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
import { WorkflowModel, DocumentType, Task, Process, Document, Choice, Branch, Loop, Invoke } from 'workflow-metamodel'

export const $synth = { kind: 'model', metamodel: 'workflow-metamodel', author: 'verify', version: '0.1.0', description: 'constraint violations on purpose' }

export default (store) => (
  <WorkflowModel name="Invalid" store={store}>
    <DocumentType name="A" />
    <DocumentType name="B" />
    <Task name="T" inputs={[<DocumentType $refByName="A" />]} />
    <Process name="P">
      <Document name="doc" documentType={<DocumentType $refByName="B" />} />
      <Invoke name="callT" activity={<Task $refByName="T" />} reads={[<Document $refByName="doc" />]} />
      <Choice>
        <Branch><Task name="X" /></Branch>
        <Branch><Task name="Y" /></Branch>
      </Choice>
      <Loop kind="while">
        <Task name="Z" />
      </Loop>
    </Process>
  </WorkflowModel>
)
`)
  cli(['model', 'import', badPath, '--as', 'demo/invalid'])
  let constraintFailure = ''
  try {
    cli(['model', 'validate', 'demo/invalid'])
    expect('a violating model fails validation', false)
  } catch (err) {
    constraintFailure = String(err.stdout ?? '') + String(err.stderr ?? '')
  }
  expect('a nonconforming read binding is rejected',
    constraintFailure.includes("Invocation 'callT'")
    && constraintFailure.includes("a read document's type must be among the called definition's declared inputs"))
  expect('a second guardless branch is rejected',
    constraintFailure.includes('at most one branch may omit its guard (the else branch)'))
  expect('a guardless loop is rejected',
    constraintFailure.includes('a loop states the guard its kind tests'))

  if (failures > 0) {
    console.error(`workflow-to-mermaid verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('workflow-to-mermaid verify: OK (three samples drawn as trees, declared constraints exercised)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`workflow-to-mermaid verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
