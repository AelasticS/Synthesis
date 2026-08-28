import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { WorkspaceConfig } from '../../config/index.js'
import {
  allModels,
  chainNext,
  configsFor,
  installedTransformations,
  modelsForMetamodel,
  namespaces,
  pipelines
} from '../provider.js'

// The provider must answer from manifests, headers, and pipeline files
// alone, so the fixture workspace is SYNTHESIZED on disk: header-only
// model files (never renderable, proving nothing renders), the real
// installable fixture packages for manifests, and raw pipeline JSON.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')

const EER = '@synthesis/standard-metamodels/eer'
const REL = '@synthesis/standard-metamodels/relational'

let workspaceDir: string
let modelsDir: string
let pipelinesDir: string
let config: WorkspaceConfig

const writeModel = (relPath: string, content: string): void => {
  const path = join(modelsDir, relPath)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

const header = (fields: string): string => `export const $synth = {\n${fields}\n} as const\n`

beforeAll(() => {
  workspaceDir = mkdtempSync(join(tmpdir(), 'synth-provider-test-'))
  modelsDir = join(workspaceDir, 'models')
  pipelinesDir = join(workspaceDir, 'pipelines')
  mkdirSync(pipelinesDir, { recursive: true })

  config = {
    workspace: workspaceDir,
    transformations: {
      'eer-to-relational': { version: '0.1.0', path: join(fixturesDir, 'eer-to-relational'), installedAt: 'x' },
      'rel-to-sql-ddl': { version: '0.1.0', path: join(fixturesDir, 'rel-to-sql-ddl'), installedAt: 'x' },
      'rel-copy': { version: '0.1.0', path: join(fixturesDir, 'rel-copy'), installedAt: 'x' },
      // Vanished install: must be skipped silently everywhere
      broken: { version: '0.1.0', path: join(workspaceDir, 'no-such-package'), installedAt: 'x' }
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
  // Declares NO metamodel: the run gate accepts it, so filters must keep it
  writeModel('com/example/untyped.tsx', header(`  kind: 'model',\n  metamodel: '',\n  references: {}`))
  writeModel(
    'com/example/persons-cfg.tsx',
    header(
      `  kind: 'configuration-model',\n  metamodel: 'cfg-mm',\n  references: { sourceModel: 'com.example/persons' },\n  generatedBy: { tx: 'eer-to-relational', date: 'd' }`
    )
  )
  writeModel(
    'com/example/other-cfg.tsx',
    header(
      `  kind: 'configuration-model',\n  metamodel: 'cfg-mm',\n  references: { sourceModel: 'com.example/persons-rel' },\n  generatedBy: { tx: 'rel-to-sql-ddl', date: 'd' }`
    )
  )
  // Hand-written configuration without a generatedBy stamp: passes the tx filter
  writeModel(
    'com/example/hand-cfg.tsx',
    header(
      `  kind: 'configuration-model',\n  metamodel: 'cfg-mm',\n  references: { sourceModel: 'com.example/persons' },\n  generatedBy: null`
    )
  )
  // Headerless and malformed files: silently skipped
  writeModel('com/example/headerless.tsx', `export default () => null\n`)
  writeModel('com/example/mangled.tsx', `export const $synth = { kind: 'model', metamodel:\n`)

  writeFileSync(
    join(pipelinesDir, 'gen-sql.json'),
    JSON.stringify({ name: 'gen-sql', steps: ['eer-to-relational', 'rel-to-sql-ddl'], description: 'EER to SQL', createdAt: '', modifiedAt: '' })
  )
  // Schema-invalid pipeline: still listed by name, with empty steps
  writeFileSync(join(pipelinesDir, 'broken.json'), JSON.stringify({ steps: 'nope' }))
  // Not JSON at all: still listed by name
  writeFileSync(join(pipelinesDir, 'not-json.json'), 'not json')
})

afterAll(() => {
  rmSync(workspaceDir, { recursive: true, force: true })
})

describe('installedTransformations', () => {
  it('lists every readable manifest with kind, metamodels, variability, description; broken entries skipped', async () => {
    const list = await installedTransformations(config)
    expect(list.map((tx) => tx.name)).toEqual(['eer-to-relational', 'rel-copy', 'rel-to-sql-ddl'])
    const eer = list[0]
    expect(eer.kind).toBe('m2m')
    expect(eer.sourceMetamodel).toBe(EER)
    expect(eer.targetMetamodel).toBe(REL)
    expect(eer.variability).toBe(true)
    expect(eer.description).toContain('EER to relational')
    expect(list.find((tx) => tx.name === 'rel-copy')?.variability).toBe(false)
  })
})

describe('chainNext', () => {
  it('offers exactly the transformations whose source matches the previous target', async () => {
    const next = await chainNext(config, 'eer-to-relational')
    expect(next.map((tx) => tx.name)).toEqual(['rel-copy', 'rel-to-sql-ddl'])
  })

  it('offers nothing after an m2t step (text is terminal) or an unknown one', async () => {
    expect(await chainNext(config, 'rel-to-sql-ddl')).toEqual([])
    expect(await chainNext(config, 'no-such-tx')).toEqual([])
  })
})

describe('modelsForMetamodel', () => {
  it('returns only kind "model" entries, with descriptions; unreadable headers skipped', async () => {
    const models = await modelsForMetamodel(modelsDir)
    expect(models.map((model) => model.ref)).toEqual([
      'com.example/persons',
      'com.example/persons-rel',
      'com.example/untyped'
    ])
    expect(models[0].description).toBe('EER demo model')
  })

  it('filters by the declared metamodel but keeps models declaring none', async () => {
    const models = await modelsForMetamodel(modelsDir, EER)
    expect(models.map((model) => model.ref)).toEqual(['com.example/persons', 'com.example/untyped'])
  })
})

describe('allModels', () => {
  it('returns every parseable header regardless of kind', async () => {
    const refs = (await allModels(modelsDir)).map((model) => model.ref)
    expect(refs).toContain('com.example/persons-cfg')
    expect(refs).toContain('com.example/persons')
    expect(refs).not.toContain('com.example/headerless')
    expect(refs).not.toContain('com.example/mangled')
  })
})

describe('configsFor', () => {
  it('lists every configuration model when unfiltered', async () => {
    const refs = (await configsFor(modelsDir)).map((model) => model.ref)
    expect(refs).toEqual(['com.example/hand-cfg', 'com.example/other-cfg', 'com.example/persons-cfg'])
  })

  it('filters by generatedBy.tx, keeping unstamped hand-written configurations', async () => {
    const refs = (await configsFor(modelsDir, 'eer-to-relational')).map((model) => model.ref)
    expect(refs).toEqual(['com.example/hand-cfg', 'com.example/persons-cfg'])
  })

  it('filters by references.sourceModel', async () => {
    const refs = (await configsFor(modelsDir, 'eer-to-relational', 'com.example/persons')).map((model) => model.ref)
    expect(refs).toEqual(['com.example/hand-cfg', 'com.example/persons-cfg'])
    expect(await configsFor(modelsDir, 'eer-to-relational', 'com.example/nowhere')).toEqual([])
  })
})

describe('pipelines', () => {
  it('lists every file stem leniently; invalid files carry empty steps', async () => {
    const list = await pipelines(pipelinesDir)
    expect(list.map((pipeline) => pipeline.name)).toEqual(['broken', 'gen-sql', 'not-json'])
    const genSql = list.find((pipeline) => pipeline.name === 'gen-sql')
    expect(genSql?.steps).toEqual(['eer-to-relational', 'rel-to-sql-ddl'])
    expect(genSql?.description).toBe('EER to SQL')
    expect(list.find((pipeline) => pipeline.name === 'broken')?.steps).toEqual([])
  })

  it('yields an empty list for a missing pipelines directory', async () => {
    expect(await pipelines(join(workspaceDir, 'no-such-dir'))).toEqual([])
  })
})

describe('namespaces', () => {
  it('lists every namespace, dotted and sorted', async () => {
    expect(await namespaces(modelsDir)).toEqual(['com', 'com.example'])
  })
})
