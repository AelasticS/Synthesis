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
  expect('a multivalued attribute gets its own table with set semantics',
    out.includes('<Table name="author_phones"') && out.includes('<PrimaryKey name="pk_author_phones"'))
  expect('a composite attribute flattens to prefixed columns',
    out.includes('name="address_street"') && out.includes('name="address_city"'))
  expect('a user-defined domain is emitted and linked',
    out.includes('<Domain name="money"') && out.includes('domain={<Domain $refByName="money"'))
  expect('cardinality drives nullability (title optional, author name mandatory)',
    out.includes('<Column name="title" type="VARCHAR(255)" isNullable={true}')
    && out.includes('<Column name="name" type="VARCHAR(255)" isNullable={false}'))
  expect('autoincrement stays off composite keys',
    out.split('isAutoincrement={true}').length === 4)

  const tr = read('demo/tr')
  expect('trace names executed rules', tr.includes('rule="kernelToTable"') && tr.includes('rule="joinedSubtypeTable"')
    && tr.includes('rule="aggregationToTable"') && tr.includes('rule="multivaluedAttributeTable"'))
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
  // natural names: the copied root column is plain `name`, so member
  // and staff each add one occurrence beyond author's own
  expect('TablePerClass copies the root columns into the subtype table',
    out2.includes('<Table name="member"') && out2.split('<Column name="name"').length >= 4)
  expect('the ForeignKey option grafts the borrows key into book_copy',
    out2.includes('<ForeignKey name="fk_book_copy_borrows"') && out2.includes('$refByName="member/id"'))
  expect('no join table for borrows under the ForeignKey option', !out2.includes('<Table name="borrows"'))

  const tr2 = read('demo/tr2')
  expect('trace records the explicit strategy with a choice reference',
    tr2.includes('issue="InheritanceStrategy" option="TablePerClass"') && !tr2.includes('option="TablePerClass" byDefault'))

  // ── declared constraints: the validation point ────────────────────
  const validateOut = cli(['model', 'validate', 'demo/library'])
  expect('model validate runs the declared constraints', validateOut.includes('[ok] declared constraints hold'))

  // a model that renders fine but violates the doctrine five ways: a
  // weak-ownership cycle, a MIXED cycle (a weak owned by an aggregation
  // it participates in), a subtype cycle, a one-participant
  // aggregation, and a one-role relationship
  const badPath = join(home, 'invalid.tsx')
  writeFileSync(badPath, `/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
import { EERSchema, Entity, Weak, Attribute, Domain, Relationship, Role, WeakMapping, Aggregation, AggregationMapping, Specialization, SpecializationMapping, Subtype } from 'eer-metamodel'

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
    </Weak>
    <WeakMapping name="m1" domain={<Weak $refByName="WB" />} codomain={<Weak $refByName="WA" />} lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R" cnWeakOwner="R" dcnWeakOwner="R" />
    <WeakMapping name="m2" domain={<Weak $refByName="WA" />} codomain={<Weak $refByName="WB" />} lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R" cnWeakOwner="R" dcnWeakOwner="R" />
    <Weak name="W2">
      <Attribute name="no" isKey={true}><Domain $refByName="number" /></Attribute>
    </Weak>
    <Aggregation name="G2">
      <AggregationMapping name="g2k" domain={<Entity $refByName="K" />} lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" cnAggrOwner="R" dcnAggrOwner="R" />
      <AggregationMapping name="g2w" domain={<Weak $refByName="W2" />} lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>
    <WeakMapping name="m3" domain={<Aggregation $refByName="G2" />} codomain={<Weak $refByName="W2" />} lowerBound="1" upperBound="1" cnMapp="R" dcnMapp="R" cnWeakOwner="R" dcnWeakOwner="R" />
    <Specialization name="S1">
      <Subtype name="SubB" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R" />
    </Specialization>
    <Specialization name="S2">
      <SpecializationMapping name="s2m" domain={<Subtype $refByName="SubB" />} lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
      <Subtype name="SubA" cnSupertype="R" dcnSupertype="R" cnSubtype="R" dcnSubtype="R" />
    </Specialization>
    <Specialization $refByName="S1">
      <SpecializationMapping name="s1m" domain={<Subtype $refByName="SubA" />} lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
    </Specialization>
    <Aggregation name="Solo">
      <AggregationMapping name="only" domain={<Entity $refByName="K" />} lowerBound="0" upperBound="M" cnMapp="R" dcnMapp="R" cnAggrOwner="R" dcnAggrOwner="R" />
    </Aggregation>
    <Relationship name="half">
      <Role name="one" lowerBound="0" upperBound="M" domain={<Entity $refByName="K" />} />
    </Relationship>
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
