/**
 * The diagram view's verification: the suite's Library sample rendered
 * as a Mermaid erDiagram in one CLI run without configuration flags,
 * asserting the attribute blocks (PK markers, optionality comments,
 * composite flattening, user-defined domain names) and every line
 * convention (dashed ordinary relationships, solid weak and
 * aggregation lines, dashed one-to-one is-a lines).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const eerPkgDir = resolve(pkgDir, '..', 'eer-to-relational')
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-mmd-verify-'))
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
  cli(['model', 'import', join(eerPkgDir, 'sample', 'library.tsx'), '--as', 'demo/library'])

  const genDir = join(home, 'generated')
  cli(['transformation', 'run', 'eer-to-mermaid-er', '--in', 'demo/library', '--out-dir', genDir])

  const mmdFile = readdirSync(genDir).find((f) => f.endsWith('.mmd'))
  expect('the run generates a .mmd file', mmdFile !== undefined)
  const mmd = mmdFile ? readFileSync(join(genDir, mmdFile), 'utf-8') : ''

  expect('the document opens with the erDiagram header', mmd.split('\n')[0] === 'erDiagram')
  expect('a kernel block carries the PK marker and the optionality comment',
    mmd.includes('  Book {')
    && mmd.includes('    number id PK')
    && mmd.includes('    string title "optional"'))
  expect('a composite attribute flattens one level to parent_component lines',
    mmd.includes('    string address_street') && mmd.includes('    string address_city'))
  expect('a user-defined domain keeps its name as the type word',
    mmd.includes('    Money salary'))
  expect('subtypes get attribute blocks like any entity',
    mmd.includes('  Reviewer {') && mmd.includes('  Staff {'))
  expect('weak identification is a solid line down the chain',
    mmd.includes('  Book ||--o{ BookCopy : copyOf')
    && mmd.includes('  BookCopy ||--o{ Reservation : reservedAs'))
  expect('a 1:N relationship is dashed with per-role glyphs',
    mmd.includes('  Member |o..o{ BookCopy : borrows'))
  expect('an M:N relationship is dashed with zero-or-more on both sides',
    mmd.includes('  Author }o..o{ Book : writtenBy'))
  expect('aggregation participation is a solid line per participant',
    mmd.includes('  BookCopy ||--o| Loan : ofCopy')
    && mmd.includes('  Member ||--o{ Loan : byMember'))
  expect('is-a is a dashed one-to-one line per subtype',
    mmd.includes('  Member ||..|| Person : personRoles')
    && mmd.includes('  Staff ||..|| Person : personRoles')
    && mmd.includes('  Reviewer ||..|| Author : authorEngagement')
    && mmd.includes('  Editor ||..|| Author : authorEngagement'))

  if (failures > 0) {
    console.error(`eer-to-mermaid-er verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('eer-to-mermaid-er verify: OK (the Library rendered as an erDiagram, every line convention asserted)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`eer-to-mermaid-er verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
