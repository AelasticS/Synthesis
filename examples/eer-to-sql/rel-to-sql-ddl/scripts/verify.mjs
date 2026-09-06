/**
 * The suite's end-to-end chain verification: EER model to rich
 * relational model to SQL DDL in one run, asserting composite primary
 * keys, named ALTER TABLE foreign key constraints, and CREATE INDEX
 * statements in the generated text.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const eerPkgDir = resolve(pkgDir, '..', 'eer-to-relational')
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-ddl-verify-'))
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
  cli(['transformation', 'install', eerPkgDir])
  cli(['transformation', 'install', pkgDir])
  cli(['model', 'import', join(eerPkgDir, 'sample', 'library.tsx'), '--as', 'demo/library'])

  const genDir = join(home, 'generated')
  cli(['transformation', 'run', 'eer-to-relational', 'rel-to-sql-ddl',
    '--in', 'demo/library', '--default-configs', '--out-dir', genDir])

  const sqlFile = readdirSync(genDir).find((f) => f.endsWith('.sql'))
  expect('the chain generates a SQL file', sqlFile !== undefined)
  const sql = sqlFile ? readFileSync(join(genDir, sqlFile), 'utf-8') : ''

  expect('composite primary key down the weak chain',
    sql.includes('PRIMARY KEY (book_id, book_copy_no, no)'))
  expect('named composite foreign key as an ALTER TABLE constraint',
    sql.includes('ALTER TABLE reservation ADD CONSTRAINT fk_reservation_book_copy')
    && sql.includes('FOREIGN KEY (book_id, book_copy_no) REFERENCES book_copy (book_id, no);'))
  expect('the joined subtype constraint references the root',
    sql.includes('ALTER TABLE member ADD CONSTRAINT fk_member_person')
    && sql.includes('REFERENCES person (id);'))
  expect('foreign keys get indexes',
    sql.includes('CREATE INDEX ix_fk_member_person ON member (person_id);'))
  expect('audit columns reach the DDL', sql.includes('createdAt DATE'))
  expect('no inline REFERENCES remain (constraints are separate)',
    !sql.split('ALTER TABLE').at(0).includes('REFERENCES'))

  if (failures > 0) {
    console.error(`rel-to-sql-ddl verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('rel-to-sql-ddl verify: OK (chain from EER to DDL, constraints and indexes asserted)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`rel-to-sql-ddl verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
