import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  parseRef,
  refToModelPath,
  modelPathToRef,
  namespaceToDir,
  namespaceExists,
  dirToNamespace,
  listNamespaces,
  listModels,
  scanModelsTree,
  findMissingReferences
} from '../refs.js'

describe('parseRef', () => {
  it('parses a dotted namespace ref', () => {
    expect(parseRef('com.example/persons')).toEqual({ namespace: 'com.example', name: 'persons' })
  })

  it('parses a single-segment namespace ref', () => {
    expect(parseRef('demo/cars')).toEqual({ namespace: 'demo', name: 'cars' })
  })

  it('normalizes a slash-separated namespace to dots', () => {
    expect(parseRef('com/example/persons')).toEqual({ namespace: 'com.example', name: 'persons' })
  })

  it('allows letters, digits, hyphen and underscore in segments', () => {
    expect(parseRef('org-1.sub_2/my-model_3')).toEqual({ namespace: 'org-1.sub_2', name: 'my-model_3' })
  })

  it('rejects a ref without a namespace', () => {
    expect(() => parseRef('persons')).toThrow(/expected <namespace>\/<name>/)
  })

  it('rejects an empty namespace', () => {
    expect(() => parseRef('/persons')).toThrow(/Invalid ref/)
  })

  it('rejects an empty name', () => {
    expect(() => parseRef('com.example/')).toThrow(/model name/)
  })

  it('rejects empty namespace segments', () => {
    expect(() => parseRef('com..example/persons')).toThrow(/Invalid ref/)
  })

  it('rejects illegal characters', () => {
    expect(() => parseRef('com.ex ample/persons')).toThrow(/Invalid ref/)
    expect(() => parseRef('com.example/per sons')).toThrow(/model name/)
  })
})

describe('refToModelPath', () => {
  it('maps a ref to a nested .tsx path', () => {
    expect(refToModelPath('/ws/models', 'com.example/persons')).toBe(join('/ws/models', 'com', 'example', 'persons.tsx'))
  })

  it('maps a single-segment namespace', () => {
    expect(refToModelPath('/ws/models', 'demo/cars')).toBe(join('/ws/models', 'demo', 'cars.tsx'))
  })
})

describe('modelPathToRef', () => {
  it('is the inverse of refToModelPath', () => {
    expect(modelPathToRef('/ws/models', '/ws/models/com/example/persons.tsx')).toBe('com.example/persons')
    expect(modelPathToRef('/ws/models', '/ws/models/demo/cars.tsx')).toBe('demo/cars')
  })

  it('returns null for files outside the models tree', () => {
    expect(modelPathToRef('/ws/models', '/ws/other/persons.tsx')).toBeNull()
    expect(modelPathToRef('/ws/models', '/tmp/persons.tsx')).toBeNull()
  })

  it('returns null for a model file at the models root (no namespace)', () => {
    expect(modelPathToRef('/ws/models', '/ws/models/persons.tsx')).toBeNull()
  })

  it('returns null for non-.tsx files and unaddressable segments', () => {
    expect(modelPathToRef('/ws/models', '/ws/models/com/example/persons.txt')).toBeNull()
    expect(modelPathToRef('/ws/models', '/ws/models/com.example/persons.tsx')).toBeNull()
    expect(modelPathToRef('/ws/models', '/ws/models/com/example/per.sons.tsx')).toBeNull()
  })
})

describe('namespaceToDir', () => {
  it('maps dots to nested directories', () => {
    expect(namespaceToDir('/ws/models', 'com.example')).toBe(join('/ws/models', 'com', 'example'))
  })

  it('maps a single segment to one directory', () => {
    expect(namespaceToDir('/ws/models', 'demo')).toBe(join('/ws/models', 'demo'))
  })

  it('rejects invalid namespaces', () => {
    expect(() => namespaceToDir('/ws/models', '')).toThrow(/Invalid namespace/)
    expect(() => namespaceToDir('/ws/models', 'com..example')).toThrow(/Invalid namespace/)
    expect(() => namespaceToDir('/ws/models', 'com.ex ample')).toThrow(/Invalid namespace/)
  })
})

describe('dirToNamespace', () => {
  it('is the inverse of namespaceToDir', () => {
    expect(dirToNamespace('/ws/models', '/ws/models/com/example')).toBe('com.example')
  })

  it('rejects a dot-named flat directory (not addressable as a namespace)', () => {
    expect(() => dirToNamespace('/ws/models', '/ws/models/com.example')).toThrow(/not a namespace/)
  })

  it('rejects the models directory itself', () => {
    expect(() => dirToNamespace('/ws/models', '/ws/models')).toThrow(/not a namespace/)
  })

  it('rejects directories outside the models directory', () => {
    expect(() => dirToNamespace('/ws/models', '/ws/other/com')).toThrow(/not a namespace/)
  })
})

describe('namespaceExists', () => {
  let modelsDir: string

  beforeAll(() => {
    modelsDir = mkdtempSync(join(tmpdir(), 'synth-refs-ns-test-'))
    mkdirSync(join(modelsDir, 'com', 'example'), { recursive: true })
    mkdirSync(join(modelsDir, 'legacy.flat'), { recursive: true })
  })

  afterAll(() => {
    rmSync(modelsDir, { recursive: true, force: true })
  })

  it('finds a nested namespace directory', () => {
    expect(namespaceExists(modelsDir, 'com.example')).toBe(true)
    expect(namespaceExists(modelsDir, 'com')).toBe(true)
  })

  it('does not find a missing namespace', () => {
    expect(namespaceExists(modelsDir, 'org.acme')).toBe(false)
  })

  it('does not read a dot-named flat directory as a namespace', () => {
    // 'legacy.flat' resolves to <models>/legacy/flat, which does not exist
    expect(namespaceExists(modelsDir, 'legacy.flat')).toBe(false)
  })

  it('throws for a namespace violating the segment grammar', () => {
    expect(() => namespaceExists(modelsDir, 'com..example')).toThrow(/Invalid namespace/)
  })
})

describe('listNamespaces / listModels / scanModelsTree', () => {
  let modelsDir: string

  beforeAll(() => {
    modelsDir = mkdtempSync(join(tmpdir(), 'synth-refs-test-'))
    mkdirSync(join(modelsDir, 'com', 'example', 'orders'), { recursive: true })
    mkdirSync(join(modelsDir, 'legacy.flat'), { recursive: true })
    mkdirSync(join(modelsDir, 'empty'), { recursive: true })
    writeFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), '')
    writeFileSync(join(modelsDir, 'com', 'example', 'orders', 'invoice.tsx'), '')
    writeFileSync(join(modelsDir, 'legacy.flat', 'cars.tsx'), '')
    writeFileSync(join(modelsDir, 'rootmodel.tsx'), '')
    // Non-model files and hidden entries must be ignored
    writeFileSync(join(modelsDir, 'com', 'example', 'notes.txt'), '')
    mkdirSync(join(modelsDir, '.hidden'), { recursive: true })
  })

  afterAll(() => {
    rmSync(modelsDir, { recursive: true, force: true })
  })

  it('lists nested directories as dotted namespaces, skipping dot-named dirs', async () => {
    expect(await listNamespaces(modelsDir)).toEqual([
      'com',
      'com.example',
      'com.example.orders',
      'empty'
    ])
  })

  it('returns an empty list for a missing models directory', async () => {
    expect(await listNamespaces(join(modelsDir, 'does-not-exist'))).toEqual([])
    expect(await listModels(join(modelsDir, 'does-not-exist'))).toEqual([])
  })

  it('lists only addressable model files, skipping legacy locations', async () => {
    // No ref can address legacy.flat/cars.tsx or the root-level
    // rootmodel.tsx, so the listing must not contain them
    expect(await listModels(modelsDir)).toEqual([
      { ref: 'com.example.orders/invoice', path: join(modelsDir, 'com', 'example', 'orders', 'invoice.tsx') },
      { ref: 'com.example/persons', path: join(modelsDir, 'com', 'example', 'persons.tsx') }
    ])
  })

  it('reports skipped entries with paths and reasons', async () => {
    const { skipped } = await scanModelsTree(modelsDir)
    expect(skipped).toEqual([
      {
        path: join(modelsDir, 'legacy.flat'),
        reason: expect.stringContaining('not a valid namespace segment')
      },
      {
        path: join(modelsDir, 'rootmodel.tsx'),
        reason: expect.stringContaining('no namespace')
      }
    ])
  })

  it('filters by namespace including sub-namespaces', async () => {
    const refs = (await listModels(modelsDir, 'com.example')).map((m) => m.ref)
    expect(refs).toEqual(['com.example.orders/invoice', 'com.example/persons'])
  })

  it('filters by an exact leaf namespace', async () => {
    const refs = (await listModels(modelsDir, 'com.example.orders')).map((m) => m.ref)
    expect(refs).toEqual(['com.example.orders/invoice'])
  })

  it('does not surface a dot-named flat directory under its dotted namespace', async () => {
    expect(await listModels(modelsDir, 'legacy.flat')).toEqual([])
  })

  it('filter with no matches yields an empty list', async () => {
    expect(await listModels(modelsDir, 'org.acme')).toEqual([])
  })
})

describe('findMissingReferences', () => {
  let modelsDir: string

  beforeAll(() => {
    modelsDir = mkdtempSync(join(tmpdir(), 'synth-refs-missing-test-'))
    mkdirSync(join(modelsDir, 'com', 'example'), { recursive: true })
    writeFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), '')
  })

  afterAll(() => {
    rmSync(modelsDir, { recursive: true, force: true })
  })

  it('returns an empty list when every reference resolves', () => {
    expect(findMissingReferences(modelsDir, { source: 'com.example/persons' })).toEqual([])
  })

  it('reports references to models that do not exist', () => {
    expect(findMissingReferences(modelsDir, { source: 'com.example/ghost' })).toEqual([
      { key: 'source', target: 'com.example/ghost' }
    ])
  })

  it('counts an invalid ref as missing instead of throwing', () => {
    expect(findMissingReferences(modelsDir, { bad: 'no-slash' })).toEqual([
      { key: 'bad', target: 'no-slash' }
    ])
  })
})
