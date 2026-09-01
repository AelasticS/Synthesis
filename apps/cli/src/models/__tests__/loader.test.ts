import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { ModelStore } from '@aelastics/synthesis/store'

import {
  ModelClosureError,
  importModel,
  renderModel,
  renderModelClosure,
  transpileModel,
  writeGatedModelFile
} from '../loader.js'

// Tests execute from lib/models/__tests__; the .tsx fixture is not compiled
// by TypeScript, so it is referenced at its source location.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

const testRequire = createRequire(import.meta.url)

const tempDirs: string[] = []

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('transpileModel', () => {
  it('emits an ESM file with package imports resolved to absolute paths', async () => {
    const outPath = await transpileModel(personsFixture)
    tempDirs.push(dirname(outPath))
    expect(existsSync(outPath)).toBe(true)

    const text = readFileSync(outPath, 'utf8')
    // No bare workspace specifier may remain (neither the @aelastics scope
    // nor an unscoped metamodel package): a bundled copy of a metamodel or
    // support package would break aelastics type identity with the CLI
    // process.
    expect(text).not.toMatch(/from\s*["']@(?:synthesis|aelastics)\//)
    expect(text).not.toMatch(/from\s*["']eer-metamodel/)
    const eerModulePath = testRequire.resolve('eer-metamodel')
    expect(text).toContain(eerModulePath)
  })

  it('names the unresolvable specifier when a package import cannot be resolved', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'synth-loader-bad-'))
    tempDirs.push(dir)
    const badFile = join(dir, 'broken.tsx')
    writeFileSync(
      badFile,
      [
        "import { nothing } from '@synthesis/this-package-does-not-exist'",
        'export default () => nothing',
        ''
      ].join('\n')
    )
    await expect(transpileModel(badFile)).rejects.toThrow('@synthesis/this-package-does-not-exist')
  })
})

describe('importModel', () => {
  it('returns the $synth header exported by the model module', async () => {
    const { mod, header } = await importModel(personsFixture)
    expect(typeof mod.default).toBe('function')
    expect(header).toMatchObject({
      kind: 'model',
      metamodel: 'eer-metamodel'
    })
  })
})

describe('renderModel', () => {
  it('renders the model into a store and returns the root element', async () => {
    const { root, store, header } = await renderModel(personsFixture)
    expect((root as { name: string }).name).toBe('Persons')
    expect((header as { kind: string }).kind).toBe('model')
    // Rendered models register under their qualified name below the
    // jsx module's top-level namespace.
    expect(store.getByName('//www.aelastics.org/Persons')).toBe(root)
  })

  it('renders into a caller-provided store', async () => {
    const store = new ModelStore()
    const result = await renderModel(personsFixture, store)
    expect(result.store).toBe(store)
    expect(store.getByName('//www.aelastics.org/Persons')).toBe(result.root)
  })
})

describe('renderModelClosure', () => {
  // Minimal renderable model modules: a default export returning an object
  // with .render satisfies the loader without any metamodel machinery.
  const modelSource = (marker: string, references: Record<string, string>): string =>
    [
      'export const $synth = {',
      `  kind: 'model',`,
      `  metamodel: '',`,
      `  references: ${JSON.stringify(references)}`,
      '} as const',
      '',
      `export default (store: unknown) => ({ render: () => '${marker}' })`,
      ''
    ].join('\n')

  const makeModelsDir = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'synth-closure-test-'))
    tempDirs.push(dir)
    mkdirSync(join(dir, 'com', 'example'), { recursive: true })
    return dir
  }

  const writeModel = (modelsDir: string, name: string, content: string): void => {
    writeFileSync(join(modelsDir, 'com', 'example', `${name}.tsx`), content)
  }

  it('renders the reference closure depth-first and cuts cycles', async () => {
    const modelsDir = makeModelsDir()
    writeModel(modelsDir, 'a', modelSource('a', { dep: 'com.example/b' }))
    writeModel(modelsDir, 'b', modelSource('b', { back: 'com.example/a' }))
    // The cycle back to the root must not recurse forever or re-render 'a'
    const store = new ModelStore()
    await expect(renderModelClosure(modelsDir, 'com.example/a', store)).resolves.toBeUndefined()
  })

  it('reports a missing referenced model as a typed missing-ref error', async () => {
    const modelsDir = makeModelsDir()
    writeModel(modelsDir, 'a', modelSource('a', { dep: 'com.example/nothing' }))
    const promise = renderModelClosure(modelsDir, 'com.example/a', new ModelStore())
    await expect(promise).rejects.toThrow('Referenced model not found: com.example/nothing')
    await expect(promise).rejects.toMatchObject({ kind: 'missing-ref' })
    await promise.catch((err) => expect(err).toBeInstanceOf(ModelClosureError))
  })

  it('reports a malformed header in a referenced model as header-parse-failure', async () => {
    const modelsDir = makeModelsDir()
    writeModel(modelsDir, 'a', modelSource('a', { dep: 'com.example/broken' }))
    writeModel(
      modelsDir,
      'broken',
      `export const $synth = { kind: 'model', metamodel: undefined }\nexport default () => ({ render: () => 'x' })\n`
    )
    const promise = renderModelClosure(modelsDir, 'com.example/a', new ModelStore())
    await expect(promise).rejects.toMatchObject({ kind: 'header-parse-failure' })
    await expect(promise).rejects.toThrow('com.example/broken')
  })

  it('reports an invalid reference target as invalid-ref', async () => {
    const modelsDir = makeModelsDir()
    writeModel(modelsDir, 'a', modelSource('a', { dep: 'not a ref!!' }))
    await expect(renderModelClosure(modelsDir, 'com.example/a', new ModelStore())).rejects.toMatchObject({
      kind: 'invalid-ref'
    })
  })
})

describe('writeGatedModelFile', () => {
  const makeDir = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'synth-gated-write-'))
    tempDirs.push(dir)
    return dir
  }

  it('writes a new file when the gate passes and leaves no temp behind', async () => {
    const dir = makeDir()
    const target = join(dir, 'model.tsx')
    await writeGatedModelFile(target, 'good content', async (candidate) => {
      expect(candidate).not.toBe(target)
      expect(readFileSync(candidate, 'utf-8')).toBe('good content')
    })
    expect(readFileSync(target, 'utf-8')).toBe('good content')
    expect(readdirSync(dir)).toEqual(['model.tsx'])
  })

  it('replaces an existing target only after the gate passes', async () => {
    const dir = makeDir()
    const target = join(dir, 'model.tsx')
    writeFileSync(target, 'old content')
    await writeGatedModelFile(target, 'new content', async () => {})
    expect(readFileSync(target, 'utf-8')).toBe('new content')
    expect(readdirSync(dir)).toEqual(['model.tsx'])
  })

  it('keeps a pre-existing target untouched when the gate fails, and removes the temp', async () => {
    const dir = makeDir()
    const target = join(dir, 'model.tsx')
    writeFileSync(target, 'precious content')
    await expect(
      writeGatedModelFile(target, 'broken content', async () => {
        throw new Error('does not pass the import gate')
      })
    ).rejects.toThrow('does not pass the import gate')
    expect(readFileSync(target, 'utf-8')).toBe('precious content')
    expect(readdirSync(dir)).toEqual(['model.tsx'])
  })

  it('creates nothing when the gate fails for a new target', async () => {
    const dir = makeDir()
    const target = join(dir, 'model.tsx')
    await expect(
      writeGatedModelFile(target, 'broken content', async () => {
        throw new Error('rejected')
      })
    ).rejects.toThrow('rejected')
    expect(existsSync(target)).toBe(false)
    expect(readdirSync(dir)).toEqual([])
  })
})
