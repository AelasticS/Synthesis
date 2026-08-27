import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runCli } from '../../../test-utils/run-cli.js'

// Isolated HOME so tests do not depend on the developer's ~/.synth state
// and parallel test suites do not collide on shared workspace files.
let testHome: string
let modelsDir: string

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-ns-test-'))
  modelsDir = join(testHome, '.synth', 'models')
  await runCli(['init'], { home: testHome })
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
})

describe('ns ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['ns', 'ls'], { home: testHome })
    expect(error).toBeUndefined()
    // Real command outputs namespace list or "No namespaces found" message
    expect(stdout).toBeTruthy()
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'ls', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('namespaces')
    expect(Array.isArray(parsed.namespaces)).toBe(true)
  })

  it('shows dotted names for nested directories, including intermediates', async () => {
    await runCli(['ns', 'mk', 'org.acme.billing'], { home: testHome })
    const { stdout, error } = await runCli(['ns', 'ls', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespaces).toContain('org')
    expect(parsed.namespaces).toContain('org.acme')
    expect(parsed.namespaces).toContain('org.acme.billing')
  })

  it('does not list a dot-named flat directory (unaddressable; doctor reports it)', async () => {
    // Old workspaces used one flat directory literally named 'legacy.flat';
    // no ref can address it, so the listing skips it
    mkdirSync(join(modelsDir, 'legacy.flat'), { recursive: true })
    const { stdout, error } = await runCli(['ns', 'ls', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespaces).not.toContain('legacy.flat')
  })
})

describe('ns mk', () => {
  it('requires namespace arg', async () => {
    const { error } = await runCli(['ns', 'mk'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('runs with namespace arg', async () => {
    const { stdout, error } = await runCli(['ns', 'mk', 'com.example'], { home: testHome })
    expect(error).toBeUndefined()
    // Real command creates namespace or says it already exists
    expect(stdout).toContain('com.example')
  })

  it('creates a nested directory tree', async () => {
    await runCli(['ns', 'mk', 'com.example.orders'], { home: testHome })
    expect(existsSync(join(modelsDir, 'com', 'example', 'orders'))).toBe(true)
    // No flat directory with the dotted name
    expect(existsSync(join(modelsDir, 'com.example.orders'))).toBe(false)
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'mk', 'com.example', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespace).toBe('com.example')
    // Either created: true or created: false (already exists)
    expect(typeof parsed.created).toBe('boolean')
  })

  it('rejects an invalid namespace', async () => {
    const { error } = await runCli(['ns', 'mk', 'com..broken'], { home: testHome })
    expect(error).toBeDefined()
  })
})

describe('ns rm', () => {
  it('requires namespace arg', async () => {
    const { error } = await runCli(['ns', 'rm'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('runs with namespace arg', async () => {
    // First create the namespace
    await runCli(['ns', 'mk', 'com.example.toremove'], { home: testHome })
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.toremove'], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example.toremove')
    expect(existsSync(join(modelsDir, 'com', 'example', 'toremove'))).toBe(false)
  })

  it('refuses a namespace with model files without --force', async () => {
    await runCli(['ns', 'mk', 'com.example.busy'], { home: testHome })
    writeFileSync(join(modelsDir, 'com', 'example', 'busy', 'person.tsx'), 'export default {}\n')
    const { stderr, error } = await runCli(['ns', 'rm', 'com.example.busy'], { home: testHome })
    expect(error).toBeDefined()
    expect(stderr).toContain('not empty')
    expect(existsSync(join(modelsDir, 'com', 'example', 'busy'))).toBe(true)
  })

  it('refuses when a sub-namespace contains model files', async () => {
    await runCli(['ns', 'mk', 'com.deep.inner'], { home: testHome })
    writeFileSync(join(modelsDir, 'com', 'deep', 'inner', 'model.tsx'), 'export default {}\n')
    const { error } = await runCli(['ns', 'rm', 'com.deep'], { home: testHome })
    expect(error).toBeDefined()
    expect(existsSync(join(modelsDir, 'com', 'deep', 'inner'))).toBe(true)
  })

  it('refuses a namespace containing only a non-model file', async () => {
    // Data-loss guard: ANY file counts as content, not just .tsx models
    await runCli(['ns', 'mk', 'com.example.notes'], { home: testHome })
    writeFileSync(join(modelsDir, 'com', 'example', 'notes', 'todo.txt'), 'notes\n')
    const { stderr, error } = await runCli(['ns', 'rm', 'com.example.notes'], { home: testHome })
    expect(error).toBeDefined()
    expect(stderr).toContain('not empty')
    expect(existsSync(join(modelsDir, 'com', 'example', 'notes', 'todo.txt'))).toBe(true)
    await runCli(['ns', 'rm', 'com.example.notes', '--force'], { home: testHome })
    expect(existsSync(join(modelsDir, 'com', 'example', 'notes'))).toBe(false)
  })

  it('reports refusal as JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.busy', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.removed).toBe(false)
    expect(parsed.error).toBe('not empty')
  })

  it('accepts --force flag', async () => {
    // Create namespace first
    await runCli(['ns', 'mk', 'com.example.forceremove'], { home: testHome })
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.forceremove', '--force'], { home: testHome })
    expect(error).toBeUndefined()
    // Either removes or says doesn't exist
    expect(stdout).toBeTruthy()
  })

  it('removes a namespace with model files with --force', async () => {
    const { error } = await runCli(['ns', 'rm', 'com.example.busy', '--force'], { home: testHome })
    expect(error).toBeUndefined()
    expect(existsSync(join(modelsDir, 'com', 'example', 'busy'))).toBe(false)
  })

  it('outputs JSON with --json flag', async () => {
    // Create namespace first
    await runCli(['ns', 'mk', 'com.example.jsonremove'], { home: testHome })
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.jsonremove', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespace).toBe('com.example.jsonremove')
    // Either removed: true or removed: false
    expect(typeof parsed.removed).toBe('boolean')
  })
})
