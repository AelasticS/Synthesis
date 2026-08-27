import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { ModelStore } from '@synthesis/engine'

import { transpileModel, importModel, renderModel } from '../loader.js'

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
    // No bare metamodel specifier may remain: a bundled copy of a metamodel
    // package would break aelastics type identity with the CLI process.
    expect(text).not.toMatch(/from\s*["']@synthesis\//)
    const eerModulePath = testRequire.resolve('@synthesis/standard-metamodels/eer')
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
      metamodel: '@synthesis/standard-metamodels/eer'
    })
  })
})

describe('renderModel', () => {
  it('renders the model into a store and returns the root element', async () => {
    const { root, store, header } = await renderModel(personsFixture)
    expect((root as { name: string }).name).toBe('Persons')
    expect((header as { kind: string }).kind).toBe('model')
    // Rendered models register under their qualified name below the
    // jsx-runtime top-level namespace.
    expect(store.getByName('//www.aelastics.org/Persons')).toBe(root)
  })

  it('renders into a caller-provided store', async () => {
    const store = new ModelStore()
    const result = await renderModel(personsFixture, store)
    expect(result.store).toBe(store)
    expect(store.getByName('//www.aelastics.org/Persons')).toBe(result.root)
  })
})
