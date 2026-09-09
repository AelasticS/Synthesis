/**
 * The flowchart view's verification: three samples rendered as classic
 * flowcharts in one CLI run without configuration flags. The approval
 * sample asserts the basic conventions (the start stadium wired to the
 * first step, performer-free task boxes with sanitized ids carrying
 * the authored spaced labels, the parallel as a fork bar fanning out
 * and a join bar converging, the final exit wired to the end stadium);
 * the reviewed sample asserts the inline process expanding into its
 * steps without a trace of its own name; the expense sample asserts
 * the v2 conventions (the choice diamond with guard-labeled edges and
 * the else edge, the repeatUntil guard diamond with its no back edge
 * and yes exit, the process invocation as a subroutine box carrying
 * the called definition's performer, two distinct occurrence boxes of
 * one shared definition carrying their effective performers, the
 * overriding occurrence its own and the other the definition's
 * default, branch exits
 * reconverging without a merge node). A deliberately invalid model
 * then exercises the metamodel's declared constraints through
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

  expect('the document opens with the flowchart header',
    approval.split('\n')[0] === 'flowchart TD')
  expect('the start stadium opens the chart, wired to the first step',
    approval.includes('  start_node(["start"])') && approval.includes('  start_node --> Write'))
  expect('a performer-free task is a plain box',
    approval.includes('  Write["Write"]') && !approval.includes('Write<br/>'))
  expect('the parallel is a fork bar and a join bar',
    approval.includes('  approvals_fork@{ shape: fork }')
    && approval.includes('  approvals_join@{ shape: join }'))
  expect('the fork fans out to every child',
    approval.includes('  approvals_fork --> Approve_1')
    && approval.includes('  approvals_fork --> Approve_2'))
  expect('every child converges on the join',
    approval.includes('  Approve_1 --> approvals_join')
    && approval.includes('  Approve_2 --> approvals_join'))
  expect('a parallel has NO edge between its children',
    !approval.includes('Approve_1 --> Approve_2')
    && !approval.includes('Approve_2 --> Approve_1'))
  expect('ids are sanitized while labels keep the authored spaced names',
    approval.includes('  Approve_1["Approve 1"]')
    && approval.includes('  Approve_2["Approve 2"]'))
  expect('the final exit wires to the end stadium',
    approval.includes('  end_node(["end"])') && approval.includes('  approvals_join --> end_node'))

  expect('an inline process expands inline into its steps',
    reviewed.includes('  Draft --> ReviewDraft'))
  expect("the inline process's own name does not appear in the drawing",
    !reviewed.includes('WriteDocument'))
  expect('the enclosing body wires through the expanded steps',
    reviewed.includes('  start_node --> Draft')
    && reviewed.includes('  ReviewDraft --> approvals_fork'))

  expect("a process invocation renders as a subroutine box with the called definition's performer",
    expense.includes('  ManagerSignoff[["ManagerSignoff<br/>(Manager)"]]'))
  expect('a repeatUntil runs the body before the guard diamond',
    expense.includes('  loop1{"approved?"}') && expense.includes('  ManagerSignoff --> loop1'))
  expect('the repeatUntil no edge returns to the body',
    expense.includes('  loop1 -->|no| ManagerSignoff'))
  expect('the repeatUntil yes edge is the exit',
    expense.includes('  loop1 -->|yes| choice1'))
  expect('an unnamed choice with one guard takes that guard as its question',
    expense.includes('  choice1{"amount > 1000?"}'))
  expect("a branch's outgoing edge is labeled with its guard",
    expense.includes('  choice1 -->|amount > 1000| NotifyFinance'))
  expect("the guardless branch's edge is labeled else",
    expense.includes('  choice1 -->|else| ArchiveStandard'))
  expect('one shared definition yields two distinct occurrence boxes',
    expense.includes('  ArchiveHighValue[["ArchiveHighValue<br/>')
    && expense.includes('  ArchiveStandard[["ArchiveStandard<br/>'))
  expect("an invocation's own performer overrides the definition's on its occurrence box",
    expense.includes('  ArchiveHighValue[["ArchiveHighValue<br/>(Auditor)"]]'))
  expect("a non-overriding occurrence shows the definition's default performer",
    expense.includes('  ArchiveStandard[["ArchiveStandard<br/>(Clerk)"]]'))
  expect('a branch body is implicitly sequential: its steps chain',
    expense.includes('  NotifyFinance --> ArchiveHighValue'))
  expect('all branch exits reconverge on what comes next, no merge node',
    expense.includes('  ArchiveHighValue --> end_node')
    && expense.includes('  ArchiveStandard --> end_node'))

  // ── declared constraints: the validation point ────────────────────
  const validateOut = cli(['model', 'validate', 'demo/expense'])
  expect('model validate runs the declared constraints', validateOut.includes('[ok] declared constraints hold'))

  // a model that renders fine but violates the doctrine four ways: an
  // invocation reading a document whose type is not among the called
  // definition's inputs, a choice with two guardless branches, a loop
  // without a guard, and an invocation calling an inline step instead
  // of a model-level definition.
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
      <Invoke name="callX" activity={<Task $refByName="X" />} />
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
  expect('an invocation of an inline step is rejected',
    constraintFailure.includes("Invocation 'callX'")
    && constraintFailure.includes('an invocation calls a model-level definition, not an inline step'))

  if (failures > 0) {
    console.error(`workflow-to-mermaid verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('workflow-to-mermaid verify: OK (three samples drawn as flowcharts, declared constraints exercised)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`workflow-to-mermaid verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
