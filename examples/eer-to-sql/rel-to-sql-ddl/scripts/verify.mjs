/**
 * The suite's end-to-end chain verification: EER model to rich
 * relational model to SQL DDL in one run, asserting composite primary
 * keys, named ALTER TABLE foreign key constraints, and CREATE INDEX
 * statements in the generated text.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
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

  // ── declared relational constraints: the validation point ─────────
  cli(['model', 'import', join(pkgDir, 'sample', 'library-db.tsx'), '--as', 'demo/librarydb'])
  const vOut = cli(['model', 'validate', 'demo/librarydb'])
  expect('model validate runs the relational constraints', vOut.includes('[ok] declared constraints hold'))

  // a model that renders fine but names columns across table borders
  const badPath = join(home, 'invalid-db.tsx')
  writeFileSync(badPath, `/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
import { RelSchema, Table, Column, ForeignKey, ForeignKeyColumn, PrimaryKey } from 'relational-metamodel'

export const $synth = { kind: 'model', metamodel: 'relational-metamodel', author: 'verify', version: '0.1.0', description: 'membership violations on purpose' }

export default (store) => (
  <RelSchema name="InvalidDb" store={store}>
    <Table name="a">
      <Column name="id" type="INTEGER" isNullable={false} isAutoincrement={false} />
      <PrimaryKey name="pk_a"><Column $refByName="id" /></PrimaryKey>
    </Table>
    <Table name="b">
      <Column name="x" type="INTEGER" isNullable={false} isAutoincrement={false} />
      {/* names another table's column as its own key */}
      <PrimaryKey name="pk_b"><Column $refByName="a/id" /></PrimaryKey>
      {/* the fk column belongs to table a, not to b */}
      <ForeignKey name="fk_b_a" isUnique={false} referencedTable={<Table $refByName="a" />}>
        <ForeignKeyColumn name="p1">
          <Column $refByName="a/id" />
          <Column $refByName="a/id" />
        </ForeignKeyColumn>
      </ForeignKey>
    </Table>
  </RelSchema>
)
`)
  cli(['model', 'import', badPath, '--as', 'demo/invalid-db'])
  let relFailure = ''
  try {
    cli(['model', 'validate', 'demo/invalid-db'])
    expect('a violating relational model fails validation', false)
  } catch (err) {
    relFailure = String(err.stdout ?? '') + String(err.stderr ?? '')
  }
  expect('a primary key over a foreign table column is rejected',
    relFailure.includes('column of the owning table'))
  expect('a foreign key column from another table is rejected',
    relFailure.includes('belong to the owning table'))

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
