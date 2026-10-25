/**
 * The suite's verification: beyond the generic smoke, assert the
 * exact design-space outcomes. Two runs on the Library sample: the
 * default configuration, and a patched configuration (TablePerClass,
 * the ForeignKey option for borrows, row history for Book with an
 * explicit VersionCounter sub-issue choice and for BookCopy with the
 * discriminator left to its run-time default), with the persisted
 * trace checked for the resolutions that produced each result.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const pkgDir = process.cwd()
const cliBin = join(pkgDir, 'node_modules', '@aelastics', 'synthesis-cli', 'bin', 'run.js')
const home = mkdtempSync(join(tmpdir(), 'synth-eer-to-sql-verify-'))
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
  cli(['model', 'import', join(pkgDir, 'sample', 'library.eer.tsx'), '--as', 'demo/library'])

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
    && out.includes('$refByName="book_copy/no"'))
  expect('M:N becomes a join table', out.includes('<Table name="written_by"'))
  expect('1:N defaults to a join table', out.includes('<Table name="borrows"'))
  expect('auditing defaults on: audit columns appear (simplified form, scoped per table)',
    out.includes('name="createdBy"') && out.includes('name="createdAt"'))
  expect('every foreign key gets an index by default', out.includes('<Index name="ix_fk_member_person"'))
  expect('no legacy flat foreign-key marks', !out.includes('isForeignKey={true}'))
  expect('key-ness is the PrimaryKey element, not a mark',
    out.includes('<PrimaryKey name="pk_book"') && !out.includes('isKey='))
  expect('the aggregation is keyed by its at-most-once participant (the key rule)',
    out.includes('<Table name="loan"')
    && out.includes('<PrimaryKey name="pk_loan"')
    && out.includes('<ForeignKey name="fk_loan_of_copy"'))
  expect('the other participant is an ordinary foreign key',
    out.includes('<ForeignKey name="fk_loan_by_member"'))
  expect('disconnect rules become referential actions',
    out.includes('onDelete="Cascade" onUpdate="Cascade"'))
  expect('connect rules are carried for the trigger layer',
    out.includes('onConnect="Cascade"'))
  expect('a composite attribute flattens to prefixed columns',
    out.includes('name="address_street"') && out.includes('name="address_city"'))
  expect('a user-defined domain is emitted and linked',
    out.includes('<Domain name="money"') && out.includes('domain={<Domain $refByName="money"'))
  expect('cardinality drives nullability (title optional, author name mandatory)',
    out.includes('<Column name="title" type="VARCHAR(255)" isNullable={true}')
    && out.includes('<Column name="name" type="VARCHAR(255)" isNullable={false}'))
  expect('autoincrement stays off composite keys',
    out.split('isAutoincrement={true}').length === 4)
  expect('row history is opt-in: the default run emits no history tables',
    !out.includes('_history'))

  const tr = read('demo/tr')
  // a trace entry records its decision as a Resolution named after the
  // chosen option; it points at the configuration choice that decided it
  const resolution = (text, option, byDefault, choice) =>
    new RegExp(`<Resolution name="r\\d+_${option}" byDefault=\\{${byDefault}\\} choices=\\{\\[<ChoiceRef \\$refByName="[^"]*/${choice}" />\\]\\} />`).test(text)
  expect('trace names executed rules', tr.includes('function="kernelToTable"') && tr.includes('function="joinedSubtypeTable"')
    && tr.includes('function="aggregationToTable"'))
  expect('trace records the audit default for the table',
    resolution(tr, 'AuditColumns', true, 'ec_Book_TableAuditing'))
  expect('trace records the hierarchy strategy on the hierarchy entry',
    resolution(tr, 'JoinedTables', true, 'ec_Person_personRoles_InheritanceStrategy'))
  expect('trace records the global naming convention by default, never overridden',
    resolution(tr, 'SnakeCase', true, 'gc_NamingConvention') && !tr.includes('SnakeCase" byDefault={false}'))

  // ── run 2: a patched configuration ────────────────────────────────
  cli(['config', 'init', 'eer-to-relational', '--for', 'demo/library', '--out', 'demo/cfg'])
  const cfgPath = modelPath('demo/cfg')
  let cfg = readFileSync(cfgPath, 'utf-8')
  // order matters: JoinedTables must be rewritten before JoinTable
  cfg = cfg.replaceAll('JoinedTables', 'TablePerClass')
  cfg = cfg.replaceAll('JoinTable', 'ForeignKey')
  // row history: Book keeps history with an explicit VersionCounter
  // sub-issue choice (flat in the configuration, like any choice);
  // BookCopy keeps history and leaves the discriminator to its
  // run-time default
  const chooseHistory = (text, entity) => text.replace(
    new RegExp(`name="ec_${entity}_RowHistory"([\\s\\S]*?)/NoHistory" \\/>`),
    (m) => m.replaceAll('NoHistory', 'HistoryTable')
  )
  cfg = chooseHistory(cfg, 'Book')
  cfg = chooseHistory(cfg, 'BookCopy')
  cfg = cfg.replace(
    /( +)<ElementLevelChoice\n +name="ec_Book_RowHistory"[\s\S]*?\n +\/>\n/,
    (m, indent) => m
      + `${indent}<ElementLevelChoice\n`
      + `${indent}  name="ec_Book_HistoryDiscriminator"\n`
      + `${indent}  element={<Element $refByName="//www.aelastics.org/Library/Book" />}\n`
      + `${indent}  selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/VersionCounter" />}\n`
      + `${indent}/>\n`
  )
  writeFileSync(cfgPath, cfg)

  cli(['transformation', 'run', 'eer-to-relational', '--in', 'demo/library',
    '--config', 'demo/cfg', '--out', 'demo/out2', '--trace', 'demo/tr2'])
  const out2 = read('demo/out2')

  expect('an abstract root under TablePerClass gets no table', !out2.includes('<Table name="person"'))
  // natural names: the copied root column is plain `name`, so member
  // and staff each add one occurrence beyond author's own
  expect('TablePerClass copies the root columns into the subtype table',
    out2.includes('<Table name="member"') && out2.split('<Column name="name"').length >= 4)
  expect('the ForeignKey option grafts the borrows key into book_copy',
    out2.includes('<ForeignKey name="fk_book_copy_borrows"') && out2.includes('$refByName="member/id"'))
  expect('no join table for borrows under the ForeignKey option', !out2.includes('<Table name="borrows"'))

  // row history: Book's history table is derived from its own node
  // (audit columns captured), keyed by base key plus the chosen
  // version counter, and linked to its base by historyOf
  const tableBlock = (text, name) => {
    const match = text.match(new RegExp(`<Table name="${name}"[\\s\\S]*?</Table>`))
    return match ? match[0] : ''
  }
  const bookHistory = tableBlock(out2, 'book_history')
  expect('book keeps history: the derived table with the historyOf link',
    bookHistory.includes('historyOf={<Table $refByName="book" />}'))
  expect('the explicit sub-issue choice yields the version counter discriminator',
    bookHistory.includes('<Column name="version" type="INTEGER" isNullable={false}'))
  expect('the history key is the base key plus the discriminator, in order',
    bookHistory.includes('<PrimaryKey name="pk_book_history">')
    && /pk_book_history">\s*<Column \$refByName="id" \/>\s*<Column \$refByName="version" \/>/.test(bookHistory))
  expect('audit columns are captured into the history like any column',
    bookHistory.includes('name="createdBy"'))
  expect('history rows arrive with their values: no autoincrement in history',
    !bookHistory.includes('isAutoincrement={true}'))
  // BookCopy: the weak composite key is copied, the discriminator
  // falls back to its default at run time
  const copyHistory = tableBlock(out2, 'book_copy_history')
  expect('the weak history key copies the composite key plus valid_from',
    copyHistory.includes('<Column name="valid_from" type="TIMESTAMP"')
    && /pk_book_copy_history">\s*<Column \$refByName="book_id" \/>\s*<Column \$refByName="no" \/>\s*<Column \$refByName="valid_from" \/>/.test(copyHistory))
  expect('history tables carry no foreign keys (not existence-dependent)',
    !bookHistory.includes('<ForeignKey') && !copyHistory.includes('<ForeignKey')
    && !out2.includes('fk_book_history') && !out2.includes('fk_book_copy_history'))
  expect('the borrows graft into book_copy is mirrored into its history',
    /<Table \$refByName="book_copy_history">\s*<Column name="member_id"/.test(out2))
  expect('the mirror copies columns only: no index lands on the history table',
    !out2.includes('ix_fk_book_copy_history'))

  const tr2 = read('demo/tr2')
  expect('trace records the explicit strategy as a non-default resolution',
    resolution(tr2, 'TablePerClass', false, 'ec_Person_personRoles_InheritanceStrategy') && !tr2.includes('TablePerClass" byDefault={true}'))
  expect('trace records the history rule with both targets',
    tr2.includes('function="withRowHistory"') && tr2.includes('/book_history'))
  expect('trace records the explicit sub-issue choice',
    resolution(tr2, 'VersionCounter', false, 'ec_Book_HistoryDiscriminator'))
  expect('trace records the defaulted discriminator for book_copy',
    /<Resolution name="r\d+_ValidFromTimestamp" byDefault=\{true\}/.test(tr2))

  // ── run 3: SingleTable, the bounds-aware discriminator ────────────
  cli(['config', 'init', 'eer-to-relational', '--for', 'demo/library', '--out', 'demo/cfg3'])
  const cfg3Path = modelPath('demo/cfg3')
  writeFileSync(cfg3Path, readFileSync(cfg3Path, 'utf-8').replaceAll('JoinedTables', 'SingleTable'))
  cli(['transformation', 'run', 'eer-to-relational', '--in', 'demo/library',
    '--config', 'demo/cfg3', '--out', 'demo/out3'])
  const out3 = read('demo/out3')
  const graftOf = (table) => {
    const match = out3.match(new RegExp(`<Table \\$refByName="${table}">[\\s\\S]*?</Table>`))
    return match ? match[0] : ''
  }
  expect('a partial disjoint hierarchy gets a NULLABLE discriminator',
    /<Column name="type" type="VARCHAR\(255\)" isNullable={true}/.test(graftOf('person')))
  expect('an overlapping hierarchy gets NO discriminator',
    !graftOf('author').includes('name="type"')
    && graftOf('author').includes('<Column name="expertise"'))
  expect('subtype columns in a single table are always nullable',
    graftOf('person').includes('<Column name="salary" type="INTEGER" isNullable={true}')
    && graftOf('author').includes('<Column name="section" type="VARCHAR(255)" isNullable={true}'))

  // ── declared constraints: the validation point ────────────────────
  const validateOut = cli(['model', 'validate', 'demo/library'])
  expect('model validate runs the declared constraints', validateOut.includes('[ok] declared constraints hold'))

  // a model that renders fine but violates the doctrine eight ways: a
  // weak-ownership cycle, a MIXED cycle (a weak owned by an aggregation
  // it participates in), a subtype cycle, a one-participant
  // aggregation, a one-role relationship, an orphan subtype, an empty
  // specialization, and a leaf attribute without a domain. The cycles
  // use the re-opening idiom, since the nested canonical forms cannot
  // express a forward reference.
  const badPath = join(home, 'invalid.tsx')
  writeFileSync(badPath, `/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
import { EERSchema, Entity, Weak, Attribute, Domain, Relationship, Role, WeakMapping, Aggregation, AggregationMapping, Specialization, Subtype } from 'eer-metamodel'

export const $synth = { kind: 'model', metamodel: 'eer-metamodel', author: 'verify', version: '0.1.0', description: 'constraint violations on purpose' }

export default (store) => (
  <EERSchema name="Invalid" store={store}>
    <Domain name="number" />
    <Entity name="K">
      <Attribute name="id" isKey={true}><Domain $refByName="number" /></Attribute>
    </Entity>
    <Weak name="WA">
      <Attribute name="no" isKey={true}><Domain $refByName="number" /></Attribute>
    </Weak>
    <Weak name="WB">
      <Attribute name="no" isKey={true}><Domain $refByName="number" /></Attribute>
      <WeakMapping name="m2" domain={<Weak $refByName="WA" />} lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R" cnWeakOwner="R" dcnWeakOwner="R" />
    </Weak>
    <Weak $refByName="WA">
      <WeakMapping name="m1" domain={<Weak $refByName="WB" />} lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R" cnWeakOwner="R" dcnWeakOwner="R" />
    </Weak>
    <Weak name="W2">
      <Attribute name="no" isKey={true}><Domain $refByName="number" /></Attribute>
    </Weak>
    <Aggregation name="G2">
      <AggregationMapping name="g2k" domain={<Entity $refByName="K" />} lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" cnAggrOwner="R" dcnAggrOwner="R" />
      <AggregationMapping name="g2w" domain={<Weak $refByName="W2" />} lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>
    <Weak $refByName="W2">
      <WeakMapping name="m3" domain={<Aggregation $refByName="G2" />} lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R" cnWeakOwner="R" dcnWeakOwner="R" />
    </Weak>
    <Subtype name="SubA" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
      <Specialization name="S1" lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
    </Subtype>
    <Subtype name="SubB" supertype={<Specialization $refByName="SubA/S1" />} cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R">
      <Specialization name="S2" lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
    </Subtype>
    <Specialization $refByName="SubB/S2">
      <Subtype $refByName="SubA" />
    </Specialization>
    <Aggregation name="Solo">
      <AggregationMapping name="only" domain={<Entity $refByName="K" />} lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>
    <Relationship name="half">
      <Role name="one" lowerBound="0" upperBound="M" domain={<Entity $refByName="K" />} />
    </Relationship>
    <Subtype name="Orphan" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R" />
    <Entity name="K2">
      <Specialization name="Empty" lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
      <Attribute name="x" isKey={false} />
    </Entity>
  </EERSchema>
)
`)
  cli(['model', 'import', badPath, '--as', 'demo/invalid'])
  let constraintFailure = ''
  try {
    cli(['model', 'validate', 'demo/invalid'])
    expect('a violating model fails validation', false)
  } catch (err) {
    constraintFailure = String(err.stdout ?? '') + String(err.stderr ?? '')
  }
  // one schema-level violation, its message naming the cycle members
  expect('identification-dependency cycles are rejected once, on the schema',
    constraintFailure.includes("[fail] EERSchema 'Invalid'")
    && constraintFailure.includes('cyclic identification dependency'))
  expect('the weak-chain cycle members are named', constraintFailure.includes('WA') && constraintFailure.includes('WB'))
  expect('the MIXED weak-aggregation cycle members are named',
    constraintFailure.includes('W2') && constraintFailure.includes('G2'))
  expect('the subtype cycle members are named',
    constraintFailure.includes('SubA') && constraintFailure.includes('SubB'))
  expect('the aggregation arity is enforced', constraintFailure.includes('at least two participants'))
  expect('the binary-relationship doctrine is enforced', constraintFailure.includes('binary'))
  expect('an orphan subtype is rejected',
    constraintFailure.includes('Orphan') && constraintFailure.includes('exactly one specialization'))
  expect('an empty specialization is rejected',
    constraintFailure.includes('Empty') && constraintFailure.includes('at least one subtype'))
  expect('a leaf attribute without a domain is rejected',
    constraintFailure.includes('leaf attribute takes its type from a domain'))

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
