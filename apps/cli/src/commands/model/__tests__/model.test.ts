import { chmodSync, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// Tests execute from lib/commands/model/__tests__; the .tsx fixture is not
// compiled by TypeScript, so it is referenced at its source location.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

// Isolated HOME so tests do not read or mutate the developer's ~/.synth
// workspace; the workspace lives at <home>/.synth (init default path).
let testHome: string
let tempDir: string
let modelsDir: string
let personsCopy: string

const run = (args: string[]) => runCli(args, { home: testHome })

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-model-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-model-test-'))
  modelsDir = join(testHome, '.synth', 'models')
  personsCopy = join(tempDir, 'persons.tsx')
  cpSync(personsFixture, personsCopy)
  await runCli(['init'], { home: testHome })
  await runCli(['ns', 'mk', 'com.example'], { home: testHome })
  await runCli(['cd', 'com.example'], { home: testHome })
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
  rmSync(tempDir, { recursive: true, force: true })
})

describe('model import', () => {
  it('requires file arg', async () => {
    const { error } = await run(['model', 'import'])
    expect(error).toBeDefined()
  })

  it('errors on non-existent source file', async () => {
    const { error, stderr } = await run(['model', 'import', '/nonexistent/file.tsx'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Source file not found')
  })

  it('rejects a source file that is not .tsx', async () => {
    const otherFile = join(tempDir, 'not-a-model.json')
    writeFileSync(otherFile, '{}')
    const { error, stderr } = await run(['model', 'import', otherFile])
    expect(error).toBeDefined()
    expect(stderr).toContain('.tsx')
  })

  it('rejects a model with an unresolvable import', async () => {
    const brokenFile = join(tempDir, 'broken.tsx')
    writeFileSync(
      brokenFile,
      [
        "import { nothing } from '@synthesis/this-package-does-not-exist'",
        'export default () => nothing',
        ''
      ].join('\n')
    )
    const { error, stderr } = await run(['model', 'import', brokenFile])
    expect(error).toBeDefined()
    expect(stderr).toContain('Import rejected')
    expect(stderr).toContain('this-package-does-not-exist')
    // Nothing may enter the workspace when validation fails
    expect(existsSync(join(modelsDir, 'com', 'example', 'broken.tsx'))).toBe(false)
  })

  it('imports into the current namespace without --as', async () => {
    const { stdout, error } = await run(['model', 'import', personsCopy])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Imported com.example/persons')
    expect(existsSync(join(modelsDir, 'com', 'example', 'persons.tsx'))).toBe(true)
  })

  it('refuses to overwrite an existing model without --force', async () => {
    const { error, stderr } = await run(['model', 'import', personsCopy])
    expect(error).toBeDefined()
    expect(stderr).toContain('already exists')
  })

  it('overwrites with --force and emits JSON', async () => {
    const { stdout, error } = await run(['model', 'import', personsCopy, '--force', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.imported).toBe('com.example/persons')
    expect(parsed.source).toBe(personsCopy)
    expect(parsed.destination).toBe(join(modelsDir, 'com', 'example', 'persons.tsx'))
  })

  it('imports with --as into a nested namespace, honoring header flags', async () => {
    const { stdout, error } = await run([
      'model',
      'import',
      personsCopy,
      '--as',
      'other.ns/custom',
      '--tags',
      'eer,demo',
      '--description',
      'imported-via-test'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Imported other.ns/custom')
    expect(existsSync(join(modelsDir, 'other', 'ns', 'custom.tsx'))).toBe(true)

    const { stdout: showOut } = await run(['model', 'show', 'other.ns/custom', '--json'])
    const shown = JSON.parse(showOut)
    expect(shown.header.tags).toEqual(['eer', 'demo'])
    expect(shown.header.description).toBe('imported-via-test')
  })

  it('stamps the $synth header on import', async () => {
    const { stdout, error } = await run(['model', 'show', 'com.example/persons', '--json'])
    expect(error).toBeUndefined()
    const { header } = JSON.parse(stdout)
    expect(header.kind).toBe('model')
    expect(header.metamodel).toBe('eer-metamodel')
    // Human fields from the fixture's hand-written header survive the merge
    expect(header.author).toBe('Test Author <test@example.org>')
    expect(header.version).toBe('0.1.0')
    expect(header.description).toBe('Persons EER schema used by the model loader tests')
    expect(typeof header.author).toBe('string')
    expect(header.author.length).toBeGreaterThan(0)
    expect(header.createdAt).toMatch(ISO_DATE_RE)
    expect(header.modifiedAt).toMatch(ISO_DATE_RE)
    expect(header.generatedBy).toBeNull()
    expect(header.references).toEqual({})
  })
})

describe('model ls', () => {
  beforeAll(() => {
    // A hand-placed model without a header: the fixture with the $synth
    // export stripped still renders but has nothing to parse
    const text = readFileSync(personsFixture, 'utf-8')
    const headerless = text.replace(/export const \$synth = \{[\s\S]*?\} as const\n/, '')
    writeFileSync(join(modelsDir, 'com', 'example', 'raw.tsx'), headerless)
  })

  it('lists models with header columns', async () => {
    const { stdout, error } = await run(['model', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example/persons')
    expect(stdout).toContain('model')
    expect(stdout).toContain('0.1.0')
    expect(stdout).toContain('Persons EER schema used by the model loader tests')
  })

  it('marks files without a header', async () => {
    const { stdout, error } = await run(['model', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example/raw')
    expect(stdout).toContain('(no header)')
  })

  it('filters by --ns', async () => {
    const { stdout, error } = await run(['model', 'ls', '--ns', 'other.ns'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('other.ns/custom')
    expect(stdout).not.toContain('com.example/persons')
  })

  it('outputs a JSON array of { ref, header }', async () => {
    const { stdout, error } = await run(['model', 'ls', '--json'])
    expect(error).toBeUndefined()
    const rows = JSON.parse(stdout)
    expect(Array.isArray(rows)).toBe(true)
    const persons = rows.find((row: { ref: string }) => row.ref === 'com.example/persons')
    expect(persons.header.kind).toBe('model')
    const raw = rows.find((row: { ref: string }) => row.ref === 'com.example/raw')
    expect(raw.header).toBeNull()
  })

  it('reports an empty namespace', async () => {
    await run(['ns', 'mk', 'empty.ns'])
    const { stdout, error } = await run(['model', 'ls', '--ns', 'empty.ns'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('No models found')
  })

  it('errors with NOT_FOUND for a --ns naming a namespace that does not exist', async () => {
    const { code, error, stderr } = await run(['model', 'ls', '--ns', 'no.such.ns'])
    expect(error).toBeDefined()
    expect(code).toBe(3)
    expect(stderr).toContain('no.such.ns')

    const jsonRes = await run(['model', 'ls', '--ns', 'no.such.ns', '--json'])
    expect(jsonRes.error).toBeDefined()
    expect(jsonRes.code).toBe(3)
    expect(JSON.parse(jsonRes.stdout).error).toContain('no.such.ns')
  })

  it('marks an unreadable model file instead of failing the listing', async () => {
    await run(['ns', 'mk', 'com.unread'])
    const filePath = join(modelsDir, 'com', 'unread', 'secret.tsx')
    writeFileSync(filePath, 'export default () => null\n')
    chmodSync(filePath, 0o000)
    try {
      const { stdout, error } = await run(['model', 'ls', '--ns', 'com.unread'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('com.unread/secret')
      expect(stdout).toContain('(unreadable)')

      const jsonRes = await run(['model', 'ls', '--ns', 'com.unread', '--json'])
      expect(jsonRes.error).toBeUndefined()
      const row = JSON.parse(jsonRes.stdout).find(
        (r: { ref: string }) => r.ref === 'com.unread/secret'
      )
      expect(row.header).toBeNull()
      expect(typeof row.error).toBe('string')
      expect(row.error.length).toBeGreaterThan(0)
    } finally {
      chmodSync(filePath, 0o644)
      rmSync(filePath)
    }
  })
})

describe('model show', () => {
  it('requires ref arg', async () => {
    const { error } = await run(['model', 'show'])
    expect(error).toBeDefined()
  })

  it('displays header fields, path, and size', async () => {
    const { stdout, error } = await run(['model', 'show', 'com.example/persons'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example/persons')
    expect(stdout).toContain(join(modelsDir, 'com', 'example', 'persons.tsx'))
    expect(stdout).toContain('bytes')
    expect(stdout).toContain('model')
    expect(stdout).toContain('eer-metamodel')
  })

  it('reports a missing header but still shows path and size', async () => {
    const { stdout, error } = await run(['model', 'show', 'com.example/raw'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('no $synth header')
    expect(stdout).toContain(join(modelsDir, 'com', 'example', 'raw.tsx'))
    expect(stdout).toContain('bytes')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await run(['model', 'show', 'com.example/raw', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.ref).toBe('com.example/raw')
    expect(parsed.path).toBe(join(modelsDir, 'com', 'example', 'raw.tsx'))
    expect(parsed.header).toBeNull()
  })

  it('errors on invalid ref format', async () => {
    const { error } = await run(['model', 'show', 'invalid-ref'])
    expect(error).toBeDefined()
  })

  it('errors on non-existent model', async () => {
    const { error, stderr } = await run(['model', 'show', 'com.example/nonexistent'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found')
  })
})

describe('model validate', () => {
  it('requires ref arg', async () => {
    const { error } = await run(['model', 'validate'])
    expect(error).toBeDefined()
  })

  it('renders the model and reports per-check results', async () => {
    const { stdout, error } = await run(['model', 'validate', 'com.example/persons'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[ok] file transpiles and imports')
    expect(stdout).toContain('[ok] default export renders')
    expect(stdout).toContain('[ok] $synth header present')
    expect(stdout).toContain('[ok] header.metamodel matches the metamodel import')
    expect(stdout).toContain('Model com.example/persons is valid')
  })

  it('warns but succeeds when the header is missing', async () => {
    const { stdout, error } = await run(['model', 'validate', 'com.example/raw'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[warn] no $synth header')
    expect(stdout).toContain('Model com.example/raw is valid')
  })

  it('checks header.metamodel against --against', async () => {
    const { stdout, error } = await run([
      'model',
      'validate',
      'com.example/persons',
      '--against',
      'eer-metamodel'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[ok] header.metamodel matches --against')
  })

  it('fails when header.metamodel does not match --against', async () => {
    const { code, error, stderr } = await run([
      'model',
      'validate',
      'com.example/persons',
      '--against',
      '@wrong/metamodel'
    ])
    expect(error).toBeDefined()
    expect(code).toBe(2)
    // oclif wraps long error messages, so assert on tokens that cannot wrap
    expect(stderr).toContain('header.metamodel')
    expect(stderr).toContain('@wrong/metamodel')
  })

  it('keeps a declared header.metamodel on import and only warns on derived drift', async () => {
    // The header declares a metamodel differing from the derived import:
    // the declaration wins the stamp, and validate reports the difference
    // as a warning instead of failing
    const declaredFile = join(tempDir, 'declared.tsx')
    const text = readFileSync(personsFixture, 'utf-8').replace(
      "metamodel: 'eer-metamodel'",
      "metamodel: '@example/custom-metamodel'"
    )
    writeFileSync(declaredFile, text)
    const imported = await run(['model', 'import', declaredFile, '--as', 'com.example/declared'])
    expect(imported.error).toBeUndefined()

    const { stdout: showOut } = await run(['model', 'show', 'com.example/declared', '--json'])
    expect(JSON.parse(showOut).header.metamodel).toBe('@example/custom-metamodel')

    const validated = await run(['model', 'validate', 'com.example/declared'])
    expect(validated.error).toBeUndefined()
    expect(validated.stdout).toContain('[warn] header.metamodel')
    expect(validated.stdout).toContain('@example/custom-metamodel')
    expect(validated.stdout).toContain('Model com.example/declared is valid')

    // An explicit --against mismatch is still a failure
    const against = await run([
      'model',
      'validate',
      'com.example/declared',
      '--against',
      'eer-metamodel'
    ])
    expect(against.error).toBeDefined()
    expect(against.code).toBe(2)

    await run(['model', 'rm', 'com.example/declared'])
  })

  it('reports the derived-metamodel heads-up for non-model kinds too', async () => {
    // A decision-model/metamodel file imports its metamodel like any other
    // model; only configuration models (component-module imports) are
    // exempt from the consistency heads-up.
    const stamped = readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8')
    const mmPath = join(modelsDir, 'com', 'example', 'mm-kind.tsx')
    writeFileSync(mmPath, stamped.replace("kind: 'model',", "kind: 'metamodel',"))
    try {
      const { stdout, error } = await run(['model', 'validate', 'com.example/mm-kind'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('[ok] header.metamodel matches the metamodel import')
      expect(stdout).toContain('Model com.example/mm-kind is valid')
    } finally {
      rmSync(mmPath, { force: true })
    }
  })

  it('fails with the underlying cause when the model does not render', async () => {
    const brokenPath = join(modelsDir, 'com', 'example', 'unrenderable.tsx')
    writeFileSync(
      brokenPath,
      [
        "import { nothing } from '@synthesis/this-package-does-not-exist'",
        'export default () => nothing',
        ''
      ].join('\n')
    )
    const { error, stderr } = await run(['model', 'validate', 'com.example/unrenderable'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Validation failed')
    expect(stderr).toContain('this-package-does-not-exist')
    rmSync(brokenPath)
  })

  it('errors when model not found', async () => {
    const { error, stderr } = await run(['model', 'validate', 'ns/nonexistent'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found')
  })

  it('validates model ref format', async () => {
    const { error, stderr } = await run(['model', 'validate', 'invalid-ref'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Invalid model ref')
  })
})

describe('model export', () => {
  it('requires ref arg', async () => {
    const { error } = await run(['model', 'export'])
    expect(error).toBeDefined()
  })

  it('exports the file verbatim, header included', async () => {
    const destFile = join(tempDir, 'exported.tsx')
    const { stdout, error } = await run(['model', 'export', 'com.example/persons', '--to', destFile])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Exported com.example/persons')
    expect(stdout).toContain(destFile)
    const exported = readFileSync(destFile, 'utf-8')
    expect(exported).toContain('export const $synth')
    expect(exported).toBe(readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8'))
  })

  it('defaults the destination to ./<name>.tsx', async () => {
    const { stdout, error } = await runCli(['model', 'export', 'com.example/persons'], {
      home: testHome,
      cwd: tempDir
    })
    expect(error).toBeUndefined()
    expect(stdout).toContain(join(tempDir, 'persons.tsx'))
    expect(existsSync(join(tempDir, 'persons.tsx'))).toBe(true)
  })

  it('outputs JSON with --json flag', async () => {
    const destFile = join(tempDir, 'export-json.tsx')
    const { stdout, error } = await run([
      'model',
      'export',
      'com.example/persons',
      '--to',
      destFile,
      '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.exported).toBe('com.example/persons')
    expect(parsed.destination).toBe(destFile)
  })

  it('round-trips: an exported model imports again', async () => {
    const destFile = join(tempDir, 'roundtrip.tsx')
    await run(['model', 'export', 'com.example/persons', '--to', destFile])
    const { stdout, error } = await run(['model', 'import', destFile, '--as', 'com.example/persons2'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Imported com.example/persons2')

    const { stdout: showOut } = await run(['model', 'show', 'com.example/persons2', '--json'])
    const { header } = JSON.parse(showOut)
    expect(header.kind).toBe('model')
    expect(header.metamodel).toBe('eer-metamodel')
  })

  it('errors on non-existent model', async () => {
    const { error, stderr } = await run(['model', 'export', 'com.example/nonexistent'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found')
  })
})

describe('model rm', () => {
  it('requires ref arg', async () => {
    const { error } = await run(['model', 'rm'])
    expect(error).toBeDefined()
  })

  it('deletes a model file at its nested path', async () => {
    const modelPath = join(modelsDir, 'com', 'example', 'persons2.tsx')
    expect(existsSync(modelPath)).toBe(true)
    const { stdout, error } = await run(['model', 'rm', 'com.example/persons2'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Deleted com.example/persons2')
    expect(existsSync(modelPath)).toBe(false)
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await run(['model', 'rm', 'com.example/raw', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.deleted).toBe('com.example/raw')
    expect(existsSync(join(modelsDir, 'com', 'example', 'raw.tsx'))).toBe(false)
  })

  it('errors on invalid ref format', async () => {
    const { error } = await run(['model', 'rm', 'invalid-ref'])
    expect(error).toBeDefined()
  })

  it('errors on non-existent model', async () => {
    const { error, stderr } = await run(['model', 'rm', 'com.example/nonexistent'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found')
  })
})

describe('deletion dependency guard', () => {
  const targetRef = 'com.example/guard-target'
  const holderRef = 'com.example/guard-holder'

  const injectReference = (filePath: string, entry: string) => {
    const text = readFileSync(filePath, 'utf-8')
    const updated = text.replace('references: {}', `references: { ${entry} }`)
    expect(updated).not.toBe(text)
    writeFileSync(filePath, updated)
  }

  const grandRef = 'com.example/guard-grand'

  beforeAll(async () => {
    await run(['model', 'import', personsCopy, '--as', targetRef])
    await run(['model', 'import', personsCopy, '--as', holderRef])
    await run(['model', 'import', personsCopy, '--as', grandRef])
    injectReference(
      join(modelsDir, 'com', 'example', 'guard-holder.tsx'),
      `basedOn: '${targetRef}'`
    )
    injectReference(
      join(modelsDir, 'com', 'example', 'guard-grand.tsx'),
      `uses: '${holderRef}'`
    )
  })

  it('model rm refuses and prints the transitive dependency graph', async () => {
    const { error, stderr, code } = await run(['model', 'rm', targetRef])
    expect(error).toBeDefined()
    expect(code).toBe(2)
    expect(stderr).toContain('guard-holder')
    expect(stderr).toContain('guard-grand')
    expect(stderr).toContain('--cascade')
    expect(existsSync(join(modelsDir, 'com', 'example', 'guard-target.tsx'))).toBe(true)
  })

  it('model rm --json refusal exits non-zero naming the dependents', async () => {
    const { stdout, code } = await run(['model', 'rm', targetRef, '--json'])
    expect(code).toBe(2)
    const parsed = JSON.parse(stdout)
    expect(parsed.error).toContain('guard-holder')
    expect(existsSync(join(modelsDir, 'com', 'example', 'guard-target.tsx'))).toBe(true)
  })

  it('model rm --cascade deletes the whole closure and doctor stays clean', async () => {
    const { stdout, error } = await run(['model', 'rm', targetRef, '--cascade', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.deleted).toBe(targetRef)
    expect(parsed.cascaded).toEqual(expect.arrayContaining([holderRef, grandRef]))
    expect(existsSync(join(modelsDir, 'com', 'example', 'guard-target.tsx'))).toBe(false)
    expect(existsSync(join(modelsDir, 'com', 'example', 'guard-holder.tsx'))).toBe(false)
    expect(existsSync(join(modelsDir, 'com', 'example', 'guard-grand.tsx'))).toBe(false)
    const doctor = await run(['doctor'])
    expect(doctor.stdout).toContain('All header references resolve')
  })

  it('ns rm refuses when outside models depend on it; --cascade deletes them too', async () => {
    await run(['ns', 'mk', 'com.dephold'])
    await run(['model', 'import', personsCopy, '--as', 'com.dephold/inner'])
    await run(['model', 'import', personsCopy, '--as', 'com.example/outer-holder'])
    injectReference(
      join(modelsDir, 'com', 'example', 'outer-holder.tsx'),
      "uses: 'com.dephold/inner'"
    )

    const refusal = await run(['ns', 'rm', 'com.dephold', '--force'])
    expect(refusal.error).toBeDefined()
    expect(refusal.stderr).toContain('outer-holder')
    expect(refusal.stderr).toContain('--cascade')

    const { stdout, error } = await run(['ns', 'rm', 'com.dephold', '--cascade', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.removed).toBe(true)
    expect(parsed.cascaded).toEqual(['com.example/outer-holder'])
    expect(existsSync(join(modelsDir, 'com', 'example', 'outer-holder.tsx'))).toBe(false)
    expect(existsSync(join(modelsDir, 'com', 'dephold'))).toBe(false)
  })
})

describe('--json failures exit non-zero', () => {
  // Scripts must see failures in the exit code; the {error} JSON object is
  // the only stdout output in JSON mode.
  it('model show: missing model exits NOT_FOUND with an {error} payload', async () => {
    const { stdout, code, error } = await run(['model', 'show', 'com.example/nonexistent', '--json'])
    expect(error).toBeDefined()
    expect(code).toBe(3)
    expect(JSON.parse(stdout)).toEqual({ error: expect.stringContaining('Model not found') })
  })

  it('model rm: missing model exits NOT_FOUND with an {error} payload', async () => {
    const { stdout, code, error } = await run(['model', 'rm', 'com.example/nonexistent', '--json'])
    expect(error).toBeDefined()
    expect(code).toBe(3)
    expect(JSON.parse(stdout)).toEqual({ error: expect.stringContaining('Model not found') })
  })

  it('model export: missing model exits NOT_FOUND with an {error} payload', async () => {
    const { stdout, code, error } = await run(['model', 'export', 'com.example/nonexistent', '--json'])
    expect(error).toBeDefined()
    expect(code).toBe(3)
    expect(JSON.parse(stdout)).toEqual({ error: expect.stringContaining('Model not found') })
  })

  it('model import: missing source exits NOT_FOUND with an {error} payload', async () => {
    const { stdout, code, error } = await run(['model', 'import', '/nonexistent/file.tsx', '--json'])
    expect(error).toBeDefined()
    expect(code).toBe(3)
    expect(JSON.parse(stdout)).toEqual({ error: expect.stringContaining('Source file not found') })
  })

  it('model show: invalid ref exits FAILURE with an {error} payload', async () => {
    const { stdout, code, error } = await run(['model', 'show', 'invalid-ref', '--json'])
    expect(error).toBeDefined()
    expect(code).toBe(1)
    expect(JSON.parse(stdout)).toEqual({ error: expect.stringContaining('Invalid ref') })
  })
})
