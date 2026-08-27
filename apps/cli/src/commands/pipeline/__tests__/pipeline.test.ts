import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// The `pipeline` topic and the guards around saved pipelines. A pipeline
// is a saved `run` invocation stored as plain JSON at
// pipelines/<name>.json — hand-writing files here is a legitimate way to
// arrange states (that IS the format), while --save-as covers the
// tool-written path.
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

describe('run --save-as pre-flight', () => {
  it('rejects a name that would shadow an installed transformation, before any engine work', async () => {
    const { code, stderr } = await run([
      'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/never1', '--save-as', 'eer-to-relational'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('would shadow the installed transformation')
    expect(existsSync(join(testHome, '.synth', 'models', 'com', 'example', 'never1.tsx'))).toBe(false)
    expect(existsSync(join(pipelinesDir, 'eer-to-relational.json'))).toBe(false)
  })

  it('rejects --save-as combined with --save-config', async () => {
    const { code, stderr } = await run([
      'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/never-cfg', '--out', 'com.example/never2', '--save-as', 'to-rel'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('--save-as and --save-config cannot be combined')
  })

  it('rejects a name that is not a valid path segment', async () => {
    const { code, stderr } = await run([
      'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/never3', '--save-as', 'bad.name'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain(`Invalid pipeline name 'bad.name'`)
  })
})

describe('run --save-as persistence and overwrite', () => {
  it('saves a single-step run and refuses to silently replace it', async () => {
    const first = await run([
      'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel', '--save-as', 'to-rel'
    ])
    expect(first.error).toBeUndefined()
    expect(first.stdout).toContain(`Saved pipeline 'to-rel'`)
    const saved = JSON.parse(readFileSync(join(pipelinesDir, 'to-rel.json'), 'utf-8'))
    expect(saved).toMatchObject({
      name: 'to-rel',
      steps: ['eer-to-relational'],
      in: 'com.example/persons',
      out: 'com.example/persons-rel',
      defaultConfigs: true
    })

    // Same name again without --overwrite: refused in pre-flight, before
    // any engine work (the new --out target is never written)
    const again = await run([
      'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel2', '--save-as', 'to-rel'
    ])
    expect(again.code).toBe(1)
    expect(flatten(again.stderr)).toContain('Pipeline already exists: to-rel')
    expect(existsSync(join(testHome, '.synth', 'models', 'com', 'example', 'persons-rel2.tsx'))).toBe(false)

    // --overwrite replaces the invocation but preserves createdAt
    const overwrite = await run([
      'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel2', '--save-as', 'to-rel', '--overwrite'
    ])
    expect(overwrite.error).toBeUndefined()
    const replaced = JSON.parse(readFileSync(join(pipelinesDir, 'to-rel.json'), 'utf-8'))
    expect(replaced.out).toBe('com.example/persons-rel2')
    expect(replaced.createdAt).toBe(saved.createdAt)
    expect(replaced.modifiedAt >= saved.modifiedAt).toBe(true)
  })
})

describe('run name resolution', () => {
  it('exits 3 for a name that is neither a pipeline nor an installed transformation', async () => {
    const { code, stderr } = await run(['run', 'no-such-thing'])
    expect(code).toBe(3)
    expect(flatten(stderr)).toContain(`'no-such-thing' is neither a saved pipeline nor an installed transformation`)
  })

  it('still requires --in when the single name is an installed transformation', async () => {
    const { code, stderr } = await run(['run', 'eer-to-relational'])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('Missing required flag --in')
  })

  it('resolves the pipeline first when a name matches both, with a shadowing warning', async () => {
    // Simulates the shadowing that a later `tx install` creates: save-time
    // validation forbids creating it, but a file on disk is authoritative.
    const shadowDir = join(tempDir, 'shadow-gen')
    writePipeline('rel-to-sql-ddl', {
      name: 'rel-to-sql-ddl',
      steps: ['rel-to-sql-ddl'],
      in: 'com.example/persons-rel',
      outDir: shadowDir,
      defaultConfigs: true,
      description: '',
      createdAt: '2026-08-27T00:00:00.000Z',
      modifiedAt: '2026-08-27T00:00:00.000Z'
    })
    const { stdout, stderr, error } = await run(['run', 'rel-to-sql-ddl'])
    expect(error).toBeUndefined()
    expect(flatten(stderr)).toContain('names both a saved pipeline and an installed transformation')
    expect(stdout).toContain('Wrote')
    const sqlFiles = readdirSync(shadowDir).filter((name) => name.endsWith('.sql'))
    expect(sqlFiles.length).toBe(1)
    rmSync(join(pipelinesDir, 'rel-to-sql-ddl.json'))
  })

  it('tx run never resolves pipelines', async () => {
    const { code, stderr } = await run(['tx', 'run', 'to-rel', '--in', 'com.example/persons'])
    expect(code).toBe(3)
    expect(flatten(stderr)).toContain('Transformation not found: to-rel')
  })
})

describe('pipeline ls / show / rm', () => {
  it('lists saved pipelines with steps and input, warning about invalid files', async () => {
    writePipeline('broken', { name: 'broken', steps: 'not-an-array' })
    const { stdout, stderr, error } = await run(['pipeline', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('to-rel')
    expect(stdout).toContain('eer-to-relational')
    expect(stdout).toContain('on com.example/persons')
    expect(flatten(stderr)).toContain(`Pipeline 'broken' is invalid`)

    const jsonRun = await run(['pipeline', 'ls', '--json'])
    expect(jsonRun.error).toBeUndefined()
    const rows = JSON.parse(jsonRun.stdout)
    expect(rows).toContainEqual({ name: 'to-rel', steps: ['eer-to-relational'], in: 'com.example/persons' })
    expect(rows.map((row: { name: string }) => row.name)).not.toContain('broken')
  })

  it('shows every field of a pipeline, in both output modes', async () => {
    const human = await run(['pipeline', 'show', 'to-rel'])
    expect(human.error).toBeUndefined()
    expect(human.stdout).toContain('Name:         to-rel')
    expect(human.stdout).toContain('Steps:        eer-to-relational')
    expect(human.stdout).toContain('In:           com.example/persons')
    expect(human.stdout).toContain('Out:          com.example/persons-rel2')
    expect(human.stdout).toContain('default-configs yes')

    const jsonRun = await run(['pipeline', 'show', 'to-rel', '--json'])
    expect(jsonRun.error).toBeUndefined()
    const parsed = JSON.parse(jsonRun.stdout)
    expect(parsed.name).toBe('to-rel')
    expect(parsed.steps).toEqual(['eer-to-relational'])
    expect(parsed.in).toBe('com.example/persons')
    expect(parsed.out).toBe('com.example/persons-rel2')
    expect(parsed.path).toBe(join(pipelinesDir, 'to-rel.json'))
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
    expect(message).toContain(`field 'in' is required`)
  })

  it('rm deletes a pipeline without any dependency check; missing exits 3', async () => {
    const { stdout, error } = await run(['pipeline', 'rm', 'broken'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Deleted pipeline broken')
    expect(existsSync(join(pipelinesDir, 'broken.json'))).toBe(false)

    const missing = await run(['pipeline', 'rm', 'broken'])
    expect(missing.code).toBe(3)
  })
})

describe('pipeline edit', () => {
  it('re-validates after the editor closes and warns about every problem', async () => {
    writePipeline('edited', {
      name: 'edited',
      steps: ['eer-to-relational'],
      in: 'com.example/persons',
      inn: 'typo-field',
      defaultConfigs: 'yes'
    })
    // EDITOR=true: the no-op editor exits 0 leaving the file as arranged
    const { stderr, error } = await run(['pipeline', 'edit', 'edited'], { EDITOR: 'true' })
    expect(error).toBeUndefined()
    const message = flatten(stderr)
    expect(message).toContain(`Pipeline 'edited': unknown field 'inn'`)
    expect(message).toContain(`field 'defaultConfigs' must be a boolean`)
    expect(message).toContain('will refuse to replay')
    rmSync(join(pipelinesDir, 'edited.json'))
  })

  it('exits 3 for a missing pipeline before spawning any editor', async () => {
    const { code } = await run(['pipeline', 'edit', 'ghost-pipe'], { EDITOR: 'true' })
    expect(code).toBe(3)
  })
})

describe('dependency guards', () => {
  it('tx uninstall refuses while a saved pipeline uses the transformation as a step', async () => {
    writePipeline('uses-ddl', {
      name: 'uses-ddl',
      steps: ['rel-to-sql-ddl'],
      in: 'com.example/persons-rel',
      outDir: join(tempDir, 'uses-ddl-gen'),
      defaultConfigs: true,
      description: '',
      createdAt: '2026-08-27T00:00:00.000Z',
      modifiedAt: '2026-08-27T00:00:00.000Z'
    })
    const { code, stderr } = await run(['tx', 'uninstall', 'rel-to-sql-ddl'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`Cannot uninstall 'rel-to-sql-ddl'`)
    expect(message).toContain('uses-ddl')
    expect(message).toContain('pipeline rm')
    // Still installed
    const ls = await run(['tx', 'ls'])
    expect(ls.stdout).toContain('rel-to-sql-ddl')

    // JSON contract: machine-readable error AND exit 2
    const jsonRun = await run(['tx', 'uninstall', 'rel-to-sql-ddl', '--json'])
    expect(jsonRun.code).toBe(2)
    expect(JSON.parse(jsonRun.stdout).error).toContain('uses-ddl')
    rmSync(join(pipelinesDir, 'uses-ddl.json'))
  })

  it('model rm refuses while a pipeline binds the model via in or config', async () => {
    writePipeline('guard-cfg', {
      name: 'guard-cfg',
      steps: ['eer-to-relational'],
      in: 'com.example/persons',
      config: 'com.example/persons',
      defaultConfigs: true,
      description: '',
      createdAt: '2026-08-27T00:00:00.000Z',
      modifiedAt: '2026-08-27T00:00:00.000Z'
    })
    const { code, stderr } = await run(['model', 'rm', 'com.example/persons', '--cascade'])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain('Cannot remove com.example/persons')
    // Both the hand-written pipeline and the --save-as one bind the model
    expect(message).toContain('guard-cfg')
    expect(message).toContain('to-rel')
    expect(message).toContain('in -> com.example/persons')
    expect(message).toContain('config -> com.example/persons')
    expect(message).toContain('pipeline rm')
    expect(existsSync(join(testHome, '.synth', 'models', 'com', 'example', 'persons.tsx'))).toBe(true)
    rmSync(join(pipelinesDir, 'guard-cfg.json'))
  })
})

describe('doctor pipeline checks', () => {
  it('warns about unreplayable pipelines: schema, uninstalled step, missing in, non-config binding', async () => {
    writePipeline('ghost', {
      name: 'ghost',
      steps: ['ghost-tx'],
      in: 'com.example/missing-model'
    })
    writePipeline('badcfg', {
      name: 'badcfg',
      steps: ['eer-to-relational'],
      in: 'com.example/persons',
      config: 'com.example/persons-rel'
    })
    writeFileSync(join(pipelinesDir, 'garbage.json'), 'not json at all\n')

    const { stdout, error } = await run(['doctor'])
    // Pipeline problems are warnings, never errors: doctor still exits 0
    expect(error).toBeUndefined()
    expect(stdout).toContain('0 errors')
    expect(stdout).toContain(`[warn] Pipeline (ghost): Step 'ghost-tx' is not an installed transformation`)
    expect(stdout).toContain(`[warn] Pipeline (ghost): Input model 'com.example/missing-model' does not exist`)
    expect(stdout).toContain(`[warn] Pipeline (badcfg): Config binding 'com.example/persons-rel' is not a configuration model`)
    expect(stdout).toContain('[warn] Pipeline (garbage): Invalid pipeline file')

    rmSync(join(pipelinesDir, 'ghost.json'))
    rmSync(join(pipelinesDir, 'badcfg.json'))
    rmSync(join(pipelinesDir, 'garbage.json'))
  })

  it('reports ok when every saved pipeline is replayable', async () => {
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[ok] Pipelines')
    expect(stdout).not.toContain('[warn] Pipeline (')
  })
})
