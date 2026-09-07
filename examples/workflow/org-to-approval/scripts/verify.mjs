/**
 * The organizational example verified through the real CLI. Three
 * parameterized runs of the same transformation on the same source:
 * Judy at sensitivity 2 (her department's manager and its parent's,
 * no board), Judy at sensitivity 3 (the executive board's parallel
 * appears), and the onward chain to BPMN and Mermaid (the flattened
 * drawing carries the parallel gateway pair). The structure view then
 * draws the PERSISTED sensitivity-3 model, proving the generated
 * model is an ordinary workflow model. Each generated model's header
 * records the verbatim parameter in its generatedBy provenance, and
 * the parameter's error paths (missing, malformed, unknown worker)
 * answer with teaching messages.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-org-approval-verify-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home }, stdio: 'pipe' }).toString()

const modelPath = (ref) => join(home, '.synth', 'models', ...ref.split('/')) + '.tsx'
const read = (ref) => readFileSync(modelPath(ref), 'utf-8')

// oclif wraps error output and prefixes continuation lines; flatten
// before matching substrings.
const failureText = (fn) => {
  try {
    fn()
    return ''
  } catch (err) {
    return (String(err.stdout ?? '') + String(err.stderr ?? '')).replace(/›/g, ' ').replace(/\s+/g, ' ')
  }
}

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
  cli(['transformation', 'install', resolve(pkgDir, '..', 'workflow-to-bpmn')])
  cli(['transformation', 'install', resolve(pkgDir, '..', 'bpmn-to-mermaid')])
  cli(['transformation', 'install', resolve(pkgDir, '..', 'workflow-to-mermaid')])
  cli(['model', 'import', join(pkgDir, 'sample', 'acme.tsx'), '--as', 'demo/acme'])

  const validateOut = cli(['model', 'validate', 'demo/acme'])
  expect('the sample passes the declared constraints (managers and top unit set)',
    validateOut.includes('[ok] declared constraints hold'))

  // ── run 1: Judy at sensitivity 2, manager approvals only ──────────
  cli(['transformation', 'run', 'org-to-approval', '--in', 'demo/acme',
    '--out', 'demo/approval2', '--param', '{"worker":"Judy","sensitivity":2}'])
  const two = read('demo/approval2')

  expect('the process is named for the worker',
    two.includes('<Process name="ApprovalForJudy">'))
  expect('the worker writes the document',
    two.includes('<Task name="WriteDocument" performer="Judy" />'))
  expect("level 1 is Engineering's manager",
    two.includes('<Task name="ApproveByGrace" performer="Grace" />'))
  expect("level 2 is the Technology Division's manager",
    two.includes('<Task name="ApproveByDave" performer="Dave" />'))
  expect('sensitivity 2 does not reach the board', !two.includes('<Parallel'))
  expect('the implicit sequence orders writing before the approvals, bottom up',
    two.indexOf('WriteDocument') < two.indexOf('ApproveByGrace')
    && two.indexOf('ApproveByGrace') < two.indexOf('ApproveByDave'))
  expect('the header records the verbatim parameter',
    two.includes(`param: '{"worker":"Judy","sensitivity":2}'`))

  // ── run 2: sensitivity 3, the board's parallel appears ────────────
  cli(['transformation', 'run', 'org-to-approval', '--in', 'demo/acme',
    '--out', 'demo/approval3', '--param', '{"worker":"Judy","sensitivity":3}'])
  const three = read('demo/approval3')

  expect('the manager approvals stay',
    three.includes('<Task name="ApproveByGrace" performer="Grace" />')
    && three.includes('<Task name="ApproveByDave" performer="Dave" />'))
  expect('the board approves as a parallel block',
    three.includes('<Parallel name="Executive Board approvals">'))
  expect('every board member gets an approval task',
    three.includes('<Task name="ApproveByAlice" performer="Alice" />')
    && three.includes('<Task name="ApproveByBob" performer="Bob" />')
    && three.includes('<Task name="ApproveByCarol" performer="Carol" />'))
  expect('the header records the verbatim parameter',
    three.includes(`param: '{"worker":"Judy","sensitivity":3}'`))

  // ── the parameter's error paths ───────────────────────────────────
  expect('a run without the parameter teaches the expected form',
    failureText(() => cli(['transformation', 'run', 'org-to-approval', '--in', 'demo/acme',
      '--out', 'demo/never']))
      .includes(`pass --param '{"worker":"<name>","sensitivity":<levels>}'`))
  expect('a malformed sensitivity is rejected with the expectation',
    failureText(() => cli(['transformation', 'run', 'org-to-approval', '--in', 'demo/acme',
      '--out', 'demo/never', '--param', '{"worker":"Judy","sensitivity":"two"}']))
      .includes('sensitivity must be a positive integer'))
  expect('an unknown worker is rejected with the known workers listed',
    failureText(() => cli(['transformation', 'run', 'org-to-approval', '--in', 'demo/acme',
      '--out', 'demo/never', '--param', '{"worker":"Zed","sensitivity":2}']))
      .includes("no worker named 'Zed'; it knows: Alice, Bob, Carol, Dave, Grace, Judy"))

  // ── run 3: the onward chain, org to BPMN to the flattened drawing ─
  const gen = join(home, 'gen')
  cli(['transformation', 'run', 'org-to-approval', 'workflow-to-bpmn', 'bpmn-to-mermaid',
    '--in', 'demo/acme', '--param', '{"worker":"Judy","sensitivity":3}', '--out-dir', gen])
  const flat = readFileSync(join(gen, 'ApprovalForJudy_bpmn.mmd'), 'utf-8')

  expect('the flattened drawing is a flowchart', flat.startsWith('flowchart TD'))
  expect('the board parallel flattens to a gateway pair with derived roles',
    flat.includes('ExecutiveBoardapprovals_split{"parallel split"}')
    && flat.includes('ExecutiveBoardapprovals_join{"parallel join"}'))
  expect('the split fans out to every member approval',
    flat.includes('ExecutiveBoardapprovals_split --> ApproveByAlice')
    && flat.includes('ExecutiveBoardapprovals_split --> ApproveByBob')
    && flat.includes('ExecutiveBoardapprovals_split --> ApproveByCarol'))
  expect('every member approval converges on the join',
    flat.includes('ApproveByAlice --> ExecutiveBoardapprovals_join')
    && flat.includes('ApproveByBob --> ExecutiveBoardapprovals_join')
    && flat.includes('ApproveByCarol --> ExecutiveBoardapprovals_join'))
  expect('the manager approvals chain into the parallel',
    flat.includes('WriteDocument --> ApproveByGrace')
    && flat.includes('ApproveByGrace --> ApproveByDave')
    && flat.includes('ApproveByDave --> ExecutiveBoardapprovals_split'))

  // ── the structure view over the persisted sensitivity-3 model ─────
  cli(['transformation', 'run', 'workflow-to-mermaid', '--in', 'demo/approval3', '--out-dir', gen])
  const tree = readFileSync(join(gen, 'ApprovalForJudy.mmd'), 'utf-8')

  expect('the parallel is a subgraph labeled with the board and its kind',
    tree.includes('subgraph Executive_Board_approvals["Executive Board approvals (parallel)"]'))
  expect('the member approvals sit side by side, no edges between them',
    tree.includes('ApproveByAlice["ApproveByAlice"]')
    && !tree.includes('ApproveByAlice --> ApproveByBob'))
  expect('the process chains into the parallel subgraph',
    tree.includes('ApproveByDave --> Executive_Board_approvals'))

  if (failures > 0) {
    console.error(`org-to-approval verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('org-to-approval verify: OK (two sensitivities, provenance, error paths, chain and structure view)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`org-to-approval verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
