import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const hookUrl = pathToFileURL(resolve(__dirname, '../framework-hooks.js')).href
const cliMetamodelUrl = pathToFileURL(
  createRequire(import.meta.url).resolve('@aelastics/synthesis/metamodel')
).href

// A metamodel package as an installed example ships it: in a folder with
// no @aelastics packages anywhere above it.
let dir: string
let metamodelUrl: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'synth-hooks-'))
  const pkg = join(dir, 'node_modules', 'some-metamodel')
  mkdirSync(pkg, { recursive: true })
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'some-metamodel', type: 'module', main: 'index.js' }))
  writeFileSync(join(pkg, 'index.js'), "export { Model } from '@aelastics/synthesis/metamodel'\n")
  writeFileSync(join(pkg, 'unknown.js'), "export * from '@aelastics/no-such-package'\n")
  metamodelUrl = pathToFileURL(join(pkg, 'index.js')).href
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

/** Import `target` in a fresh Node process, optionally with the hook registered. */
function importIn(target: string, withHook: boolean): { status: number | null; out: string } {
  const script = [
    "import { register } from 'node:module'",
    withHook ? `register(${JSON.stringify(hookUrl)})` : '',
    `const mm = await import(${JSON.stringify(target)})`,
    `const cli = await import(${JSON.stringify(cliMetamodelUrl)})`,
    "console.log(mm.Model === cli.Model ? 'same instance' : 'different instance')"
  ].join('\n')
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: dir, encoding: 'utf-8' })
  return { status: result.status, out: `${result.stdout}${result.stderr}` }
}

describe('framework resolution hook', () => {
  it('is needed: without it the metamodel cannot resolve the framework', () => {
    const { status, out } = importIn(metamodelUrl, false)
    expect(status).not.toBe(0)
    expect(out).toMatch(/Cannot find package '@aelastics\/synthesis'/)
  })

  it("resolves the metamodel's framework imports to the CLI's own instance", () => {
    const { status, out } = importIn(metamodelUrl, true)
    expect(out).toContain('same instance')
    expect(status).toBe(0)
  })

  it('leaves a framework package the CLI does not carry to Node', () => {
    const { status, out } = importIn(pathToFileURL(join(dir, 'node_modules', 'some-metamodel', 'unknown.js')).href, true)
    expect(status).not.toBe(0)
    expect(out).toMatch(/Cannot find package '@aelastics\/no-such-package'/)
  })
})
