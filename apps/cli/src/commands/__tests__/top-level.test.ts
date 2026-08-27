import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runCli } from '../../test-utils/run-cli.js'

// Isolated HOME for all suites in this file so tests do not read or
// mutate the developer's ~/.synth workspace.
let testHome: string

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-cd-test-'))
  await runCli(['init'], { home: testHome })
})

// Workspaces created via `init --path`; removed only after the whole file
// ran, because init may leave them as the active workspace for later tests.
const pathWorkspaces: string[] = []

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
  for (const ws of pathWorkspaces) {
    rmSync(ws, { recursive: true, force: true })
  }
})

describe('cd', () => {
  it('shows current namespace when no arg given', async () => {
    const { stdout, error } = await runCli(['cd'], { home: testHome })
    expect(error).toBeUndefined()
    // Either shows current namespace or "No namespace set"
    expect(stdout).toBeTruthy()
  })

  it('switches to existing namespace', async () => {
    // First ensure namespace exists
    await runCli(['ns', 'mk', 'com.example.cdtest'], { home: testHome })
    const { stdout, error } = await runCli(['cd', 'com.example.cdtest'], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example.cdtest')
  })

  it('errors on non-existent namespace', async () => {
    const { error } = await runCli(['cd', 'nonexistent.namespace.12345'], { home: testHome })
    expect(error).toBeDefined()
  })
})

describe('init', () => {
  it('runs with default path', async () => {
    const { stdout, error } = await runCli(['init'], { home: testHome })
    expect(error).toBeUndefined()
    // Either creates new workspace or says it exists
    expect(stdout).toMatch(/Creating workspace|Workspace already exists/)
  })

  it('accepts --path flag with temp directory', async () => {
    const tmpPath = join(tmpdir(), `synth-test-${Date.now()}`)
    pathWorkspaces.push(tmpPath)
    const { stdout, error } = await runCli(['init', '--path', tmpPath], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('Creating workspace')
    expect(stdout).toContain(tmpPath)
  })
})

describe('doctor', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['doctor'], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('Workspace Health Check')
    expect(stdout).toContain('Summary:')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['doctor', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.workspace).toBeDefined()
    expect(parsed.checks).toBeDefined()
    expect(Array.isArray(parsed.checks)).toBe(true)
  })
})

describe('doctor model checks', () => {
  // Own isolated HOME: earlier suites in this file switch the active
  // workspace, and these tests hand-place model files into it.
  let home: string
  let modelsDir: string

  const run = (args: string[]) => runCli(args, { home })

  beforeAll(async () => {
    home = mkdtempSync(join(tmpdir(), 'synth-doctor-test-'))
    await runCli(['init'], { home })
    modelsDir = join(home, '.synth', 'models')
    mkdirSync(join(modelsDir, 'demo'), { recursive: true })
  })

  afterAll(() => {
    rmSync(home, { recursive: true, force: true })
  })

  it('reports 0 errors for a healthy workspace', async () => {
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('0 errors')
    expect(stdout).toContain('[ok] Models tree')
    expect(stdout).toContain('[ok] Model headers')
    expect(stdout).toContain('[ok] Model references')
  })

  it('warns about unaddressable legacy entries and names each path', async () => {
    // Legacy layouts: a dot-named flat directory and a root-level .tsx.
    // Every command skips them, so doctor must surface them as warnings.
    mkdirSync(join(modelsDir, 'legacy.flat'), { recursive: true })
    writeFileSync(join(modelsDir, 'legacy.flat', 'cars.tsx'), 'export default () => null\n')
    writeFileSync(join(modelsDir, 'stray.tsx'), 'export default () => null\n')

    const { stdout, error } = await run(['doctor'])
    // Warnings only: doctor still exits 0
    expect(error).toBeUndefined()
    expect(stdout).toContain('[warn] Unaddressable entry')
    expect(stdout).toContain(join(modelsDir, 'legacy.flat'))
    expect(stdout).toContain(join(modelsDir, 'stray.tsx'))
    expect(stdout).toContain('0 errors')

    // The skipped entries never appear in listings
    const ls = await run(['model', 'ls', '--json'])
    expect(ls.error).toBeUndefined()
    const refs = JSON.parse(ls.stdout).map((row: { ref: string }) => row.ref)
    expect(refs).not.toContain('legacy.flat/cars')
    expect(refs).not.toContain('stray')

    rmSync(join(modelsDir, 'legacy.flat'), { recursive: true, force: true })
    rmSync(join(modelsDir, 'stray.tsx'))
  })

  it('warns about a model file with a garbage header', async () => {
    const badFile = join(modelsDir, 'demo', 'garbage.tsx')
    writeFileSync(badFile, "export const $synth = { kind: broken() }\nexport default () => null\n")
    const { stdout, error } = await run(['doctor'])
    // Warnings do not fail doctor
    expect(error).toBeUndefined()
    expect(stdout).toContain('[warn] Model header (demo/garbage)')
    expect(stdout).toContain('Unparseable $synth header')
    rmSync(badFile)
  })

  it('errors when a header references a model that does not exist', async () => {
    const refFile = join(modelsDir, 'demo', 'refbad.tsx')
    writeFileSync(
      refFile,
      [
        'export const $synth = {',
        "  kind: 'model',",
        "  metamodel: '@synthesis/standard-metamodels/eer',",
        "  references: { sourceModel: 'nope/missing' }",
        '} as const',
        '',
        'export default () => null',
        ''
      ].join('\n')
    )
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeDefined()
    expect(stdout).toContain('[error] Model reference (demo/refbad)')
    expect(stdout).toContain('nope/missing')
    rmSync(refFile)
  })

  it('errors when the configured current namespace has no directory', async () => {
    const configPath = join(home, '.synth', 'config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf-8'))
    config.currentNamespace = 'ghost.ns'
    writeFileSync(configPath, JSON.stringify(config))
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeDefined()
    expect(stdout).toContain('[error] Current namespace')
    expect(stdout).toContain('ghost.ns')
    delete config.currentNamespace
    writeFileSync(configPath, JSON.stringify(config))
  })

  it('doctor --fix stamps a header-less model; a second run is clean', async () => {
    const plainFile = join(modelsDir, 'demo', 'plain.tsx')
    writeFileSync(
      plainFile,
      [
        "import { createExprNode } from '@synthesis/jsx-runtime'",
        "import { EERSchema } from '@synthesis/standard-metamodels/eer'",
        '',
        'export default () => null',
        ''
      ].join('\n')
    )
    const first = await run(['doctor', '--fix'])
    expect(first.error).toBeUndefined()
    expect(first.stdout).toContain('[ok] Model header (demo/plain)')
    expect(first.stdout).toContain('--fix')

    const text = readFileSync(plainFile, 'utf-8')
    expect(text).toContain('export const $synth')
    expect(text).toContain("metamodel: '@synthesis/standard-metamodels/eer'")
    expect(text).toContain("kind: 'model'")

    const second = await run(['doctor'])
    expect(second.error).toBeUndefined()
    expect(second.stdout).toContain('0 errors')
    expect(second.stdout).not.toContain('[warn] Model header')
    rmSync(plainFile)
  })
})

describe('workspace', () => {
  it('shows workspace info', async () => {
    const { stdout, error } = await runCli(['workspace'], { home: testHome })
    expect(error).toBeUndefined()
    // Shows workspace path or says none initialized
    expect(stdout).toMatch(/Workspace:|No workspace initialized/)
  })

  it('rejects invalid workspace path', async () => {
    const { error } = await runCli(['workspace', '--set', '/nonexistent/path'], { home: testHome })
    expect(error).toBeDefined()
  })
})

describe('run', () => {
  it('requires tx arg and --in flag', async () => {
    const { error } = await runCli(['run'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('errors when transformation not found', async () => {
    const { error, stderr } = await runCli(['run', 'my-tx', '--in', 'ns/model'], { home: testHome })
    expect(error).toBeDefined()
    // Should report transformation not found (verifies real file check)
    expect(stderr).toContain('Transformation not found')
  })

  it('validates transformation exists before running', async () => {
    const { error, stderr } = await runCli(['run', 'nonexistent-tx', '--in', 'ns/model'], { home: testHome })
    expect(error).toBeDefined()
    expect(stderr).toContain('Transformation not found: nonexistent-tx')
  })
})

describe('m2t', () => {
  it('requires model arg and --template and --out flags', async () => {
    const { error } = await runCli(['m2t'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('errors when model not found', async () => {
    const { error, stderr } = await runCli(['m2t', 'ns/model', '--template', 'my-template', '--out', './output'], { home: testHome })
    expect(error).toBeDefined()
    // Should report model not found (verifies real file check)
    expect(stderr).toContain('Model not found')
  })

  it('validates model exists before running', async () => {
    const { error, stderr } = await runCli(['m2t', 'nonexistent/model', '--template', 'tpl', '--out', './out'], { home: testHome })
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found: nonexistent/model')
  })
})
