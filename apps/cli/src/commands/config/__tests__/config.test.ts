import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// Tests execute from lib/commands/config/__tests__; fixtures are referenced
// at their source location (they are not compiled by TypeScript).
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

const CONFIGURATION_METAMODEL =
  '@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model'

// Isolated HOME so tests neither read nor mutate the developer's ~/.synth
// workspace; the workspace lives at <home>/.synth (init default path).
let testHome: string
let tempDir: string
let modelsDir: string

const run = (args: string[]) => runCli(args, { home: testHome })

// oclif wraps stderr at terminal width, inserting '·\n ›' inside messages;
// flatten the wrapping so substring assertions can span line breaks.
const flatten = (text: string): string => text.replace(/·?\s*\n\s*›?\s*/g, ' ')

const configPath = (name: string) => join(modelsDir, 'com', 'example', `${name}.tsx`)

/** The serialized model body: everything from 'export default' on. */
const modelBody = (path: string): string => {
  const text = readFileSync(path, 'utf-8')
  return text.slice(text.indexOf('export default'))
}

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-config-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-config-tmp-'))
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

describe('config init', () => {
  it('fails with NOT_FOUND for an unknown transformation', async () => {
    const { code, stderr } = await run(['config', 'init', 'no-such-tx', '--for', 'com.example/persons'])
    expect(code).toBe(3)
    expect(stderr).toContain('Transformation not found')
  })

  it('rejects a transformation that is not decision-based', async () => {
    // Manifest-only fixture: the check runs before any package code loads
    const plainDir = join(tempDir, 'plain-tx')
    mkdirSync(plainDir, { recursive: true })
    writeFileSync(join(plainDir, 'package.json'), JSON.stringify({ name: 'plain-tx', version: '1.0.0' }))
    writeFileSync(
      join(plainDir, 'synth.json'),
      JSON.stringify({
        kind: 'm2m',
        entry: './lib/transformation.js',
        exportName: 'PlainTransformation',
        source: { metamodel: '@synthesis/standard-metamodels/eer' },
        target: { metamodel: '@synthesis/standard-metamodels/relational' }
      })
    )
    await run(['tx', 'install', plainDir])
    try {
      const { code, stderr } = await run(['config', 'init', 'plain-tx', '--for', 'com.example/persons'])
      expect(code).toBe(1)
      expect(flatten(stderr)).toContain('not decision-based')
    } finally {
      await run(['tx', 'uninstall', 'plain-tx'])
    }
  })

  it('fails with NOT_FOUND when the model is missing', async () => {
    const { code, stderr } = await run(['config', 'init', 'eer-to-relational', '--for', 'com.example/missing'])
    expect(code).toBe(3)
    expect(stderr).toContain('Source model not found')
  })

  it('rejects a model whose metamodel does not match the transformation (exit 2)', async () => {
    // The relational result of the fixture tx is not an EER model
    await run(['tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs', '--out', 'com.example/persons-rel-mm'])
    const { code, stderr } = await run(['config', 'init', 'eer-to-relational', '--for', 'com.example/persons-rel-mm'])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain('Type mismatch')
  })

  it('generates <ns>/<name>-cfg with announced default decisions', async () => {
    const { stdout, error } = await run(['config', 'init', 'eer-to-relational', '--for', 'com.example/persons'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('decision NamingConvention -> SnakeCase (default)')
    expect(stdout).toContain('decision for element personId: PrimaryKeyStrategy -> UseAutoIncrement (default)')
    expect(stdout).toContain('Wrote com.example/persons-cfg')
    expect(existsSync(configPath('persons-cfg'))).toBe(true)
  })

  it('stamps a configuration-model header with provenance and sourceModel reference', async () => {
    const { stdout, error } = await run(['model', 'show', 'com.example/persons-cfg', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.header.kind).toBe('configuration-model')
    expect(parsed.header.metamodel).toBe(CONFIGURATION_METAMODEL)
    expect(parsed.header.references.sourceModel).toBe('com.example/persons')
    expect(parsed.header.generatedBy.tx).toBe('eer-to-relational')
    expect(parsed.header.generatedBy.config).toBe('defaults')
  })

  it('writes a file that passes model validate with the transformation context', async () => {
    const { stdout, error } = await run(['model', 'validate', 'com.example/persons-cfg', '--tx', 'eer-to-relational'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Model com.example/persons-cfg is valid')
  })

  it('keeps the workspace clean for doctor', async () => {
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('0 errors')
  })

  it('refuses an existing configuration without --overwrite, replaces it with', async () => {
    const refused = await run(['config', 'init', 'eer-to-relational', '--for', 'com.example/persons'])
    expect(refused.code).toBe(1)
    expect(refused.stderr).toContain('--overwrite')

    const replaced = await run([
      'config', 'init', 'eer-to-relational', '--for', 'com.example/persons', '--overwrite'
    ])
    expect(replaced.error).toBeUndefined()
    expect(replaced.stdout).toContain('Wrote com.example/persons-cfg')
  })

  it('emits a machine-readable result with --json', async () => {
    const { stdout, error } = await run([
      'config', 'init', 'eer-to-relational', '--for', 'com.example/persons',
      '--out', 'com.example/persons-cfg-json', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.tx).toBe('eer-to-relational')
    expect(parsed.for).toBe('com.example/persons')
    expect(parsed.out).toBe('com.example/persons-cfg-json')
    expect(Array.isArray(parsed.decisions)).toBe(true)
    const options = parsed.decisions.map((decision: { option: string }) => decision.option)
    expect(options).toContain('SnakeCase')
    expect(options).toContain('JoinTable')
    expect(parsed.written).toEqual([configPath('persons-cfg-json')])
  })

  it('maps a malformed header in a referenced model to exit 2, like tx run', async () => {
    // The reference closure gate: a broken referenced header is a broken
    // declaration (VALIDATION_FAILURE), not a generic failure
    const brokenPath = configPath('broken-ref-target')
    const referrerPath = configPath('persons-brokenref')
    writeFileSync(
      brokenPath,
      `export const $synth = { kind: 'model', metamodel: undefined }\nexport default () => ({ render: () => 'x' })\n`
    )
    const referrer = readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8').replace(
      'references: {},',
      "references: { broken: 'com.example/broken-ref-target' },"
    )
    expect(referrer).toContain('broken-ref-target')
    writeFileSync(referrerPath, referrer)
    try {
      const { code, stderr } = await run(['config', 'init', 'eer-to-relational', '--for', 'com.example/persons-brokenref'])
      expect(code).toBe(2)
      expect(flatten(stderr)).toContain('malformed $synth header')
    } finally {
      rmSync(brokenPath, { force: true })
      rmSync(referrerPath, { force: true })
    }
  })
})

describe('config show', () => {
  it('renders the decision lines using the header generatedBy context', async () => {
    const { stdout, error } = await run(['config', 'show', 'com.example/persons-cfg'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Tx:           eer-to-relational')
    expect(stdout).toContain('Source model: com.example/persons')
    expect(stdout).toContain('decision NamingConvention -> SnakeCase (default)')
    expect(stdout).toContain('decision for element worksIn: OneToManyStrategy -> JoinTable (default)')
  })

  it('emits decisions with --json', async () => {
    const { stdout, error } = await run(['config', 'show', 'com.example/persons-cfg', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.ref).toBe('com.example/persons-cfg')
    expect(parsed.tx).toBe('eer-to-relational')
    expect(parsed.sourceModel).toBe('com.example/persons')
    const issues = parsed.decisions.map((decision: { issue: string }) => decision.issue)
    expect(issues).toContain('NamingConvention')
    expect(issues).toContain('PrimaryKeyStrategy')
  })

  it('rejects a model that is not a configuration model (exit 2)', async () => {
    const { code, stderr } = await run(['config', 'show', 'com.example/persons'])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain('not a configuration model')
  })

  it('fails with NOT_FOUND for a missing ref', async () => {
    const { code } = await run(['config', 'show', 'com.example/no-such-cfg'])
    expect(code).toBe(3)
  })
})

describe('config ls', () => {
  it('lists configuration models via the header fast path', async () => {
    const { stdout, error } = await run(['config', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example/persons-cfg')
    expect(stdout).toContain('eer-to-relational')
    // Plain models are not configuration models
    expect(stdout).not.toContain('com.example/persons ')
  })

  it('filters by transformation with --for', async () => {
    const { stdout, error } = await run(['config', 'ls', '--for', 'other-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('No configuration models found for transformation: other-tx')
  })

  it('emits rows with --json', async () => {
    const { stdout, error } = await run(['config', 'ls', '--json'])
    expect(error).toBeUndefined()
    const rows = JSON.parse(stdout)
    const refs = rows.map((row: { ref: string }) => row.ref)
    expect(refs).toContain('com.example/persons-cfg')
    const row = rows.find((entry: { ref: string }) => entry.ref === 'com.example/persons-cfg')
    expect(row.tx).toBe('eer-to-relational')
    expect(row.sourceModel).toBe('com.example/persons')
  })
})

describe('edited configuration steers the transformation', () => {
  // THE key acceptance test of the explicit configuration flow: a user
  // edits one option in the generated file and the transformation output
  // visibly changes (column naming convention).
  it('changes the generated relational model when an option is edited', async () => {
    const init = await run([
      'config', 'init', 'eer-to-relational', '--for', 'com.example/persons', '--out', 'com.example/persons-cfg-edited'
    ])
    expect(init.error).toBeUndefined()

    // The edit a user would make: SnakeCase -> CamelCase naming
    const editedPath = configPath('persons-cfg-edited')
    writeFileSync(editedPath, readFileSync(editedPath, 'utf-8').replaceAll('SnakeCase', 'CamelCase'))

    const defaults = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel-defaults'
    ])
    expect(defaults.error).toBeUndefined()
    const explicit = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/persons-cfg-edited', '--out', 'com.example/persons-rel-edited'
    ])
    expect(explicit.error).toBeUndefined()
    // Explicit decisions are announced without the '(default)' suffix
    expect(explicit.stdout).toContain('decision NamingConvention -> CamelCase')
    expect(explicit.stdout).not.toContain('CamelCase (default)')

    const defaultModel = readFileSync(configPath('persons-rel-defaults'), 'utf-8')
    const editedModel = readFileSync(configPath('persons-rel-edited'), 'utf-8')
    expect(defaultModel).toContain('name="person_id"')
    expect(defaultModel).not.toContain('name="personId"')
    expect(editedModel).toContain('name="personId"')
    expect(editedModel).not.toContain('name="person_id"')
  })

  it('records the explicit config ref in the generated model provenance', async () => {
    const { stdout, error } = await run(['model', 'show', 'com.example/persons-rel-edited', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.header.generatedBy.config).toBe('com.example/persons-cfg-edited')
  })
})

describe('model import of a configuration model', () => {
  it('round-trips through export/import only with --tx context', async () => {
    const exportedPath = join(tempDir, 'exported-cfg.tsx')
    const exported = await run(['model', 'export', 'com.example/persons-cfg', '--to', exportedPath])
    expect(exported.error).toBeUndefined()

    const withoutTx = await run(['model', 'import', exportedPath, '--as', 'com.example/persons-cfg-back'])
    expect(withoutTx.code).toBe(2)
    expect(flatten(withoutTx.stderr)).toContain('Import rejected')
    expect(flatten(withoutTx.stderr)).toContain('pass --tx')

    const withTx = await run([
      'model', 'import', exportedPath, '--as', 'com.example/persons-cfg-back', '--tx', 'eer-to-relational'
    ])
    expect(withTx.error).toBeUndefined()
    expect(withTx.stdout).toContain('Imported com.example/persons-cfg-back')
  })
})

describe('config rm', () => {
  it('deletes a configuration model', async () => {
    const { stdout, error } = await run(['config', 'rm', 'com.example/persons-cfg-back'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Deleted com.example/persons-cfg-back')
    expect(existsSync(configPath('persons-cfg-back'))).toBe(false)
  })

  it('refuses a ref that is not a configuration model (exit 2, with the model rm hint)', async () => {
    const { code, stderr } = await run(['config', 'rm', 'com.example/persons'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain('not a configuration model')
    expect(message).toContain('model rm')
    expect(existsSync(join(modelsDir, 'com', 'example', 'persons.tsx'))).toBe(true)
  })

  it('fails with NOT_FOUND for a missing ref', async () => {
    const { code } = await run(['config', 'rm', 'com.example/no-such-cfg'])
    expect(code).toBe(3)
  })
})

describe('config edit', () => {
  it('fails with NOT_FOUND for a missing ref', async () => {
    const { code, stderr } = await run(['config', 'edit', 'com.example/no-such-cfg'])
    expect(code).toBe(3)
    expect(stderr).toContain('Configuration model not found')
  })

  it('refuses a ref that is not a configuration model (exit 2, same contract as show/rm)', async () => {
    const { code, stderr } = await run(['config', 'edit', 'com.example/persons'])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain('not a configuration model')
  })

  it('refuses a headerless model instead of opening it (the old null-header bypass)', async () => {
    const rawPath = join(modelsDir, 'com', 'example', 'headerless.tsx')
    writeFileSync(rawPath, `export default (store) => ({ render: () => 'x' })\n`)
    try {
      const { code, stderr } = await run(['config', 'edit', 'com.example/headerless'])
      expect(code).toBe(2)
      expect(flatten(stderr)).toContain('is missing')
    } finally {
      rmSync(rawPath, { force: true })
    }
  })
})

describe('model validate --tx with a reference cycle', () => {
  it('renders each model of the cycle exactly once', async () => {
    // cycle-a and cycle-b reference each other; the closure must exclude
    // the validated file's own ref (like renderModelClosure's root
    // exclusion) or it renders twice and the store rejects the duplicate.
    const personsText = readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8')
    const cycleModel = (name: string, back: string): string =>
      personsText
        .replace('references: {},', `references: { back: '${back}' },`)
        .replace('name="Persons"', `name="${name}"`)
    const aPath = join(modelsDir, 'com', 'example', 'cycle-a.tsx')
    const bPath = join(modelsDir, 'com', 'example', 'cycle-b.tsx')
    writeFileSync(aPath, cycleModel('CycleA', 'com.example/cycle-b'))
    writeFileSync(bPath, cycleModel('CycleB', 'com.example/cycle-a'))
    try {
      const { stdout, error } = await run(['model', 'validate', 'com.example/cycle-a', '--tx', 'eer-to-relational'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('Model com.example/cycle-a is valid')
    } finally {
      rmSync(aPath, { force: true })
      rmSync(bPath, { force: true })
    }
  })
})

describe('tx run --save-config', () => {
  it('persists a configuration identical in decisions to config init output', async () => {
    const saved = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/persons-cfg-saved', '--out', 'com.example/persons-rel-saved'
    ])
    expect(saved.error).toBeUndefined()
    expect(saved.stdout).toContain('Wrote com.example/persons-cfg-saved')

    // The header carries fresh dates, but the serialized model itself must
    // match what config init generates for the same model
    expect(modelBody(configPath('persons-cfg-saved'))).toBe(modelBody(configPath('persons-cfg')))
  })

  it('refuses an existing --save-config target without --overwrite', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/persons-cfg-saved', '--out', 'com.example/persons-rel-saved2'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('Configuration model already exists')
    // Failing fast: the run must not have produced the output model either
    expect(existsSync(configPath('persons-rel-saved2'))).toBe(false)
  })
})
