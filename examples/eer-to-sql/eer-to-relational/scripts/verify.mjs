/**
 * The flagship's verification: beyond the generic smoke, assert the
 * exact design-space outcomes. Two runs on the Library sample: the
 * default configuration, and a patched configuration (TablePerClass,
 * the ForeignKey option for borrows, one table opted out of auditing),
 * with the persisted trace checked for the resolutions that produced
 * each result.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-flagship-verify-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home }, stdio: 'pipe' }).toString()

const modelPath = (ref) => join(home, '.synth', 'models', ...ref.split('/')) + '.tsx'
const read = (ref) => readFileSync(modelPath(ref), 'utf-8')

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
  cli(['model', 'import', join(pkgDir, 'sample', 'library.tsx'), '--as', 'demo/library'])

  // ── run 1: the default configuration ──────────────────────────────
  cli(['transformation', 'run', 'eer-to-relational', '--in', 'demo/library',
    '--default-configs', '--out', 'demo/out', '--trace', 'demo/tr'])
  const out = read('demo/out')

  expect('kernels and the abstract root become tables (JoinedTables default keeps person)',
    out.includes('<Table name="book"') && out.includes('<Table name="person"'))
  expect('joined subtype tables carry the root key copy as PK and FK',
    out.includes('<Table name="member"') && out.includes('<ForeignKey name="fk_member_person"'))
  expect('the weak chain produces a composite foreign key to book_copy',
    out.includes('<ForeignKey name="fk_reservation_book_copy"')
    && out.includes('$refByName="book_copy/book_id"')
    && out.includes('$refByName="book_copy/copy_no"'))
  expect('M:N becomes a join table', out.includes('<Table name="written_by"'))
  expect('1:N defaults to a join table', out.includes('<Table name="borrows"'))
  expect('auditing defaults on: audit columns appear',
    out.includes('book_createdBy') && out.includes('book_createdAt'))
  expect('every foreign key gets an index by default', out.includes('<Index name="ix_fk_member_person"'))
  expect('no legacy flat foreign-key marks', !out.includes('isForeignKey={true}'))

  const tr = read('demo/tr')
  expect('trace names executed rules', tr.includes('rule="kernelToTable"') && tr.includes('rule="joinedSubtypeTable"'))
  expect('trace records the audit default on the tableColumns entries',
    tr.includes('issue="TableAuditing" option="AuditColumns" byDefault={true}'))
  expect('trace records the hierarchy strategy on the hierarchy entry',
    tr.includes('issue="InheritanceStrategy" option="JoinedTables"'))
  expect('trace records the global naming convention once',
    tr.split('issue="NamingConvention"').length === 2)

  // ── run 2: a patched configuration ────────────────────────────────
  cli(['config', 'init', 'eer-to-relational', '--for', 'demo/library', '--out', 'demo/cfg'])
  const cfgPath = modelPath('demo/cfg')
  let cfg = readFileSync(cfgPath, 'utf-8')
  // order matters: JoinedTables must be rewritten before JoinTable
  cfg = cfg.replaceAll('JoinedTables', 'TablePerClass')
  cfg = cfg.replaceAll('JoinTable', 'ForeignKey')
  writeFileSync(cfgPath, cfg)

  cli(['transformation', 'run', 'eer-to-relational', '--in', 'demo/library',
    '--config', 'demo/cfg', '--out', 'demo/out2', '--trace', 'demo/tr2'])
  const out2 = read('demo/out2')

  expect('an abstract root under TablePerClass gets no table', !out2.includes('<Table name="person"'))
  expect('TablePerClass copies the root columns into the subtype table',
    out2.includes('<Table name="member"') && out2.includes('person_name'))
  expect('the ForeignKey option grafts the borrows key into book_copy',
    out2.includes('<ForeignKey name="fk_book_copy_borrows"') && out2.includes('$refByName="member/person_id"'))
  expect('no join table for borrows under the ForeignKey option', !out2.includes('<Table name="borrows"'))

  const tr2 = read('demo/tr2')
  expect('trace records the explicit strategy with a choice reference',
    tr2.includes('issue="InheritanceStrategy" option="TablePerClass"') && !tr2.includes('option="TablePerClass" byDefault'))

  if (failures > 0) {
    console.error(`eer-to-relational verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('eer-to-relational verify: OK (default and patched-configuration runs, outputs and traces)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`eer-to-relational verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
