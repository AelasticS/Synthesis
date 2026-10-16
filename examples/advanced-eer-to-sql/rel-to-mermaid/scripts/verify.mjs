/**
 * The output diagram's verification: the eer-to-relational chain run
 * three times on the suite's Library sample (the default
 * configuration, TablePerClass with the ForeignKey option, and
 * SingleTable), asserting that each configuration is visible in the
 * generated Mermaid text, plus one direct run on the package's own
 * warehouse sample asserting the column-line conventions (composite
 * PK marks, the combined PK, FK mark, type normalization, the
 * historyOf line).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const eerPkgDir = resolve(pkgDir, '..', 'eer-to-relational')
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-rel-mmd-verify-'))
const cli = (args) =>
  execFileSync('node', [cliBin, ...args], { env: { ...process.env, HOME: home }, stdio: 'pipe' }).toString()

const modelPath = (ref) => join(home, '.synth', 'models', ...ref.split('/')) + '.tsx'
const readMmd = (dir) => {
  const file = readdirSync(dir).find((f) => f.endsWith('.mmd'))
  if (!file) throw new Error(`no .mmd file generated in ${dir}`)
  return readFileSync(join(dir, file), 'utf-8')
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
  cli(['transformation', 'install', eerPkgDir])
  cli(['transformation', 'install', pkgDir])
  cli(['model', 'import', join(eerPkgDir, 'sample', 'library.tsx'), '--as', 'demo/library'])

  // ── chain run 1: the default configuration ────────────────────────
  const defDir = join(home, 'gen-default')
  cli(['transformation', 'run', 'eer-to-relational', 'rel-to-mermaid',
    '--in', 'demo/library', '--default-configs', '--out-dir', defDir])
  const def = readMmd(defDir)

  expect('the document opens with the erDiagram header', def.split('\n')[0] === 'erDiagram')
  expect('JoinedTables keeps the root and both subtype tables',
    def.includes('  person {') && def.includes('  member {') && def.includes('  staff {'))
  expect('the joined subtype key is the copied root key, marked PK, FK',
    def.includes('    INTEGER person_id PK, FK'))
  expect('the joined subtype line is identifying (the copied key IS the primary key)',
    def.includes('  member }o--|| person : fk_member_person'))
  expect('the 1:N default produces the borrows join table', def.includes('  borrows {'))
  expect('the M:N join table hangs off both sides with dashed lines',
    def.includes('  written_by }o..|| author : fk_written_by_wrote')
    && def.includes('  written_by }o..|| book : fk_written_by_of_book'))

  // ── chain run 2: TablePerClass with the ForeignKey option ─────────
  cli(['config', 'init', 'eer-to-relational', '--for', 'demo/library', '--out', 'demo/cfg'])
  const cfgPath = modelPath('demo/cfg')
  let cfg = readFileSync(cfgPath, 'utf-8')
  // order matters: JoinedTables must be rewritten before JoinTable
  cfg = cfg.replaceAll('JoinedTables', 'TablePerClass')
  cfg = cfg.replaceAll('JoinTable', 'ForeignKey')
  writeFileSync(cfgPath, cfg)
  const tpcDir = join(home, 'gen-tpc')
  cli(['transformation', 'run', 'eer-to-relational', 'rel-to-mermaid',
    '--in', 'demo/library', '--config', 'demo/cfg', '--out-dir', tpcDir])
  const tpc = readMmd(tpcDir)

  expect('an abstract root under TablePerClass gets no table', !tpc.includes('  person {'))
  expect('the member table carries the copied root columns',
    tpc.includes('  member {')
    && tpc.includes('    INTEGER id PK')
    && tpc.includes('    VARCHAR(255) name "nullable"'))
  expect('the ForeignKey option produces no borrows join table', !tpc.includes('  borrows {'))
  expect('the grafted foreign key is a dashed line from book_copy',
    tpc.includes('  book_copy }o..|| member : fk_book_copy_borrows'))

  // ── chain run 3: SingleTable ──────────────────────────────────────
  cli(['config', 'init', 'eer-to-relational', '--for', 'demo/library', '--out', 'demo/cfg2'])
  const cfg2Path = modelPath('demo/cfg2')
  writeFileSync(cfg2Path, readFileSync(cfg2Path, 'utf-8').replaceAll('JoinedTables', 'SingleTable'))
  const stDir = join(home, 'gen-st')
  cli(['transformation', 'run', 'eer-to-relational', 'rel-to-mermaid',
    '--in', 'demo/library', '--config', 'demo/cfg2', '--out-dir', stDir])
  const st = readMmd(stDir)

  expect('SingleTable folds the subtypes away', !st.includes('  member {') && !st.includes('  staff {'))
  expect('the discriminator is nullable (personRoles is partial)',
    st.includes('    VARCHAR(255) type "nullable"'))
  expect('the grafted subtype columns land in person as nullable',
    st.includes('    VARCHAR(255) since "nullable"') && st.includes('    INTEGER salary "nullable"'))

  // ── direct run: the package's own warehouse sample ────────────────
  cli(['model', 'import', join(pkgDir, 'sample', 'warehouse.tsx'), '--as', 'demo/warehouse'])
  const whDir = join(home, 'gen-warehouse')
  cli(['transformation', 'run', 'rel-to-mermaid', '--in', 'demo/warehouse', '--out-dir', whDir])
  const wh = readMmd(whDir)

  expect('every member of a composite primary key carries PK',
    wh.includes('    INTEGER no PK') && wh.includes('    TIMESTAMP valid_from PK'))
  expect('a column in both the primary key and a foreign key is marked PK, FK',
    wh.includes('    INTEGER product_id PK, FK'))
  expect('a comma inside a type\'s parentheses becomes an underscore',
    wh.includes('    DECIMAL(10_2) price "nullable"'))
  expect('a foreign key inside the primary key is identifying',
    wh.includes('  batch }o--|| product : fk_batch_product'))
  expect('a composite foreign key outside the primary key is dashed',
    wh.includes('  shipment_item }o..|| batch : fk_shipment_item_batch'))
  expect('the historyOf link is a dashed one-to-one line, not a foreign key',
    wh.includes('  product_history ||..|| product : historyOf'))
  expect('domains and indexes stay out of the diagram',
    !wh.includes('money') && !wh.includes('ix_shipment_item_batch'))

  if (failures > 0) {
    console.error(`rel-to-mermaid verify: ${failures} assertion(s) failed`)
    process.exit(1)
  }
  console.log('rel-to-mermaid verify: OK (three configurations of the chain drawn differently, the column-line conventions asserted)')
} catch (err) {
  if (err.stderr) console.error(err.stderr.toString())
  console.error(`rel-to-mermaid verify FAILED: ${err.message}`)
  process.exit(1)
} finally {
  rmSync(home, { recursive: true, force: true })
}
