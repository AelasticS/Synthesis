import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// Tests execute from lib/commands/tx/__tests__; fixtures are referenced at
// their source location (they are not compiled by TypeScript).
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

// Isolated HOME so tests neither read nor mutate the developer's ~/.synth
// workspace; the workspace lives at <home>/.synth (init default path).
let testHome: string
let tempDir: string
let modelsDir: string

const run = (args: string[]) => runCli(args, { home: testHome })

// oclif wraps stderr at terminal width, inserting '·\n ›' inside messages;
// flatten the wrapping so substring assertions can span line breaks.
const flatten = (text: string): string => text.replace(/·?\s*\n\s*›?\s*/g, ' ')

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-tx-run-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-tx-run-out-'))
  modelsDir = join(testHome, '.synth', 'models')
  await run(['init'])
  await run(['ns', 'mk', 'com.example'])
  await run(['model', 'import', personsFixture, '--as', 'com.example/persons'])
  await run(['tx', 'install', join(fixturesDir, 'eer-to-relational')])
  await run(['tx', 'install', join(fixturesDir, 'rel-to-sql-ddl')])
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
  rmSync(tempDir, { recursive: true, force: true })
})

describe('tx run errors', () => {
  it('fails with NOT_FOUND for an unknown transformation and lists installed ones', async () => {
    const { code, stderr } = await run(['tx', 'run', 'no-such-tx', '--in', 'com.example/persons'])
    expect(code).toBe(3)
    expect(stderr).toContain('Transformation not found')
    expect(stderr).toContain('eer-to-relational')
  })

  it('fails with NOT_FOUND when the input model is missing', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/missing', '--out', 'com.example/x'
    ])
    expect(code).toBe(3)
    expect(stderr).toContain('Input model not found')
  })

  it('fails with NOT_FOUND and a reinstall hint when the installed package is gone', async () => {
    // Register a valid transformation, then rip its package directory out
    // from under the workspace config.
    const ghostDir = join(tempDir, 'ghost-tx')
    mkdirSync(ghostDir, { recursive: true })
    writeFileSync(
      join(ghostDir, 'package.json'),
      JSON.stringify({
        name: 'ghost-tx',
        version: '1.0.0',
        synth: {
          kind: 'm2m',
          entry: './lib/transformation.js',
          exportName: 'GhostTransformation',
          source: { metamodel: 'mm/source' },
          target: { metamodel: 'mm/target' }
        }
      })
    )
    const install = await run(['tx', 'install', ghostDir])
    expect(install.error).toBeUndefined()
    rmSync(join(testHome, '.synth', 'transformations', 'ghost-tx'), { recursive: true, force: true })

    try {
      const { code, stderr } = await run(['tx', 'run', 'ghost-tx', '--in', 'com.example/persons'])
      expect(code).toBe(3)
      expect(flatten(stderr)).toContain('installed package is missing')
      expect(flatten(stderr)).toContain('tx install')
    } finally {
      await run(['tx', 'uninstall', 'ghost-tx'])
    }
  })

  it('rejects an input model with a malformed $synth header (exit 2)', async () => {
    // Placed directly in the models tree: `model import` would refuse to
    // stamp this, but tx run must not silently skip the metamodel gate.
    const brokenPath = join(modelsDir, 'com', 'example', 'broken-header.tsx')
    writeFileSync(
      brokenPath,
      `export const $synth = { kind: 'model', metamodel: undefined }\nexport default () => ({ render: () => 'x' })\n`
    )
    try {
      const { code, stderr } = await run([
        'tx', 'run', 'eer-to-relational', '--in', 'com.example/broken-header', '--out', 'com.example/never'
      ])
      expect(code).toBe(2)
      expect(flatten(stderr)).toContain('malformed $synth header')
    } finally {
      rmSync(brokenPath, { force: true })
    }
  })

  it('rejects an input model whose metamodel does not match the manifest (exit 2)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons', '--out-dir', join(tempDir, 'never')
    ])
    expect(code).toBe(2)
    expect(stderr).toContain('@synthesis/standard-metamodels/eer')
    expect(stderr).toContain('@synthesis/standard-metamodels/relational')
  })

  it('requires --out-dir for an m2t transformation', async () => {
    const { code, stderr } = await run(['tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons'])
    expect(code).toBe(1)
    expect(stderr).toContain('--out-dir')
  })

  it('rejects --out on m2t and --out-dir on m2m', async () => {
    const outOnM2t = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons', '--out', 'com.example/x'
    ])
    expect(outOnM2t.code).toBe(1)
    expect(outOnM2t.stderr).toContain('--out is only valid for m2m')

    const outDirOnM2m = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out-dir', tempDir
    ])
    expect(outDirOnM2m.code).toBe(1)
    expect(outDirOnM2m.stderr).toContain('--out-dir is only valid for m2t')
  })
})

describe('tx run m2m', () => {
  const outRef = 'com.example/persons-rel'
  const outPath = () => join(modelsDir, 'com', 'example', 'persons-rel.tsx')

  it('runs the decision-based m2m fixture end to end', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out', outRef
    ])
    expect(error).toBeUndefined()
    // Default configuration decisions are announced, one line each
    expect(stdout).toContain('SnakeCase')
    expect(stdout).toContain('PrimaryKeyStrategy -> UseAutoIncrement (default)')
    expect(stdout).toContain(`Wrote ${outRef}`)
    expect(existsSync(outPath())).toBe(true)
  })

  it('writes a model that passes its own import gate (model validate)', async () => {
    const { stdout, error } = await run(['model', 'validate', outRef])
    expect(error).toBeUndefined()
    expect(stdout).toContain(`Model ${outRef} is valid`)
  })

  it('stamps provenance into the generated header', async () => {
    const { stdout, error } = await run(['model', 'show', outRef, '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.header.kind).toBe('model')
    expect(parsed.header.metamodel).toBe('@synthesis/standard-metamodels/relational')
    expect(parsed.header.generatedBy.tx).toBe('eer-to-relational')
    expect(parsed.header.generatedBy.config).toBe('defaults')
  })

  it('keeps the workspace clean for doctor', async () => {
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('0 errors')
  })

  it('refuses an existing target without --overwrite (exit 1)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out', outRef
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('--overwrite')
    // The refused run must not have clobbered the model
    expect(existsSync(outPath())).toBe(true)
  })

  it('replaces an existing target with --overwrite via temp-file rename, leaving no temp behind', async () => {
    const before = readFileSync(outPath(), 'utf-8')
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out', outRef, '--overwrite'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain(`Wrote ${outRef}`)
    // The result was renamed over the target (same model, fresh header dates)
    const after = readFileSync(outPath(), 'utf-8')
    expect(after).toContain('export default')
    expect(after).not.toBe(before)
    // No `<name>.<pid>.tmp.tsx` intermediate may survive the rename
    const siblings = readdirSync(dirname(outPath()))
    expect(siblings.filter((name) => name.includes('.tmp'))).toEqual([])
    // And the replacement still passes the workspace's own gate
    const validate = await run(['model', 'validate', outRef])
    expect(validate.error).toBeUndefined()
  })

  it('emits a machine-readable result with --json', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--out', 'com.example/persons-rel-json', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.tx).toBe('eer-to-relational')
    expect(parsed.in).toBe('com.example/persons')
    expect(parsed.out).toBe('com.example/persons-rel-json')
    expect(parsed.kind).toBe('m2m')
    expect(Array.isArray(parsed.written)).toBe(true)
    expect(parsed.written.length).toBe(1)
    expect(existsSync(parsed.written[0])).toBe(true)
    const options = parsed.decisions.map((decision: { option: string }) => decision.option)
    expect(options).toContain('SnakeCase')
    expect(options).toContain('UseAutoIncrement')
  })
})

describe('tx run m2t', () => {
  it('chains the generated relational model into SQL DDL generation', async () => {
    const genDir = join(tempDir, 'gen')
    const { stdout, error } = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons-rel', '--out-dir', genDir
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Wrote ')

    const sqlFiles = readdirSync(genDir).filter((name) => name.endsWith('.sql'))
    expect(sqlFiles.length).toBe(1)
    const sql = readFileSync(join(genDir, sqlFiles[0]), 'utf-8')
    expect(sql).toContain('CREATE TABLE person')
    expect(sql).toContain('person_id INTEGER PRIMARY KEY')
  })
})
