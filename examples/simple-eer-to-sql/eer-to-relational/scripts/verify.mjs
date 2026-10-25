/**
 * The example's verification: beyond the generic smoke, assert the
 * exact design-space outcomes on the Company sample. Two runs: the
 * default configuration (ForeignKey, CamelCase), and the saved edited
 * configuration (JoinTable, SnakeCase), with the persisted trace
 * checked for the resolutions that produced each result.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-simple-eer-verify-'))
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
  cli(['model', 'import', join(pkgDir, 'sample', 'company.eer.tsx'), '--as', 'demo/company'])

  // ── run 1: the default configuration ──────────────────────────────
  cli(['transformation', 'run', 'simple-eer-to-relational', '--in', 'demo/company',
    '--default-configs', '--out', 'demo/out-default', '--trace', 'demo/tr-default'])
  const def = read('demo/out-default')

  expect('CamelCase default keeps the entity names',
    def.includes('<Table name="Person"') && def.includes('<Table name="Company"'))
  expect('auto increment is on for the keys',
    def.includes('name="personId" isKey={true} isAutoincrement={true}')
    && def.includes('name="companyId" isKey={true} isAutoincrement={true}'))
  expect('the ForeignKey default adds a foreign key column, not a join table',
    def.includes('isForeignKey={true}') && !def.includes('<Table name="Employment"'))
  expect('the default trace records the three choices by default',
    read('demo/tr-default').includes('byDefault={true}'))

  // ── run 2: the saved edited configuration ─────────────────────────
  cli(['model', 'import', join(pkgDir, 'config', 'company.edited-cm.tsx'), '--as', 'demo/cfg-edited',
    '--tx', 'simple-eer-to-relational', '--dependency', 'demo/company'])
  cli(['transformation', 'run', 'simple-eer-to-relational', '--in', 'demo/company',
    '--config', 'demo/cfg-edited', '--out', 'demo/out-edited', '--trace', 'demo/tr-edited'])
  const edited = read('demo/out-edited')

  expect('SnakeCase renames tables and columns',
    edited.includes('<Table name="person"') && edited.includes('name="company_name"'))
  expect('the JoinTable option creates the employment table',
    edited.includes('<Table name="employment"'))
  expect('the join table carries both foreign key columns',
    edited.includes('name="person_id_fk"') && edited.includes('name="company_id_fk"'))
  expect('the edited choice is a Resolution that was not taken by default',
    read('demo/tr-edited').includes('byDefault={false}'))
} catch (err) {
  if (err.stderr) {
    console.error(err.stderr.toString())
  }
  console.error(`simple-eer-to-relational: VERIFY FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}

if (failures > 0) {
  console.error(`simple-eer-to-relational: ${failures} assertion(s) failed`)
  process.exit(1)
}
console.log('simple-eer-to-relational: verify OK')
