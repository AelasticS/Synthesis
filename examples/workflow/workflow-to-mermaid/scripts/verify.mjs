/**
 * The structure view's verification: the suite's two approval samples
 * rendered as nested-subgraph flowcharts in one CLI run without
 * configuration flags, asserting the subgraph per composite activity
 * with its kind label, the chain edges inside sequential blocks, the
 * ABSENCE of edges inside a parallel, the sanitized ids carrying the
 * authored spaced labels, and the recursion into a sub-process body.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
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

  const genDir = join(home, 'generated')
  cli(['transformation', 'run', 'workflow-to-mermaid', '--in', 'demo/approval', '--out-dir', genDir])
  cli(['transformation', 'run', 'workflow-to-mermaid', '--in', 'demo/reviewed', '--out-dir', genDir])

  const approval = readFileSync(join(genDir, 'Approval.mmd'), 'utf-8')
  const reviewed = readFileSync(join(genDir, 'ReviewedApproval.mmd'), 'utf-8')

  expect('the document opens with the flowchart header',
    approval.split('\n')[0] === 'flowchart TD')
  expect('the main sequence is a subgraph labeled with its kind',
    approval.includes('  subgraph main["main (sequence)"]'))
  expect('consecutive sequence children chain with an edge, subgraph ids included',
    approval.includes('    Write --> approvals'))
  expect('the parallel is a subgraph labeled with its kind',
    approval.includes('    subgraph approvals["approvals (parallel)"]'))
  expect('a parallel has NO edge between its children',
    !approval.includes('Approve_1 --> Approve_2')
    && !approval.includes('Approve_2 --> Approve_1'))
  expect('ids are sanitized while labels keep the authored spaced names',
    approval.includes('      Approve_1["Approve 1"]')
    && approval.includes('      Approve_2["Approve 2"]'))
  expect('every subgraph closes with end',
    approval.trimEnd().endsWith('end'))

  expect('a sub-process is a subgraph labeled with its kind',
    reviewed.includes('    subgraph WriteDocument["WriteDocument (sub-process)"]'))
  expect('a sub-process body is implicitly sequential: its children chain',
    reviewed.includes('      Draft --> ReviewDraft'))
  expect('the enclosing sequence chains the sub-process to its successor',
    reviewed.includes('    WriteDocument --> approvals'))

  if (failures > 0) {
    console.error(`workflow-to-mermaid verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('workflow-to-mermaid verify: OK (both approval samples drawn as trees, every convention asserted)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`workflow-to-mermaid verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
