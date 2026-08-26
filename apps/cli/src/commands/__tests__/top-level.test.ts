import { mkdtempSync, rmSync } from 'node:fs'
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
