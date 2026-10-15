import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { registerModuleResolutionRoots, resolveBareSpecifier } from '../resolution.js'
import { transpileModel } from '../loader.js'

/**
 * The fallback resolution contract: bare specifiers resolve from the CLI
 * installation first, then from registered transformation roots, exactly
 * once per specifier per process (whoever resolves first wins for every
 * later importer, preserving module and aelastics type identity).
 */
describe('bare specifier resolution', () => {
  const tempDirs: string[] = []

  function makeRootWithPackage(pkgName: string, marker: string): string {
    // require.resolve returns real paths; normalize so symlinked temp dirs
    // (macOS /var -> /private/var, Windows 8.3 names) compare equal.
    const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'synth-res-root-')))
    tempDirs.push(root)
    const pkgDir = join(root, 'node_modules', pkgName)
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: pkgName, main: 'index.js' }))
    writeFileSync(join(pkgDir, 'index.js'), `module.exports = { marker: '${marker}' }\n`)
    return root
  }

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('resolves CLI-installation packages without any registered root', () => {
    expect(resolveBareSpecifier('esbuild')).toContain('esbuild')
  })

  it('falls back to registered transformation roots and memoizes the winner', () => {
    const first = makeRootWithPackage('synth-test-fake-metamodel', 'first')
    const second = makeRootWithPackage('synth-test-fake-metamodel', 'second')
    registerModuleResolutionRoots([first, second])

    const resolved = resolveBareSpecifier('synth-test-fake-metamodel')
    expect(resolved).toBe(join(first, 'node_modules', 'synth-test-fake-metamodel', 'index.js'))
    // The second root also provides the package, but the memoized first
    // resolution wins for every later caller.
    expect(resolveBareSpecifier('synth-test-fake-metamodel')).toBe(resolved)
  })

  it('names both resolution scopes when nothing resolves', () => {
    expect(() => resolveBareSpecifier('synth-test-no-such-package-anywhere')).toThrow(
      /CLI installation or from an installed transformation package/
    )
  })

  it('externalizes root-resolved imports to absolute paths in transpiled models', async () => {
    const root = makeRootWithPackage('synth-test-model-dep', 'model-dep')
    registerModuleResolutionRoots([root])

    const modelDir = realpathSync.native(mkdtempSync(join(tmpdir(), 'synth-res-model-')))
    tempDirs.push(modelDir)
    const modelPath = join(modelDir, 'model.tsx')
    writeFileSync(
      modelPath,
      "import { marker } from 'synth-test-model-dep'\nexport default () => marker\n"
    )

    const outPath = await transpileModel(modelPath)
    tempDirs.push(dirname(outPath))
    const text = readFileSync(outPath, 'utf8')
    expect(text).not.toMatch(/from\s*["']synth-test-model-dep["']/)
    expect(text).toContain(join(root, 'node_modules', 'synth-test-model-dep', 'index.js'))
  })
})
