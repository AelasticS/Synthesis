import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { WorkspaceConfig } from '../../config/index.js'
import type { Prompter, PromptChoice } from '../../support/interactive.js'
import { completeConfigInitRequest, completeRunRequest, FlowAborted, pickPipelineName } from '../flows.js'
import type { FlowDeps } from '../flows.js'

// The flows read manifests (real fixture packages) and headers (synthetic,
// header-only model files that could never render) — proving the pickers
// never touch the engine. Prompts are scripted through a stub prompter;
// each test asserts the resulting completed request.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')

const EER = '@synthesis/standard-metamodels/eer'
const REL = '@synthesis/standard-metamodels/relational'

interface RecordedPrompt {
  type: 'search' | 'select' | 'confirm' | 'input'
  message: string
  choices?: ReadonlyArray<PromptChoice<unknown>>
  defaultValue?: unknown
}

/** Sentinel: an `input` answer that accepts the offered default. */
const USE_DEFAULT = Symbol('use-default')

class StubPrompter implements Prompter {
  public readonly calls: RecordedPrompt[] = []
  public constructor(private readonly script: unknown[]) {}

  private next(call: RecordedPrompt): unknown {
    this.calls.push(call)
    if (this.script.length === 0) {
      throw new Error(`Unexpected ${call.type} prompt: ${call.message}`)
    }
    return this.script.shift()
  }

  public async search<T>(message: string, choices: ReadonlyArray<PromptChoice<T>>): Promise<T> {
    return this.next({ type: 'search', message, choices }) as T
  }

  public async select<T>(message: string, choices: ReadonlyArray<PromptChoice<T>>): Promise<T> {
    return this.next({ type: 'select', message, choices }) as T
  }

  public async confirm(message: string, defaultValue: boolean): Promise<boolean> {
    return this.next({ type: 'confirm', message, defaultValue }) as boolean
  }

  public async input(message: string, defaultValue?: string): Promise<string> {
    const answer = this.next({ type: 'input', message, defaultValue })
    return answer === USE_DEFAULT ? (defaultValue ?? '') : (answer as string)
  }
}

let workspaceDir: string
let modelsDir: string
let pipelinesDir: string
let invokedFrom: string
let config: WorkspaceConfig

const writeModel = (relPath: string, content: string): void => {
  const path = join(modelsDir, relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const header = (fields: string): string => `export const $synth = {\n${fields}\n} as const\n`

interface TestDeps extends FlowDeps {
  prompter: StubPrompter
  imported: Array<{ sourcePath: string; ref: string }>
  infoLines: string[]
}

const makeDeps = (script: unknown[]): TestDeps => {
  const prompter = new StubPrompter(script)
  const imported: Array<{ sourcePath: string; ref: string }> = []
  const infoLines: string[] = []
  return {
    prompter,
    workspaceConfig: config,
    modelsDir,
    pipelinesDir,
    invokedFrom,
    importModel: async (sourcePath, ref) => {
      imported.push({ sourcePath, ref })
    },
    info: (line) => infoLines.push(line),
    imported,
    infoLines
  }
}

beforeAll(() => {
  workspaceDir = mkdtempSync(join(tmpdir(), 'synth-flows-test-'))
  modelsDir = join(workspaceDir, 'models')
  pipelinesDir = join(workspaceDir, 'pipelines')
  invokedFrom = join(workspaceDir, 'cwd')
  mkdirSync(pipelinesDir, { recursive: true })
  mkdirSync(invokedFrom, { recursive: true })

  config = {
    workspace: workspaceDir,
    currentNamespace: 'com.example',
    transformations: {
      'eer-to-relational': { version: '0.1.0', path: join(fixturesDir, 'eer-to-relational'), installedAt: 'x' },
      'rel-to-sql-ddl': { version: '0.1.0', path: join(fixturesDir, 'rel-to-sql-ddl'), installedAt: 'x' },
      'rel-copy': { version: '0.1.0', path: join(fixturesDir, 'rel-copy'), installedAt: 'x' }
    }
  }

  writeModel(
    'com/example/persons.tsx',
    header(`  kind: 'model',\n  metamodel: '${EER}',\n  references: {},\n  generatedBy: null,\n  description: 'EER demo model'`)
  )
  writeModel(
    'com/example/persons-rel.tsx',
    header(`  kind: 'model',\n  metamodel: '${REL}',\n  references: {},\n  generatedBy: null`)
  )
  writeModel(
    'com/example/persons-cfg.tsx',
    header(
      `  kind: 'configuration-model',\n  metamodel: 'cfg-mm',\n  references: { sourceModel: 'com.example/persons' },\n  generatedBy: { tx: 'eer-to-relational', date: 'd' }`
    )
  )

  writeFileSync(
    join(pipelinesDir, 'gen-sql.json'),
    JSON.stringify({ name: 'gen-sql', steps: ['eer-to-relational', 'rel-to-sql-ddl'], description: 'EER to SQL', createdAt: '', modifiedAt: '' })
  )
  writeFileSync(join(pipelinesDir, 'broken.json'), JSON.stringify({ steps: 'nope' }))

  writeFileSync(join(invokedFrom, 'newcomer.tsx'), 'export default () => null\n')
})

afterAll(() => {
  rmSync(workspaceDir, { recursive: true, force: true })
})

describe('completeRunRequest', () => {
  it('asks nothing when the request is already complete', async () => {
    const deps = makeDeps([])
    const result = await completeRunRequest(deps, {
      txNames: ['eer-to-relational'],
      inRef: 'com.example/persons',
      config: 'com.example/persons-cfg',
      defaultConfigs: false
    })
    expect(deps.prompter.calls).toEqual([])
    expect(result).toEqual({
      txNames: ['eer-to-relational'],
      inRef: 'com.example/persons',
      config: 'com.example/persons-cfg',
      defaultConfigs: false,
      outDir: undefined
    })
  })

  it('picks the transformation, the metamodel-matched model, and the defaults consent', async () => {
    const deps = makeDeps(['eer-to-relational', 'com.example/persons', 'defaults'])
    const result = await completeRunRequest(deps, { txNames: [], defaultConfigs: false })

    const [txPrompt, modelPrompt, consentPrompt] = deps.prompter.calls
    expect(txPrompt.type).toBe('search')
    expect(txPrompt.choices?.map((choice) => choice.value)).toEqual(['eer-to-relational', 'rel-copy', 'rel-to-sql-ddl'])
    expect(txPrompt.choices?.[0].description).toContain(`m2m: ${EER} -> ${REL}`)
    expect(modelPrompt.type).toBe('search')
    // Only the EER model qualifies; the relational one is filtered out
    expect(modelPrompt.choices?.map((choice) => choice.value)).toEqual(['com.example/persons'])
    expect(consentPrompt.type).toBe('select')
    expect(consentPrompt.choices?.map((choice) => choice.value)).toEqual(['existing', 'defaults', 'abort'])

    expect(result.txNames).toEqual(['eer-to-relational'])
    expect(result.inRef).toBe('com.example/persons')
    expect(result.defaultConfigs).toBe(true)
    expect(result.config).toBeUndefined()
  })

  it('binds an existing configuration when the user picks one', async () => {
    const deps = makeDeps(['existing', 'com.example/persons-cfg'])
    const result = await completeRunRequest(deps, {
      txNames: ['eer-to-relational'],
      inRef: 'com.example/persons',
      defaultConfigs: false
    })
    const configPrompt = deps.prompter.calls[1]
    expect(configPrompt.type).toBe('search')
    expect(configPrompt.choices?.map((choice) => choice.value)).toEqual(['com.example/persons-cfg'])
    expect(result.config).toBe('com.example/persons-cfg')
    expect(result.defaultConfigs).toBe(false)
  })

  it('offers no "existing configuration" choice when none fits the model', async () => {
    const deps = makeDeps(['defaults', './gen'])
    const result = await completeRunRequest(deps, {
      txNames: ['rel-to-sql-ddl'],
      inRef: 'com.example/persons-rel',
      defaultConfigs: false
    })
    const consentPrompt = deps.prompter.calls[0]
    // No configuration in the workspace names persons-rel as sourceModel
    // AND eer... none fit rel-to-sql-ddl on persons-rel
    expect(consentPrompt.choices?.map((choice) => choice.value)).toEqual(['defaults', 'abort'])
    // m2t last step: the output directory is prompted for, never invented
    expect(deps.prompter.calls[1].type).toBe('input')
    expect(result.outDir).toBe('./gen')
    expect(result.defaultConfigs).toBe(true)
  })

  it('uses the mid-run wording for a later uncovered step and consents the chain', async () => {
    const deps = makeDeps(['defaults', './gen'])
    const result = await completeRunRequest(deps, {
      txNames: ['eer-to-relational', 'rel-to-sql-ddl'],
      inRef: 'com.example/persons',
      config: 'com.example/persons-cfg',
      defaultConfigs: false
    })
    const consentPrompt = deps.prompter.calls[0]
    expect(consentPrompt.message).toContain('step 2 (rel-to-sql-ddl)')
    expect(consentPrompt.message).toContain('produced mid-run')
    expect(consentPrompt.choices?.map((choice) => choice.value)).toEqual(['defaults', 'abort'])
    expect(result.defaultConfigs).toBe(true)
    expect(result.config).toBe('com.example/persons-cfg')
  })

  it('aborts with exit 2 when the user refuses the consent', async () => {
    const deps = makeDeps(['abort'])
    await expect(
      completeRunRequest(deps, { txNames: ['eer-to-relational'], inRef: 'com.example/persons', defaultConfigs: false })
    ).rejects.toMatchObject({ exit: 2, message: expect.stringContaining('explicit consent') })
  })

  it('aborts with exit 1 when the m2t output directory stays empty', async () => {
    const deps = makeDeps(['defaults', '   '])
    await expect(
      completeRunRequest(deps, { txNames: ['rel-to-sql-ddl'], inRef: 'com.example/persons-rel', defaultConfigs: false })
    ).rejects.toMatchObject({ exit: 1, message: expect.stringContaining('--out-dir') })
  })

  it('offers to import a .tsx file given as --in and continues with the imported ref', async () => {
    const deps = makeDeps([true, USE_DEFAULT, 'defaults'])
    const result = await completeRunRequest(deps, {
      txNames: ['eer-to-relational'],
      inRef: './newcomer.tsx',
      defaultConfigs: false
    })
    const [confirmPrompt, inputPrompt] = deps.prompter.calls
    expect(confirmPrompt.type).toBe('confirm')
    expect(confirmPrompt.message).toContain(`'./newcomer.tsx' is not a workspace ref`)
    expect(inputPrompt.type).toBe('input')
    // Default target ref: current namespace + file basename
    expect(inputPrompt.defaultValue).toBe('com.example/newcomer')
    expect(deps.imported).toEqual([{ sourcePath: join(invokedFrom, 'newcomer.tsx'), ref: 'com.example/newcomer' }])
    expect(deps.infoLines).toContain('Imported com.example/newcomer')
    expect(result.inRef).toBe('com.example/newcomer')
  })

  it('keeps the raw value when the import offer is declined (downstream error unchanged)', async () => {
    const deps = makeDeps([false, 'defaults'])
    const result = await completeRunRequest(deps, {
      txNames: ['eer-to-relational'],
      inRef: './newcomer.tsx',
      defaultConfigs: false
    })
    expect(deps.imported).toEqual([])
    expect(result.inRef).toBe('./newcomer.tsx')
  })

  it('makes no import offer for a value that is neither a ref nor an existing .tsx file', async () => {
    const deps = makeDeps(['defaults'])
    const result = await completeRunRequest(deps, {
      txNames: ['eer-to-relational'],
      inRef: 'com.example/missing',
      defaultConfigs: false
    })
    expect(deps.prompter.calls.map((call) => call.type)).toEqual(['select'])
    expect(result.inRef).toBe('com.example/missing')
  })

  it('rejects an unknown transformation exactly like the execution core (exit 3)', async () => {
    const deps = makeDeps([])
    await expect(
      completeRunRequest(deps, { txNames: ['no-such-tx'], inRef: 'com.example/persons', defaultConfigs: false })
    ).rejects.toMatchObject({ exit: 3, message: expect.stringContaining('Transformation not found: no-such-tx') })
  })
})

describe('pickPipelineName', () => {
  it('offers only runnable (schema-valid) pipelines, with their steps', async () => {
    const deps = makeDeps(['gen-sql'])
    const name = await pickPipelineName(deps)
    const prompt = deps.prompter.calls[0]
    expect(prompt.type).toBe('search')
    expect(prompt.choices?.map((choice) => choice.value)).toEqual(['gen-sql'])
    expect(prompt.choices?.[0].description).toContain('eer-to-relational -> rel-to-sql-ddl')
    expect(name).toBe('gen-sql')
  })

  it('aborts with exit 3 when nothing runnable is saved', async () => {
    const deps = makeDeps([])
    deps.pipelinesDir = join(workspaceDir, 'empty-pipelines')
    await expect(pickPipelineName(deps)).rejects.toMatchObject({
      exit: 3,
      message: expect.stringContaining('No runnable pipelines saved')
    })
  })
})

describe('completeConfigInitRequest', () => {
  it('offers only decision-based transformations, then models matching the source metamodel', async () => {
    const deps = makeDeps(['rel-to-sql-ddl', 'com.example/persons-rel'])
    const result = await completeConfigInitRequest(deps, {})
    const [txPrompt, modelPrompt] = deps.prompter.calls
    // rel-copy declares no decision/binding parts and must not appear
    expect(txPrompt.choices?.map((choice) => choice.value)).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
    expect(modelPrompt.choices?.map((choice) => choice.value)).toEqual(['com.example/persons-rel'])
    expect(result).toEqual({ txName: 'rel-to-sql-ddl', forRef: 'com.example/persons-rel' })
  })

  it('offers the import for a .tsx --for value', async () => {
    const deps = makeDeps([true, 'com.example/fresh'])
    const result = await completeConfigInitRequest(deps, {
      txName: 'eer-to-relational',
      forRef: './newcomer.tsx'
    })
    expect(deps.imported).toEqual([{ sourcePath: join(invokedFrom, 'newcomer.tsx'), ref: 'com.example/fresh' }])
    expect(result.forRef).toBe('com.example/fresh')
  })

  it('asks nothing when both values are present', async () => {
    const deps = makeDeps([])
    const result = await completeConfigInitRequest(deps, {
      txName: 'eer-to-relational',
      forRef: 'com.example/persons'
    })
    expect(deps.prompter.calls).toEqual([])
    expect(result).toEqual({ txName: 'eer-to-relational', forRef: 'com.example/persons' })
  })
})
