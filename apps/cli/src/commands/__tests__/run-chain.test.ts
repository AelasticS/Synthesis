import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../test-utils/run-cli.js'

// `transformation run` is the execution verb: one name runs a single
// transformation, several names form an ad-hoc chain with in-memory
// hand-off between the steps. `tx run` is the typing alias — most tests
// here use it (proving the alias), one uses the canonical form.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

let testHome: string
let tempDir: string
let modelsDir: string

const run = (args: string[]) => runCli(args, { home: testHome })

// oclif wraps stderr at terminal width, inserting '·\n ›' inside messages;
// flatten the wrapping so substring assertions can span line breaks.
const flatten = (text: string): string => text.replace(/·?\s*\n\s*›?\s*/g, ' ')

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-run-chain-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-run-chain-out-'))
  modelsDir = join(testHome, '.synth', 'models')
  await run(['init'])
  await run(['ns', 'mk', 'com.example'])
  await run(['model', 'import', personsFixture, '--as', 'com.example/persons'])
  await run(['model', 'import', personsFixture, '--as', 'com.example/persons2'])
  await run(['tx', 'install', join(fixturesDir, 'eer-to-relational')])
  await run(['tx', 'install', join(fixturesDir, 'rel-to-sql-ddl')])
  await run(['tx', 'install', join(fixturesDir, 'rel-copy')])
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
  rmSync(tempDir, { recursive: true, force: true })
})

describe('chain pre-flight', () => {
  it('aborts a chain whose FIRST step is uncovered, teaching --config AND --default-configs', async () => {
    // Step 1's input model exists in the workspace, so an explicit
    // configuration IS possible — the message must teach it, not claim the
    // model is produced mid-run.
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons', '--out-dir', join(tempDir, 'never')
    ])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain('step 1 (eer-to-relational) is decision-based')
    expect(message).toContain('--config')
    expect(message).toContain('synth config init eer-to-relational --for com.example/persons')
    expect(message).toContain('--default-configs')
    expect(message).not.toContain('produced mid-run')
    expect(existsSync(join(tempDir, 'never'))).toBe(false)
  })

  it('aborts a chain whose LATER step is uncovered with the mid-run wording', async () => {
    const init = await run([
      'config', 'init', 'eer-to-relational', '--for', 'com.example/persons', '--out', 'com.example/preflight-cfg'
    ])
    expect(init.error).toBeUndefined()
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--config', 'com.example/preflight-cfg', '--out-dir', join(tempDir, 'never')
    ])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain('step 2 (rel-to-sql-ddl) is decision-based')
    expect(message).toContain('produced mid-run')
    expect(message).toContain('--default-configs')
    expect(existsSync(join(tempDir, 'never'))).toBe(false)
  })

  it('rejects --config combined with --default-configs on a single step (core exclusivity)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/whatever-cfg', '--default-configs', '--out', 'com.example/never'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('--config and --default-configs are mutually exclusive')
  })

  it('rejects --keep-intermediates on a single-step run (exit 1)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--default-configs', '--keep-intermediates', '--out', 'com.example/never'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('--keep-intermediates is only valid for a multi-step chain')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never.tsx'))).toBe(false)
  })

  it('rejects an m2t step in the middle of a chain', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'rel-to-sql-ddl', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--out-dir', join(tempDir, 'never')
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('step 1 (rel-to-sql-ddl) is m2t')
    expect(message).toContain('last step')
  })

  it('rejects a chain whose metamodels do not line up, naming the pair (exit 2)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', 'eer-to-relational', '--in', 'com.example/persons',
      '--default-configs', '--out', 'com.example/never'
    ])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain('Chain type mismatch')
    expect(message).toContain('step 1 (eer-to-relational)')
    expect(message).toContain('step 2 (eer-to-relational)')
    expect(message).toContain('@synthesis/standard-metamodels/relational')
    expect(message).toContain('@synthesis/standard-metamodels/eer')
  })

  it('requires --out-dir when the last step is m2t and rejects --out', async () => {
    const noDir = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons', '--default-configs'
    ])
    expect(noDir.code).toBe(1)
    expect(noDir.stderr).toContain('--out-dir')

    const withOut = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--out', 'com.example/never'
    ])
    expect(withOut.code).toBe(1)
    expect(flatten(withOut.stderr)).toContain('--out is only valid when the last step is m2m')
  })

  it('rejects --save-config on a multi-step chain, teaching the stepwise path', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--save-config', 'com.example/never-cfg', '--out-dir', join(tempDir, 'never')
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('--save-config is not supported for multi-step runs')
    expect(message).toContain(`'transformation run'`)
  })
})

describe('chain execution', () => {
  it('chains eer-to-relational into rel-to-sql-ddl (canonical command form), producing SQL', async () => {
    const genDir = join(tempDir, 'gen')
    const { stdout, error } = await run([
      'transformation', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--out-dir', genDir
    ])
    expect(error).toBeUndefined()
    // Per-step decision announcements carry the step prefix
    expect(stdout).toContain('[step 1/2 eer-to-relational] decision NamingConvention -> SnakeCase (default)')
    expect(stdout).toContain('[step 2/2 rel-to-sql-ddl] decision IdentifierQuoting -> Unquoted (default)')

    const sqlFiles = readdirSync(genDir).filter((name) => name.endsWith('.sql'))
    expect(sqlFiles.length).toBe(1)
    const sql = readFileSync(join(genDir, sqlFiles[0]), 'utf-8')
    expect(sql).toContain('CREATE TABLE person')
    expect(sql).toContain('person_id INTEGER PRIMARY KEY')
  })

  it('emits the chain JSON shape: steps with per-step decisions, in, outDir, written', async () => {
    const genDir = join(tempDir, 'gen-json')
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--out-dir', genDir, '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.in).toBe('com.example/persons')
    expect(parsed.outDir).toBe(genDir)
    expect(parsed.steps.map((step: { tx: string }) => step.tx)).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
    expect(parsed.steps[0].kind).toBe('m2m')
    expect(parsed.steps[1].kind).toBe('m2t')
    const step2Options = parsed.steps[1].decisions.map((decision: { option: string }) => decision.option)
    expect(step2Options).toContain('Unquoted')
    expect(parsed.intermediates).toBeUndefined()
    expect(parsed.written.length).toBe(1)
    expect(existsSync(parsed.written[0])).toBe(true)
  })

  it('steers step 1 with --config while step 2 runs on --default-configs', async () => {
    const init = await run([
      'config', 'init', 'eer-to-relational', '--for', 'com.example/persons', '--out', 'com.example/camel-cfg'
    ])
    expect(init.error).toBeUndefined()
    const cfgPath = join(modelsDir, 'com', 'example', 'camel-cfg.tsx')
    writeFileSync(cfgPath, readFileSync(cfgPath, 'utf-8').replaceAll('SnakeCase', 'CamelCase'))

    const genDir = join(tempDir, 'gen-camel')
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--config', 'com.example/camel-cfg', '--default-configs', '--out-dir', genDir
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[step 1/2 eer-to-relational] decision NamingConvention -> CamelCase')

    const sqlFiles = readdirSync(genDir).filter((name) => name.endsWith('.sql'))
    const sql = readFileSync(join(genDir, sqlFiles[0]), 'utf-8')
    expect(sql).toContain('CREATE TABLE Person')
    expect(sql).toContain('personId INTEGER PRIMARY KEY')
  })

  it('persists the intermediate with --keep-intermediates: gated write, provenance, validates', async () => {
    const genDir = join(tempDir, 'gen-keep')
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--keep-intermediates', '--out-dir', genDir, '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.intermediates).toEqual(['com.example/persons-eer-to-relational'])
    // written covers the intermediate model file AND the generated SQL
    expect(parsed.written.length).toBe(2)
    expect(stdout).not.toContain('Wrote com.example')

    const intermediatePath = join(modelsDir, 'com', 'example', 'persons-eer-to-relational.tsx')
    expect(existsSync(intermediatePath)).toBe(true)

    const show = await run(['model', 'show', 'com.example/persons-eer-to-relational', '--json'])
    expect(show.error).toBeUndefined()
    const header = JSON.parse(show.stdout).header
    expect(header.generatedBy.tx).toBe('eer-to-relational')
    expect(header.generatedBy.config).toBe('defaults')

    const validate = await run(['model', 'validate', 'com.example/persons-eer-to-relational'])
    expect(validate.error).toBeUndefined()

    // Same run again without --overwrite: the existing intermediate is
    // refused before any engine work
    const again = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--keep-intermediates', '--out-dir', join(tempDir, 'gen-keep2')
    ])
    expect(again.code).toBe(1)
    expect(flatten(again.stderr)).toContain('Intermediate model already exists')
    expect(existsSync(join(tempDir, 'gen-keep2'))).toBe(false)
  })

  it('writes the final model of an m2m chain to the default ref derived from --in and the last tx', async () => {
    // Single m2m step (the smallest 'chain'): the default out ref is
    // '<ns>/<name>-<lastTx>'. persons2 keeps this independent of the
    // intermediate the --keep-intermediates test materialized.
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons2', '--default-configs', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.out).toBe('com.example/persons2-eer-to-relational')
    expect(parsed.tx).toBe('eer-to-relational')
  })

  it('single-step keeps the single JSON shape and --save-config', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/run-saved-cfg', '--out', 'com.example/run-rel', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.tx).toBe('eer-to-relational')
    expect(parsed.in).toBe('com.example/persons')
    expect(parsed.out).toBe('com.example/run-rel')
    expect(parsed.kind).toBe('m2m')
    expect(parsed.savedConfig).toBe('com.example/run-saved-cfg')
    expect(parsed.steps).toBeUndefined()
    expect(existsSync(join(modelsDir, 'com', 'example', 'run-saved-cfg.tsx'))).toBe(true)
    expect(existsSync(join(modelsDir, 'com', 'example', 'run-rel.tsx'))).toBe(true)
  })

  it('aborts a decision-based single run without consent (exit 2)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out', 'com.example/never'
    ])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain(`Transformation 'eer-to-relational' is decision-based`)
  })
})

describe('chain pre-flight ref collisions (claimed-refs check)', () => {
  // rel-copy is endogenous (relational -> relational), so chaining it with
  // itself derives IDENTICAL intermediate and final refs — exactly the
  // collision the pre-flight check must catch before any engine work.
  beforeAll(async () => {
    await run(['model', 'import', personsFixture, '--as', 'com.example/collide'])
    const mkRel = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/collide', '--default-configs', '--out', 'com.example/collide-rel'
    ])
    expect(mkRel.error).toBeUndefined()
  })

  it('rejects a self-chained tx whose derived intermediate and final refs collide', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'rel-copy', 'rel-copy', '--in', 'com.example/collide-rel', '--keep-intermediates'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('the default --out target derived from --in')
    expect(message).toContain('com.example/collide-rel-rel-copy')
    expect(message).toContain('is the same ref as the intermediate model of step 1 (rel-copy)')
    expect(existsSync(join(modelsDir, 'com', 'example', 'collide-rel-rel-copy.tsx'))).toBe(false)
  })

  it('rejects an explicit --out equal to a derived intermediate ref', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-copy', '--in', 'com.example/collide',
      '--default-configs', '--keep-intermediates', '--out', 'com.example/collide-eer-to-relational'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain(
      'the --out target com.example/collide-eer-to-relational is the same ref as the intermediate model of step 1 (eer-to-relational)'
    )
    expect(existsSync(join(modelsDir, 'com', 'example', 'collide-eer-to-relational.tsx'))).toBe(false)
  })
})

describe('chain provenance (per-step actual input refs)', () => {
  beforeAll(async () => {
    await run(['model', 'import', personsFixture, '--as', 'com.example/prov'])
  })

  it('stamps the final model of a kept-intermediates chain as generated FROM the intermediate ref', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-copy', '--in', 'com.example/prov',
      '--default-configs', '--keep-intermediates', '--out', 'com.example/prov-final', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.intermediates).toEqual(['com.example/prov-eer-to-relational'])

    const showFinal = await run(['model', 'show', 'com.example/prov-final', '--json'])
    expect(showFinal.error).toBeUndefined()
    const finalHeader = JSON.parse(showFinal.stdout).header
    expect(finalHeader.generatedBy.tx).toBe('rel-copy')
    // Step 2's ACTUAL input is the kept intermediate, not the original --in
    expect(finalHeader.description).toBe('Generated by rel-copy from com.example/prov-eer-to-relational')

    const showIntermediate = await run(['model', 'show', 'com.example/prov-eer-to-relational', '--json'])
    expect(showIntermediate.error).toBeUndefined()
    const intermediateHeader = JSON.parse(showIntermediate.stdout).header
    expect(intermediateHeader.description).toBe('Generated by eer-to-relational from com.example/prov')
  })

  it('records an in-memory derivation marker when the intermediate is not kept', async () => {
    const { error } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-copy', '--in', 'com.example/prov',
      '--default-configs', '--out', 'com.example/prov-final2'
    ])
    expect(error).toBeUndefined()
    const show = await run(['model', 'show', 'com.example/prov-final2', '--json'])
    expect(show.error).toBeUndefined()
    const header = JSON.parse(show.stdout).header
    expect(header.description).toBe('Generated by rel-copy from com.example/prov via eer-to-relational')
  })
})
