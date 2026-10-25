/**
 * The example's verification: beyond the generic smoke, assert the
 * exact outcome on the Company sample. There is a single, fixed
 * behavior (foreign key relationships, camelCase names, auto increment
 * keys), so one run is enough.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-simple-eer-verify-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home, USERPROFILE: home }, stdio: 'pipe' }).toString()

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

  cli(['transformation', 'run', 'simple-eer-to-relational', '--in', 'demo/company',
    '--out', 'demo/out', '--trace', 'demo/tr'])
  const out = read('demo/out')

  expect('entity names are kept in camelCase',
    out.includes('<Table name="Person"') && out.includes('<Table name="Company"'))
  expect('auto increment is on for the keys',
    out.includes('name="personId" isKey={true} isAutoincrement={true}')
    && out.includes('name="companyId" isKey={true} isAutoincrement={true}'))
  expect('the relationship adds no join table',
    !out.includes('<Table name="Employment"'))
  expect('the foreign key column lands in the Person table (a person works in at most one company), nullable, referencing Company',
    /<Table \$refByName="Person">\s*<Column name="CompanyIdFK"[^>]*isForeignKey=\{true\}[^>]*references="Company"[^>]*isNullable=\{true\}/.test(out))
  expect('the trace records the executed rules',
    read('demo/tr').includes('RuleInvocation'))
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
