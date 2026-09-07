/**
 * The graph rendering verified through the real CLI: the chain from
 * the Approval workflow model, asserting the per-kind node shapes and
 * the DERIVED gateway roles (the role is not stored in the model, it
 * comes from the gateway's flow degrees; the diamond must say so).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const wfPkgDir = resolve(pkgDir, '..', 'workflow-to-bpmn')
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-bpmn-mermaid-verify-'))
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
  cli(['transformation', 'install', wfPkgDir])
  cli(['transformation', 'install', pkgDir])
  cli(['model', 'import', join(wfPkgDir, 'sample', 'approval.tsx'), '--as', 'demo/approval'])

  const gen = join(home, 'gen')
  cli(['transformation', 'run', 'workflow-to-bpmn', 'bpmn-to-mermaid',
    '--in', 'demo/approval', '--out-dir', gen])
  const mmd = readFileSync(join(gen, 'Approval_bpmn.mmd'), 'utf-8')

  expect('the document is a flowchart', mmd.startsWith('flowchart TD'))
  expect('events render as stadium shapes',
    mmd.includes('start(["start"])') && mmd.includes('end_node(["end"])'))
  expect('tasks render as boxes', mmd.includes('Write["Write"]'))
  expect('the splitting gateway is labeled with its derived role',
    mmd.includes('approvals_split{"parallel split"}'))
  expect('the joining gateway is labeled with its derived role',
    mmd.includes('approvals_join{"parallel join"}'))
  expect('the split fans out to both approvals',
    mmd.includes('approvals_split --> Approve1') && mmd.includes('approvals_split --> Approve2'))
  expect('both approvals converge on the join',
    mmd.includes('Approve1 --> approvals_join') && mmd.includes('Approve2 --> approvals_join'))

  if (failures > 0) {
    console.error(`bpmn-to-mermaid verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('bpmn-to-mermaid verify: OK (the chain drawn with derived gateway roles)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`bpmn-to-mermaid verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
