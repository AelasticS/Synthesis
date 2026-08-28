import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../test-utils/run-cli.js'

// `synth completions -- <words...>` is the machine contract behind the
// shipped shell completion scripts: newline-separated candidate VALUES for
// the position the last word marks, empty output + exit 0 for anything it
// cannot complete. The workspace here is synthesized on disk (config.json
// written directly, header-only model files, raw pipeline JSON) — the
// command must answer from manifests and headers alone, fast, no engine.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')

const EER = '@synthesis/standard-metamodels/eer'
const REL = '@synthesis/standard-metamodels/relational'

let testHome: string
let otherWorkspace: string

const complete = (words: string[]) => runCli(['completions', '--', ...words], { home: testHome })
// The word under the cursor when a NEW word is being started
const EMPTY = "''"

const lines = (stdout: string): string[] => stdout.split('\n').filter((line) => line !== '')

const header = (fields: string): string => `export const $synth = {\n${fields}\n} as const\n`

beforeAll(() => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-completions-home-'))
  const workspace = join(testHome, '.synth')
  const modelsDir = join(workspace, 'models')
  const pipelinesDir = join(workspace, 'pipelines')
  mkdirSync(join(modelsDir, 'com', 'example'), { recursive: true })
  mkdirSync(pipelinesDir, { recursive: true })

  writeFileSync(
    join(workspace, 'config.json'),
    JSON.stringify({
      workspace: '~/.synth',
      currentNamespace: 'com.example',
      transformations: {
        'eer-to-relational': { version: '0.1.0', path: join(fixturesDir, 'eer-to-relational'), installedAt: 'x' },
        'rel-to-sql-ddl': { version: '0.1.0', path: join(fixturesDir, 'rel-to-sql-ddl'), installedAt: 'x' },
        'rel-copy': { version: '0.1.0', path: join(fixturesDir, 'rel-copy'), installedAt: 'x' }
      }
    })
  )

  const writeModel = (name: string, content: string): void =>
    writeFileSync(join(modelsDir, 'com', 'example', name), content)
  writeModel(
    'persons.tsx',
    header(`  kind: 'model',\n  metamodel: '${EER}',\n  references: {},\n  generatedBy: null`)
  )
  writeModel(
    'persons-rel.tsx',
    header(`  kind: 'model',\n  metamodel: '${REL}',\n  references: {},\n  generatedBy: null`)
  )
  writeModel(
    'persons-cfg.tsx',
    header(
      `  kind: 'configuration-model',\n  metamodel: 'cfg-mm',\n  references: { sourceModel: 'com.example/persons' },\n  generatedBy: { tx: 'eer-to-relational', date: 'd' }`
    )
  )

  writeFileSync(
    join(pipelinesDir, 'gen-sql.json'),
    JSON.stringify({ name: 'gen-sql', steps: ['eer-to-relational', 'rel-to-sql-ddl'], description: '', createdAt: '', modifiedAt: '' })
  )

  // A second workspace with its own (EER) model, for --workspace overrides
  otherWorkspace = join(testHome, 'other-ws')
  mkdirSync(join(otherWorkspace, 'models', 'other', 'ns'), { recursive: true })
  writeFileSync(
    join(otherWorkspace, 'models', 'other', 'ns', 'widget.tsx'),
    header(`  kind: 'model',\n  metamodel: '${EER}',\n  references: {},\n  generatedBy: null`)
  )
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
})

describe('transformation positions', () => {
  it('completes transformation names after transformation run, filtered by the partial', async () => {
    const { stdout, code } = await complete(['transformation', 'run', 'e'])
    expect(code).toBe(0)
    expect(lines(stdout)).toEqual(['eer-to-relational'])
  })

  it('completes the second positional chain-aware: only compatible continuations', async () => {
    const { stdout } = await complete(['tx', 'run', 'eer-to-relational', EMPTY])
    // Both consume the relational metamodel eer-to-relational produces;
    // eer-to-relational itself (source: eer) must NOT appear
    expect(lines(stdout)).toEqual(['rel-copy', 'rel-to-sql-ddl'])
  })

  it('completes nothing after an m2t step (text is terminal)', async () => {
    const { stdout, code } = await complete(['tx', 'run', 'rel-to-sql-ddl', EMPTY])
    expect(code).toBe(0)
    expect(lines(stdout)).toEqual([])
  })

  it('completes installed names for transformation show/uninstall and pipeline mk steps', async () => {
    const show = await complete(['transformation', 'show', EMPTY])
    expect(lines(show.stdout)).toEqual(['eer-to-relational', 'rel-copy', 'rel-to-sql-ddl'])
    const mkFirst = await complete(['pipeline', 'mk', 'my-pipe', EMPTY])
    expect(lines(mkFirst.stdout)).toEqual(['eer-to-relational', 'rel-copy', 'rel-to-sql-ddl'])
    const mkSecond = await complete(['pl', 'mk', 'my-pipe', 'eer-to-relational', EMPTY])
    expect(lines(mkSecond.stdout)).toEqual(['rel-copy', 'rel-to-sql-ddl'])
    // The new pipeline NAME is free-form: nothing to complete
    const mkName = await complete(['pipeline', 'mk', EMPTY])
    expect(lines(mkName.stdout)).toEqual([])
  })
})

describe('model and configuration positions', () => {
  it('completes --in with models of the transformation source metamodel only', async () => {
    const { stdout } = await complete(['tx', 'run', 'eer-to-relational', '--in', EMPTY])
    expect(lines(stdout)).toEqual(['com.example/persons'])
    const rel = await complete(['tx', 'run', 'rel-to-sql-ddl', '--in', EMPTY])
    expect(lines(rel.stdout)).toEqual(['com.example/persons-rel'])
  })

  it('completes --in for pipeline run via the pipeline first step', async () => {
    const { stdout } = await complete(['pipeline', 'run', 'gen-sql', '--in', EMPTY])
    expect(lines(stdout)).toEqual(['com.example/persons'])
  })

  it('completes --config aware of the transformation and --in', async () => {
    const { stdout } = await complete(['tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--config', EMPTY])
    expect(lines(stdout)).toEqual(['com.example/persons-cfg'])
    const other = await complete(['tx', 'run', 'eer-to-relational', '--in', 'com.example/persons-rel', '--config', EMPTY])
    expect(lines(other.stdout)).toEqual([])
  })

  it('completes --for for config init and the config init positional (decision-based only)', async () => {
    const forFlag = await complete(['config', 'init', 'eer-to-relational', '--for', EMPTY])
    expect(lines(forFlag.stdout)).toEqual(['com.example/persons'])
    const txArg = await complete(['config', 'init', EMPTY])
    // rel-copy is not decision-based and must not appear
    expect(lines(txArg.stdout)).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
  })

  it('completes all refs for model show/rm/validate/export and configs for config show', async () => {
    const show = await complete(['model', 'show', 'com.example/p'])
    expect(lines(show.stdout)).toEqual(['com.example/persons', 'com.example/persons-cfg', 'com.example/persons-rel'])
    const validate = await complete(['model', 'validate', EMPTY])
    expect(lines(validate.stdout)).toContain('com.example/persons')
    const configShow = await complete(['config', 'show', EMPTY])
    expect(lines(configShow.stdout)).toEqual(['com.example/persons-cfg'])
  })
})

describe('pipeline and namespace positions', () => {
  it('completes saved pipeline names for run/show/rm/edit, canonical and alias', async () => {
    for (const words of [
      ['pipeline', 'run', EMPTY],
      ['pipeline', 'show', EMPTY],
      ['pipeline', 'rm', EMPTY],
      ['pipeline', 'edit', EMPTY],
      ['pl', 'run', 'g']
    ]) {
      const { stdout, code } = await complete(words)
      expect(code).toBe(0)
      expect(lines(stdout)).toEqual(['gen-sql'])
    }
  })

  it('completes namespaces after cd, namespace rm, and --ns', async () => {
    const cd = await complete(['cd', EMPTY])
    expect(lines(cd.stdout)).toEqual(['com', 'com.example'])
    const nsRm = await complete(['ns', 'rm', 'com.'])
    expect(lines(nsRm.stdout)).toEqual(['com.example'])
    const nsFlag = await complete(['model', 'ls', '--ns', EMPTY])
    expect(lines(nsFlag.stdout)).toEqual(['com', 'com.example'])
  })
})

describe('global flags and the --flag= form', () => {
  it('completes the single-token --in=<partial> form like --in <partial>', async () => {
    // Bash reassembles its '='-split words into this form; zsh never splits
    const { stdout, code } = await complete(['tx', 'run', 'eer-to-relational', '--in=com.ex'])
    expect(code).toBe(0)
    expect(lines(stdout)).toEqual(['com.example/persons'])
    const empty = await complete(['tx', 'run', 'eer-to-relational', '--in='])
    expect(lines(empty.stdout)).toEqual(['com.example/persons'])
  })

  it('skips leading global flags (and their values) when resolving the command', async () => {
    const short = await complete(['-q', 'tx', 'run', 'e'])
    expect(lines(short.stdout)).toEqual(['eer-to-relational'])
    const nsFirst = await complete(['--ns', 'com.example', 'model', 'show', 'com.example/persons-r'])
    expect(lines(nsFirst.stdout)).toEqual(['com.example/persons-rel'])
  })

  it('resolves candidates from a --workspace override on the line', async () => {
    const trailing = await complete(['model', 'show', '--workspace', otherWorkspace, EMPTY])
    expect(lines(trailing.stdout)).toEqual(['other.ns/widget'])
    // Leading position, combined with a metamodel-filtered --in: the models
    // come from the override, the transformations from the global config
    const leading = await complete(['--workspace', otherWorkspace, 'tx', 'run', 'eer-to-relational', '--in', EMPTY])
    expect(lines(leading.stdout)).toEqual(['other.ns/widget'])
  })
})

describe('the contract edges', () => {
  it('prints nothing and exits 0 for unknown contexts and flag partials', async () => {
    for (const words of [
      ['frobnicate', 'x', EMPTY],
      ['model', EMPTY],
      ['tx', 'run', '--i'],
      ['tx', 'run', 'eer-to-relational', '--out', EMPTY],
      [EMPTY]
    ]) {
      const { stdout, stderr, code } = await complete(words)
      expect(code).toBe(0)
      expect(stdout).toBe('')
      expect(stderr).toBe('')
    }
  })

  it('exits 0 with no output even without an initialized workspace', async () => {
    const emptyHome = mkdtempSync(join(tmpdir(), 'synth-completions-empty-'))
    try {
      const { stdout, code } = await runCli(['completions', '--', 'transformation', 'run', EMPTY], { home: emptyHome })
      expect(code).toBe(0)
      expect(stdout).toBe('')
    } finally {
      rmSync(emptyHome, { recursive: true, force: true })
    }
  })

  it('is hidden from help', async () => {
    const { stdout } = await runCli(['help'], { home: testHome })
    expect(stdout).not.toContain('completions')
  })
})
