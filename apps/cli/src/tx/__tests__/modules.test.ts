import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { importTxModule, moduleExport, requireExport } from '../modules.js'

const tempDirs: string[] = []

function makePackageDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'synth-modules-test-'))
  tempDirs.push(dir)
  return dir
}

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('importTxModule', () => {
  it('imports a bare package specifier through the CLI module registry', async () => {
    const dir = makePackageDir()
    const mod = await importTxModule(dir, '@synthesis/engine')
    expect(typeof mod.ModelStore).toBe('function')
  })

  it('wraps an unresolvable bare specifier in a clear error', async () => {
    const dir = makePackageDir()
    await expect(importTxModule(dir, '@synthesis/no-such-package-anywhere')).rejects.toThrow(
      `Cannot resolve module '@synthesis/no-such-package-anywhere': package imports must be resolvable from the Synthesis CLI installation`
    )
  })

  it(`imports a './'-relative module from the package directory`, async () => {
    const dir = makePackageDir()
    mkdirSync(join(dir, 'lib'), { recursive: true })
    writeFileSync(join(dir, 'lib', 'mod.js'), 'export const Answer = () => 42\n')
    const mod = await importTxModule(dir, './lib/mod.js')
    const answer = requireExport(mod, './lib/mod.js', 'Answer')
    expect(typeof answer).toBe('function')
    expect((answer as () => number)()).toBe(42)
  })

  it(`names the missing file for a './'-relative module that does not exist`, async () => {
    const dir = makePackageDir()
    await expect(importTxModule(dir, './lib/nothing.js')).rejects.toThrow(
      `Module './lib/nothing.js' not found in the installed package`
    )
  })
})

describe('moduleExport', () => {
  it('reads named exports and falls back to default for CJS-shaped modules', () => {
    expect(moduleExport({ X: 1 }, 'X')).toBe(1)
    expect(moduleExport({ default: { X: 2 } }, 'X')).toBe(2)
    expect(moduleExport({}, 'X')).toBeUndefined()
  })
})
