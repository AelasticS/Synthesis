import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { exec } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { loadTxManifest } from '../manifest.js'

const execAsync = promisify(exec)

// Tests execute from lib/tx/__tests__; the fixture packages are plain
// directories (not compiled), so they are referenced at their source location.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')
const m2mFixture = join(fixturesDir, 'eer-to-relational')
const m2tFixture = join(fixturesDir, 'rel-to-sql-ddl')

const validSynth = {
  kind: 'm2m',
  entry: './lib/tx.js',
  exportName: 'Tx',
  source: { metamodel: 'mm/source' },
  target: { metamodel: 'mm/target' }
}

const tempDirs: string[] = []

/** Create a temp package dir with the given package.json and optional synth.json. */
function makePackage(pkg: object | undefined, synth?: object | string): string {
  const dir = mkdtempSync(join(tmpdir(), 'synth-manifest-test-'))
  tempDirs.push(dir)
  if (pkg !== undefined) {
    writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2))
  }
  if (synth !== undefined) {
    writeFileSync(join(dir, 'synth.json'), typeof synth === 'string' ? synth : JSON.stringify(synth, null, 2))
  }
  return dir
}

const basePkg = { name: 'test-tx', version: '1.0.0' }

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('loadTxManifest — manifest locations', () => {
  it('loads a complete manifest from synth.json', async () => {
    const dir = makePackage(basePkg, {
      ...validSynth,
      target: { metamodel: 'mm/target', components: 'mm/target/components' },
      parts: {
        metamodels: [{ module: './lib/mm.js', exportName: 'MM' }],
        decisionModel: { module: './lib/dm.js', exportName: 'DM' },
        bindingModel: { module: './lib/bm.js', exportName: 'BM' }
      }
    })
    const manifest = await loadTxManifest(dir)
    expect(manifest).toEqual({
      name: 'test-tx',
      version: '1.0.0',
      kind: 'm2m',
      entry: './lib/tx.js',
      exportName: 'Tx',
      source: { metamodel: 'mm/source' },
      target: { metamodel: 'mm/target', components: 'mm/target/components' },
      parts: {
        metamodels: [{ module: './lib/mm.js', exportName: 'MM' }],
        decisionModel: { module: './lib/dm.js', exportName: 'DM' },
        bindingModel: { module: './lib/bm.js', exportName: 'BM' }
      },
      variability: true
    })
  })

  it('loads the manifest from the synth block in package.json when synth.json is absent', async () => {
    const dir = makePackage({ ...basePkg, synth: validSynth })
    const manifest = await loadTxManifest(dir)
    expect(manifest.kind).toBe('m2m')
    expect(manifest.source.metamodel).toBe('mm/source')
    expect(manifest.variability).toBe(false)
    expect(manifest.parts).toBeUndefined()
  })

  it('prefers synth.json over the synth block in package.json', async () => {
    const dir = makePackage(
      { ...basePkg, synth: { ...validSynth, kind: 'm2t' } },
      validSynth
    )
    const manifest = await loadTxManifest(dir)
    expect(manifest.kind).toBe('m2m')
  })

  it('lets synth.json override the package name', async () => {
    const dir = makePackage(basePkg, { ...validSynth, name: 'renamed-tx' })
    const manifest = await loadTxManifest(dir)
    expect(manifest.name).toBe('renamed-tx')
    expect(manifest.version).toBe('1.0.0')
  })

  it('fails when neither synth.json nor a synth block exists', async () => {
    const dir = makePackage(basePkg)
    await expect(loadTxManifest(dir)).rejects.toThrow(
      `No transformation manifest found in '${dir}': expected a 'synth.json' file at the package root or a "synth" object in package.json.`
    )
  })

  it('fails when package.json is missing', async () => {
    const dir = makePackage(undefined, validSynth)
    await expect(loadTxManifest(dir)).rejects.toThrow(`No package.json found in '${dir}'`)
  })

  it('names synth.json when it is not valid JSON', async () => {
    const dir = makePackage(basePkg, '{ not json')
    await expect(loadTxManifest(dir)).rejects.toThrow(`Failed to parse '${join(dir, 'synth.json')}'`)
  })
})

describe('loadTxManifest — field validation', () => {
  const expectFieldError = async (synth: object, field: string, fragment?: string): Promise<void> => {
    const dir = makePackage(basePkg, synth)
    const promise = loadTxManifest(dir)
    await expect(promise).rejects.toThrow(`Invalid transformation manifest in '${join(dir, 'synth.json')}'`)
    await expect(promise).rejects.toThrow(`field '${field}'`)
    if (fragment) {
      await expect(promise).rejects.toThrow(fragment)
    }
  }

  it('requires kind', async () => {
    const { kind, ...rest } = validSynth
    await expectFieldError(rest, 'kind', `is required ('m2m' or 'm2t')`)
  })

  it('rejects an unknown kind', async () => {
    await expectFieldError({ ...validSynth, kind: 'text2model' }, 'kind', `must be 'm2m' or 'm2t' (got "text2model")`)
  })

  it('requires entry and exportName', async () => {
    const { entry, ...withoutEntry } = validSynth
    await expectFieldError(withoutEntry, 'entry')
    const { exportName, ...withoutExport } = validSynth
    await expectFieldError(withoutExport, 'exportName')
  })

  it('requires source and source.metamodel', async () => {
    const { source, ...withoutSource } = validSynth
    await expectFieldError(withoutSource, 'source')
    await expectFieldError({ ...validSynth, source: {} }, 'source.metamodel')
  })

  it('requires target.metamodel and a string target.components', async () => {
    await expectFieldError({ ...validSynth, target: {} }, 'target.metamodel')
    await expectFieldError({ ...validSynth, target: { metamodel: 'mm', components: 42 } }, 'target.components')
  })

  it('rejects the legacy sourceMetamodel alias in synth.json', async () => {
    const { source, ...rest } = validSynth
    await expectFieldError({ ...rest, sourceMetamodel: 'mm/source' }, 'source')
  })

  it('accepts the legacy aliases inside the package.json synth block', async () => {
    const { source, target, ...rest } = validSynth
    const dir = makePackage({
      ...basePkg,
      synth: { ...rest, sourceMetamodel: 'legacy-source', targetMetamodel: 'legacy-target' }
    })
    const manifest = await loadTxManifest(dir)
    expect(manifest.source.metamodel).toBe('legacy-source')
    expect(manifest.target.metamodel).toBe('legacy-target')
  })

  it('validates parts entries', async () => {
    await expectFieldError({ ...validSynth, parts: { metamodels: { module: 'x' } } }, 'parts.metamodels')
    await expectFieldError(
      { ...validSynth, parts: { metamodels: [{ module: './lib/mm.js' }] } },
      'parts.metamodels[0].exportName'
    )
  })

  it('requires decisionModel and bindingModel together', async () => {
    await expectFieldError(
      { ...validSynth, parts: { decisionModel: { module: './lib/dm.js', exportName: 'DM' } } },
      'parts.bindingModel',
      'must be declared together'
    )
    await expectFieldError(
      { ...validSynth, parts: { bindingModel: { module: './lib/bm.js', exportName: 'BM' } } },
      'parts.decisionModel',
      'must be declared together'
    )
  })

  it('requires name and version from package.json', async () => {
    const noName = makePackage({ version: '1.0.0' }, validSynth)
    await expect(loadTxManifest(noName)).rejects.toThrow(`field 'name' is required`)
    const noVersion = makePackage({ name: 'test-tx' }, validSynth)
    await expect(loadTxManifest(noVersion)).rejects.toThrow(`field 'version' is required`)
  })
})

describe('loadTxManifest — fixture packages', () => {
  it('loads the eer-to-relational (m2m) fixture', async () => {
    const manifest = await loadTxManifest(m2mFixture)
    expect(manifest).toEqual({
      name: 'eer-to-relational',
      version: '0.1.0',
      kind: 'm2m',
      entry: './lib/transformation.js',
      exportName: 'EER2RelDomainWithDecisionTransformation',
      source: { metamodel: '@synthesis/standard-metamodels/eer' },
      target: {
        metamodel: '@synthesis/standard-metamodels/relational',
        components: '@synthesis/standard-metamodels/relational/components-legacy'
      },
      parts: {
        metamodels: [
          { module: '@synthesis/examples/lib/eer-to-rel-small/er-metamodel.js', exportName: 'EERModel' }
        ],
        decisionModel: {
          module: '@synthesis/examples/lib/eer-to-rel-small/02-decision-model.js',
          exportName: 'RelationSchemaDesignIssues'
        },
        bindingModel: {
          module: '@synthesis/examples/lib/eer-to-rel-small/03-binding-model.js',
          exportName: 'ER_Bindings'
        }
      },
      variability: true
    })
  })

  it('loads the rel-to-sql-ddl (m2t) fixture', async () => {
    const manifest = await loadTxManifest(m2tFixture)
    expect(manifest).toEqual({
      name: 'rel-to-sql-ddl',
      version: '0.1.0',
      kind: 'm2t',
      entry: './lib/transformation.js',
      exportName: 'Rel2DdlTransformation',
      source: { metamodel: '@synthesis/standard-metamodels/relational' },
      target: { metamodel: 'text' },
      variability: false
    })
  })

  it('resolves each fixture entry module to its exported transformation class', async () => {
    // Import through a plain node subprocess: execution-time resolution must
    // work outside jest's module registry, exactly like `tx run` will do it.
    for (const [fixture, exportName] of [
      [m2mFixture, 'EER2RelDomainWithDecisionTransformation'],
      [m2tFixture, 'Rel2DdlTransformation']
    ] as const) {
      const manifest = await loadTxManifest(fixture)
      const entryUrl = pathToFileURL(join(fixture, manifest.entry)).href
      const script = `const m = await import('${entryUrl}'); console.log(typeof m['${manifest.exportName}'])`
      const { stdout } = await execAsync(`node --input-type=module -e "${script}"`)
      expect(manifest.exportName).toBe(exportName)
      expect(stdout.trim()).toBe('function')
    }
  })
})
