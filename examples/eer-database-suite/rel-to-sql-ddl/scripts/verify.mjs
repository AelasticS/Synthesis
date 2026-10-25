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
  cli(['model', 'import', join(eerPkgDir, 'sample', 'library.eer.tsx'), '--as', 'demo/library'])

  const genDir = join(home, 'generated')
  cli(['transformation', 'run', 'eer-to-relational', 'rel-to-sql-ddl',
    '--in', 'demo/library', '--default-configs', '--out-dir', genDir])

  const sqlFile = readdirSync(genDir).find((f) => f.endsWith('.sql') && !f.endsWith('-triggers.sql'))
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
  expect('disconnect rules reach the constraints natively',
    sql.includes('REFERENCES book_copy (book_id, no) ON DELETE CASCADE ON UPDATE CASCADE;'))
  expect('inline domain handling puts default and check on the column',
    sql.includes('salary INTEGER DEFAULT 0 NOT NULL CHECK (salary >= 0)'))
  const triggersFile = readdirSync(genDir).find((f) => f.endsWith('-triggers.sql'))
  expect('the connect rule lands in the triggers document', triggersFile !== undefined
    && readFileSync(join(genDir, triggersFile), 'utf-8').includes('trg_fk_borrows_borrower_connect'))
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

  // ── the dialect presets, authored by extension ────────────────────
  cli(['model', 'import', join(pkgDir, 'presets', 'postgres.tsx'), '--as', 'demo/cfg-pg', '--tx', 'rel-to-sql-ddl'])
  cli(['model', 'import', join(pkgDir, 'presets', 'oracle.tsx'), '--as', 'demo/cfg-ora', '--tx', 'rel-to-sql-ddl'])

  // the m2m half persisted once, then one DDL run per preset
  cli(['transformation', 'run', 'eer-to-relational', '--in', 'demo/library', '--default-configs', '--out', 'demo/rel'])
  const pgDir = join(home, 'gen-pg')
  cli(['transformation', 'run', 'rel-to-sql-ddl', '--in', 'demo/rel', '--config', 'demo/cfg-pg', '--out-dir', pgDir])
  const pgSql = readFileSync(join(pgDir, readdirSync(pgDir).find((f) => f.endsWith('.sql') && !f.endsWith('-triggers.sql'))), 'utf-8')
  expect('a source-agnostic preset runs against any input (no declared source)', pgSql.length > 0)
  expect('the postgres preset emits domains',
    pgSql.includes('CREATE DOMAIN "money" AS INTEGER DEFAULT 0 CHECK (VALUE >= 0);'))
  expect('domain-typed columns reference the domain by name', pgSql.includes('"salary" "money" NOT NULL'))

  const oraDir = join(home, 'gen-ora')
  cli(['transformation', 'run', 'rel-to-sql-ddl', '--in', 'demo/rel', '--config', 'demo/cfg-ora', '--out-dir', oraDir])
  const oraSql = readFileSync(join(oraDir, 'library_rel.sql'), 'utf-8')
  const oraTrg = readFileSync(join(oraDir, 'library_rel-triggers.sql'), 'utf-8')
  expect('the oracle preset emulates every rule with triggers (no action clauses)',
    !oraSql.includes('ON DELETE') && oraTrg.includes('trg_fk_loan_of_copy_disconnect'))

  // ── row history through the suite ─────────────────────────────────
  // step 1 with an explicit configuration versioning Book, persisted,
  // then the DDL defaults over the persisted intermediate (historyOf
  // round-trips through the workspace file)
  cli(['config', 'init', 'eer-to-relational', '--for', 'demo/library', '--out', 'demo/m2m-cfg'])
  const m2mCfgPath = join(home, '.synth', 'models', 'demo', 'm2m-cfg.tsx')
  const historyCfg = readFileSync(m2mCfgPath, 'utf-8').replace(
    /name="ec_Book_RowHistory"([\s\S]*?)\/NoHistory" \/>/,
    (m) => m.replaceAll('NoHistory', 'HistoryTable')
  )
  writeFileSync(m2mCfgPath, historyCfg)
  cli(['transformation', 'run', 'eer-to-relational', '--in', 'demo/library',
    '--config', 'demo/m2m-cfg', '--out', 'demo/rel-hist'])
  const histDir = join(home, 'gen-history')
  cli(['transformation', 'run', 'rel-to-sql-ddl', '--in', 'demo/rel-hist',
    '--default-configs', '--out-dir', histDir])
  const histSql = readFileSync(join(histDir, 'library_rel.sql'), 'utf-8')
  const histTrg = readFileSync(join(histDir, 'library_rel-triggers.sql'), 'utf-8')
  expect('the history table is an ordinary CREATE TABLE with its composite key',
    histSql.includes('CREATE TABLE book_history (')
    && histSql.includes('PRIMARY KEY (id, valid_from)'))
  expect('no constraint targets the history table (not existence-dependent)',
    !histSql.includes('ALTER TABLE book_history'))
  expect('the capture stub maintains the history from the base table',
    histTrg.includes('CREATE TRIGGER trg_book_history_capture')
    && histTrg.includes('AFTER UPDATE OR DELETE ON book')
    && histTrg.includes('synth_book_history_capture'))

  // ── clustering: one logical choice, two dialect-true emissions ────
  cli(['config', 'init', 'rel-to-sql-ddl', '--for', 'demo/rel', '--out', 'demo/ddl-cfg'])
  const ddlCfgPath = join(home, '.synth', 'models', 'demo', 'ddl-cfg.tsx')
  const baseCfg = readFileSync(ddlCfgPath, 'utf-8')

  const pgClustered = baseCfg.replaceAll('StandardSql', 'PostgreSql').replace('/None"', '/ClusterPrimaryKey"')
  writeFileSync(join(home, '.synth', 'models', 'demo', 'ddl-cfg-pgc.tsx'), pgClustered)
  const pgcDir = join(home, 'gen-pgc')
  cli(['transformation', 'run', 'rel-to-sql-ddl', '--in', 'demo/rel', '--config', 'demo/ddl-cfg-pgc', '--out-dir', pgcDir])
  const pgcSql = readFileSync(join(pgcDir, 'library_rel.sql'), 'utf-8')
  expect('postgres clustering is a one-time CLUSTER statement',
    pgcSql.includes('CLUSTER ') && pgcSql.includes(' USING pk_'))

  const oraClustered = baseCfg.replaceAll('StandardSql', 'Oracle').replace('/None"', '/ClusterPrimaryKey"')
  writeFileSync(join(home, '.synth', 'models', 'demo', 'ddl-cfg-orac.tsx'), oraClustered)
  const oracDir = join(home, 'gen-orac')
  cli(['transformation', 'run', 'rel-to-sql-ddl', '--in', 'demo/rel', '--config', 'demo/ddl-cfg-orac', '--out-dir', oracDir])
  const oracSql = readFileSync(join(oracDir, 'library_rel.sql'), 'utf-8')
  expect('oracle clustering is an index-organized table',
    oracSql.includes(') ORGANIZATION INDEX;'))

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
