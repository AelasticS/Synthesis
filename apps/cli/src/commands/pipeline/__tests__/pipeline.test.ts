import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// The `pipeline` topic (canonical name; `pl` is the typing alias). A
// pipeline is a NAMED PROCESS (steps only, no data bindings) stored as
// plain JSON at pipelines/<name>.json. Hand-writing files here is a
// legitimate way to arrange states (that IS the format), while `pipeline
// mk` and `transformation run --save-as` cover the tool-written paths.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

let testHome: string
let tempDir: string
let pipelinesDir: string

const run = (args: string[], env?: Record<string, string>) => runCli(args, { home: testHome, env })

// oclif wraps stderr at terminal width, inserting '·\n ›' inside messages;
// flatten the wrapping so substring assertions can span line breaks.
const flatten = (text: string): string => text.replace(/·?\s*\n\s*›?\s*/g, ' ')

const writePipeline = (name: string, definition: Record<string, unknown>): void => {
  mkdirSync(pipelinesDir, { recursive: true })
  writeFileSync(join(pipelinesDir, `${name}.json`), JSON.stringify(definition, null, 2) + '\n')
}

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-pipeline-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-pipeline-out-'))
  pipelinesDir = join(testHome, '.synth', 'pipelines')
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

describe('pipeline mk (static authoring, nothing executes)', () => {
  it('saves a process-only file after manifest-driven validation, without executing anything', async () => {
    const { stdout, error } = await run(['pipeline', 'mk', 'gen-sql', 'eer-to-relational', 'rel-to-sql-ddl'])
    expect(error).toBeUndefined()
    expect(stdout).toContain(`Saved pipeline 'gen-sql'`)
    expect(stdout).toContain('synth pipeline run gen-sql --in <ref>')
    const saved = JSON.parse(readFileSync(join(pipelinesDir, 'gen-sql.json'), 'utf-8'))
    // The schema is process-only: EXACTLY these fields, no data bindings
    expect(Object.keys(saved).sort()).toEqual(['createdAt', 'description', 'modifiedAt', 'name', 'steps'])
    expect(saved.name).toBe('gen-sql')
    expect(saved.steps).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
    // Static means static: no model was read, no output produced
    const models = readdirSync(join(testHome, '.synth', 'models', 'com', 'example'))
    expect(models).toEqual(['persons.tsx'])
  })

  it('rejects a chain whose metamodels do not line up, naming the pair (exit 2), without executing', async () => {
    const { code, stderr } = await run(['pipeline', 'mk', 'bad-chain', 'eer-to-relational', 'eer-to-relational'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain('Chain type mismatch')
    expect(message).toContain('step 1 (eer-to-relational)')
    expect(message).toContain('step 2 (eer-to-relational)')
    expect(message).toContain('@synthesis/standard-metamodels/relational')
    expect(message).toContain('@synthesis/standard-metamodels/eer')
    expect(existsSync(join(pipelinesDir, 'bad-chain.json'))).toBe(false)
  })

  it('rejects an m2t step in the middle (text is terminal)', async () => {
    const { code, stderr } = await run(['pipeline', 'mk', 'bad-m2t', 'rel-to-sql-ddl', 'rel-to-sql-ddl'])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('step 1 (rel-to-sql-ddl) is m2t')
    expect(message).toContain('last step')
    expect(existsSync(join(pipelinesDir, 'bad-m2t.json'))).toBe(false)
  })

  it('rejects a step that is not installed (exit 3)', async () => {
    const { code, stderr } = await run(['pipeline', 'mk', 'ghostly', 'eer-to-relational', 'ghost-tx'])
    expect(code).toBe(3)
    expect(flatten(stderr)).toContain('Transformation not found: ghost-tx')
    expect(existsSync(join(pipelinesDir, 'ghostly.json'))).toBe(false)
  })

  it('rejects a name that would shadow an installed transformation', async () => {
    const { code, stderr } = await run(['pipeline', 'mk', 'eer-to-relational', 'eer-to-relational'])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('would shadow the installed transformation')
    expect(existsSync(join(pipelinesDir, 'eer-to-relational.json'))).toBe(false)
  })

  it('rejects a name that is not a valid path segment', async () => {
    const { code, stderr } = await run(['pipeline', 'mk', 'bad.name', 'eer-to-relational'])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain(`Invalid pipeline name 'bad.name'`)
  })

  it('rejects a pipeline without steps', async () => {
    const { code, stderr } = await run(['pipeline', 'mk', 'lonely'])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('at least one step')
  })

  it('refuses to replace an existing pipeline without --overwrite; --overwrite preserves createdAt', async () => {
    const before = JSON.parse(readFileSync(join(pipelinesDir, 'gen-sql.json'), 'utf-8'))

    const refused = await run(['pipeline', 'mk', 'gen-sql', 'eer-to-relational'])
    expect(refused.code).toBe(1)
    expect(flatten(refused.stderr)).toContain('Pipeline already exists: gen-sql')

    const replaced = await run([
      'pipeline', 'mk', 'gen-sql', 'eer-to-relational', 'rel-to-sql-ddl', '--overwrite', '--description', 'EER-to-DDL'
    ])
    expect(replaced.error).toBeUndefined()
    const after = JSON.parse(readFileSync(join(pipelinesDir, 'gen-sql.json'), 'utf-8'))
    expect(after.createdAt).toBe(before.createdAt)
    expect(after.modifiedAt >= before.modifiedAt).toBe(true)
    expect(after.description).toBe('EER-to-DDL')
  })
})

describe('pipeline run (canonical) and pl run (alias)', () => {
  it('runs the saved steps on the model named with --in, through the full normal pre-flight', async () => {
    const genDir = join(tempDir, 'run-gen')
    const { stdout, error } = await run([
      'pipeline', 'run', 'gen-sql', '--in', 'com.example/persons', '--default-configs', '--out-dir', genDir
    ])
    expect(error).toBeUndefined()
    // Identical request path as transformation run: per-step announcements
    expect(stdout).toContain('[step 1/2 eer-to-relational] decision NamingConvention -> SnakeCase (default)')
    expect(stdout).toContain('[step 2/2 rel-to-sql-ddl] decision IdentifierQuoting -> Unquoted (default)')
    const sqlFiles = readdirSync(genDir).filter((name) => name.endsWith('.sql'))
    expect(sqlFiles.length).toBe(1)
    expect(readFileSync(join(genDir, sqlFiles[0]), 'utf-8')).toContain('CREATE TABLE person')
  })

  it('requires --in with a clear error (a pipeline stores no data bindings)', async () => {
    const { code, stderr } = await run(['pipeline', 'run', 'gen-sql'])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('Missing required flag --in')
    expect(message).toContain('synth pipeline run gen-sql --in <ref>')
  })

  it('aborts without configuration consent, exactly like transformation run (exit 2)', async () => {
    const { code, stderr } = await run([
      'pipeline', 'run', 'gen-sql', '--in', 'com.example/persons', '--out-dir', join(tempDir, 'never-consent')
    ])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain('decision-based')
    expect(existsSync(join(tempDir, 'never-consent'))).toBe(false)
  })

  it('exits 3 for an unknown pipeline name', async () => {
    const { code, stderr } = await run(['pipeline', 'run', 'ghost-pipe', '--in', 'com.example/persons'])
    expect(code).toBe(3)
    const message = flatten(stderr)
    expect(message).toContain('Pipeline not found: ghost-pipe')
    expect(message).toContain('pipeline ls')
  })

  it('exits 2 for an invalid pipeline file, listing every schema problem (legacy binding fields rejected)', async () => {
    writePipeline('legacy', {
      name: 'legacy',
      steps: ['eer-to-relational'],
      in: 'com.example/persons',
      defaultConfigs: true
    })
    const { code, stderr } = await run(['pipeline', 'run', 'legacy', '--in', 'com.example/persons'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`Pipeline 'legacy' is invalid`)
    expect(message).toContain(`unknown field 'in'`)
    expect(message).toContain(`unknown field 'defaultConfigs'`)
    expect(message).toContain('pipeline edit')
    rmSync(join(pipelinesDir, 'legacy.json'))
  })

  it('pl run behaves identically (typing alias)', async () => {
    const genDir = join(tempDir, 'pl-gen')
    const { stdout, error } = await run([
      'pl', 'run', 'gen-sql', '--in', 'com.example/persons', '--default-configs', '--out-dir', genDir, '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.in).toBe('com.example/persons')
    expect(parsed.steps.map((step: { tx: string }) => step.tx)).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
    expect(readdirSync(genDir).filter((name) => name.endsWith('.sql')).length).toBe(1)
  })

  it('transformation run never resolves pipeline names (no guessing)', async () => {
    const { code, stderr } = await run(['tx', 'run', 'gen-sql', '--in', 'com.example/persons'])
    expect(code).toBe(3)
    expect(flatten(stderr)).toContain('Transformation not found: gen-sql')
  })
})

describe('transformation run --save-as', () => {
  it('writes a process-only pipeline file after a successful run', async () => {
    const { stdout, error } = await run([
      'transformation', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel', '--save-as', 'to-rel'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain(`Saved pipeline 'to-rel'`)
    const saved = JSON.parse(readFileSync(join(pipelinesDir, 'to-rel.json'), 'utf-8'))
    // Same schema as pipeline mk: the steps, never the bindings
    expect(Object.keys(saved).sort()).toEqual(['createdAt', 'description', 'modifiedAt', 'name', 'steps'])
    expect(saved).toMatchObject({ name: 'to-rel', steps: ['eer-to-relational'] })
  })

  it('rejects a name that would shadow an installed transformation, before any engine work', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/never1', '--save-as', 'rel-to-sql-ddl'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('would shadow the installed transformation')
    expect(existsSync(join(testHome, '.synth', 'models', 'com', 'example', 'never1.tsx'))).toBe(false)
  })

  it('rejects --save-as combined with --save-config', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/never-cfg', '--out', 'com.example/never2', '--save-as', 'to-rel2'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('--save-as and --save-config cannot be combined')
  })

  it('refuses an existing pipeline in pre-flight; --overwrite preserves createdAt and description', async () => {
    const before = JSON.parse(readFileSync(join(pipelinesDir, 'to-rel.json'), 'utf-8'))

    const refused = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/never3', '--save-as', 'to-rel'
    ])
    expect(refused.code).toBe(1)
    expect(flatten(refused.stderr)).toContain('Pipeline already exists: to-rel')
    // Refused in pre-flight: the run's --out target was never written
    expect(existsSync(join(testHome, '.synth', 'models', 'com', 'example', 'never3.tsx'))).toBe(false)

    const replaced = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel2', '--save-as', 'to-rel', '--overwrite'
    ])
    expect(replaced.error).toBeUndefined()
    const after = JSON.parse(readFileSync(join(pipelinesDir, 'to-rel.json'), 'utf-8'))
    expect(after.createdAt).toBe(before.createdAt)
    expect(after.modifiedAt >= before.modifiedAt).toBe(true)
  })
})

describe('pipeline ls / show / rm', () => {
  it('lists saved pipelines with their steps, warning about invalid files', async () => {
    writePipeline('broken', { name: 'broken', steps: 'not-an-array' })
    const { stdout, stderr, error } = await run(['pipeline', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('gen-sql')
    expect(stdout).toContain('eer-to-relational -> rel-to-sql-ddl')
    expect(stdout).toContain('to-rel')
    expect(flatten(stderr)).toContain(`Pipeline 'broken' is invalid`)

    const jsonRun = await run(['pipeline', 'ls', '--json'])
    expect(jsonRun.error).toBeUndefined()
    const rows = JSON.parse(jsonRun.stdout)
    expect(rows).toContainEqual({
      name: 'gen-sql',
      steps: ['eer-to-relational', 'rel-to-sql-ddl'],
      description: 'EER-to-DDL'
    })
    expect(rows.map((row: { name: string }) => row.name)).not.toContain('broken')
  })

  it('shows every field of a pipeline, in both output modes', async () => {
    const human = await run(['pipeline', 'show', 'gen-sql'])
    expect(human.error).toBeUndefined()
    expect(human.stdout).toContain('Name:         gen-sql')
    expect(human.stdout).toContain('Steps:        eer-to-relational -> rel-to-sql-ddl')
    expect(human.stdout).toContain('Description:  EER-to-DDL')
    expect(human.stdout).toContain('synth pipeline run gen-sql --in <ref>')

    const jsonRun = await run(['pl', 'show', 'gen-sql', '--json'])
    expect(jsonRun.error).toBeUndefined()
    const parsed = JSON.parse(jsonRun.stdout)
    expect(parsed.name).toBe('gen-sql')
    expect(parsed.steps).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
    expect(parsed.path).toBe(join(pipelinesDir, 'gen-sql.json'))
  })

  it('show exits 3 for a missing pipeline (JSON contract included)', async () => {
    const { code, stderr } = await run(['pipeline', 'show', 'ghost-pipe'])
    expect(code).toBe(3)
    expect(flatten(stderr)).toContain('Pipeline not found: ghost-pipe')

    const jsonRun = await run(['pipeline', 'show', 'ghost-pipe', '--json'])
    expect(jsonRun.code).toBe(3)
    expect(JSON.parse(jsonRun.stdout).error).toContain('Pipeline not found')
  })

  it('show exits 2 for an invalid pipeline file, listing every schema problem', async () => {
    const { code, stderr } = await run(['pipeline', 'show', 'broken'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`Pipeline 'broken' is invalid`)
    expect(message).toContain(`field 'steps'`)
  })

  it('rm deletes a pipeline without any dependency check; missing exits 3', async () => {
    const { stdout, error } = await run(['pipeline', 'rm', 'broken'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Deleted pipeline broken')
    expect(existsSync(join(pipelinesDir, 'broken.json'))).toBe(false)

    const missing = await run(['pl', 'rm', 'broken'])
    expect(missing.code).toBe(3)
  })
})

describe('pipeline edit', () => {
  it('re-validates statically after the editor closes: schema problems AND chain problems are warnings', async () => {
    writePipeline('edited', {
      name: 'edited',
      steps: ['eer-to-relational'],
      in: 'com.example/persons',
      description: 42
    })
    // EDITOR=true: the no-op editor exits 0 leaving the file as arranged
    const schemaRun = await run(['pipeline', 'edit', 'edited'], { EDITOR: 'true' })
    expect(schemaRun.error).toBeUndefined()
    const schemaMessage = flatten(schemaRun.stderr)
    expect(schemaMessage).toContain(`Pipeline 'edited': unknown field 'in'`)
    expect(schemaMessage).toContain(`field 'description' must be a string`)
    expect(schemaMessage).toContain(`'synth pipeline run edited' will refuse`)

    // A schema-valid file with an uninstalled step gets the static chain check
    writePipeline('edited', { name: 'edited', steps: ['ghost-tx'] })
    const chainRun = await run(['pipeline', 'edit', 'edited'], { EDITOR: 'true' })
    expect(chainRun.error).toBeUndefined()
    expect(flatten(chainRun.stderr)).toContain('Transformation not found: ghost-tx')
    rmSync(join(pipelinesDir, 'edited.json'))
  })

  it('supports an $EDITOR value carrying arguments (split on whitespace)', async () => {
    writePipeline('argv-editor', { name: 'argv-editor', steps: ['eer-to-relational'] })
    // 'env true' would break if the whole value were spawned as one binary
    const { stderr, error } = await run(['pipeline', 'edit', 'argv-editor'], { EDITOR: 'env true' })
    expect(error).toBeUndefined()
    expect(stderr).toBe('')
    rmSync(join(pipelinesDir, 'argv-editor.json'))
  })

  it('exits 3 for a missing pipeline before spawning any editor', async () => {
    const { code } = await run(['pipeline', 'edit', 'ghost-pipe'], { EDITOR: 'true' })
    expect(code).toBe(3)
  })
})

describe('transformation uninstall pipeline guard', () => {
  it('checks existence FIRST: an unknown transformation exits 3 with no pipeline scan', async () => {
    const { code, stderr } = await run(['tx', 'uninstall', 'ghost-tx'])
    expect(code).toBe(3)
    expect(flatten(stderr)).toContain('Transformation not found: ghost-tx')
  })

  it('refuses while a saved pipeline uses the transformation as a step', async () => {
    const { code, stderr } = await run(['tx', 'uninstall', 'rel-to-sql-ddl'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`Cannot uninstall 'rel-to-sql-ddl'`)
    expect(message).toContain('gen-sql')
    expect(message).toContain('pipeline rm')
    // Still installed
    const ls = await run(['transformation', 'ls'])
    expect(ls.stdout).toContain('rel-to-sql-ddl')

    // JSON contract: machine-readable error AND exit 2
    const jsonRun = await run(['tx', 'uninstall', 'rel-to-sql-ddl', '--json'])
    expect(jsonRun.code).toBe(2)
    expect(JSON.parse(jsonRun.stdout).error).toContain('gen-sql')
  })

  it('an INVALID pipeline file still protects its steps (lenient extraction)', async () => {
    writePipeline('invalid-guard', {
      name: 'wrong-name-on-purpose',
      steps: ['eer-to-relational'],
      in: 'legacy-field'
    })
    const { code, stderr } = await run(['tx', 'uninstall', 'eer-to-relational'])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain('invalid-guard')
    rmSync(join(pipelinesDir, 'invalid-guard.json'))
  })
})

describe('workspace guard', () => {
  it('pipeline commands require an initialized workspace', async () => {
    const bareHome = mkdtempSync(join(tmpdir(), 'synth-pipeline-bare-'))
    try {
      const { code, stderr } = await runCli(['pipeline', 'ls'], { home: bareHome })
      expect(code).toBe(4)
      expect(flatten(stderr)).toContain('Workspace not initialized')
    } finally {
      rmSync(bareHome, { recursive: true, force: true })
    }
  })
})

describe('doctor pipeline checks', () => {
  it('warns about schema violations, uninstalled steps, and chain mismatches: the pipeline mk checks', async () => {
    writePipeline('ghost', { name: 'ghost', steps: ['ghost-tx'] })
    writePipeline('mismatched', { name: 'mismatched', steps: ['eer-to-relational', 'eer-to-relational'] })
    writePipeline('legacy', { name: 'legacy', steps: ['eer-to-relational'], in: 'com.example/persons' })
    writeFileSync(join(pipelinesDir, 'garbage.json'), 'not json at all\n')

    const { stdout, error } = await run(['doctor'])
    // Pipeline problems are warnings, never errors: doctor still exits 0
    expect(error).toBeUndefined()
    expect(stdout).toContain('0 errors')
    expect(stdout).toContain(`[warn] Pipeline (ghost): Step 'ghost-tx' is not an installed transformation`)
    expect(stdout).toContain('[warn] Pipeline (mismatched): Chain type mismatch')
    expect(stdout).toContain(`[warn] Pipeline (legacy): Invalid pipeline file: unknown field 'in'`)
    expect(stdout).toContain('[warn] Pipeline (garbage): Invalid pipeline file')

    rmSync(join(pipelinesDir, 'ghost.json'))
    rmSync(join(pipelinesDir, 'mismatched.json'))
    rmSync(join(pipelinesDir, 'legacy.json'))
    rmSync(join(pipelinesDir, 'garbage.json'))
  })

  it('reports ok when every saved pipeline passes the static checks', async () => {
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[ok] Pipelines')
    expect(stdout).not.toContain('[warn] Pipeline (')
  })
})
