import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runCli } from '../../../test-utils/run-cli.js'

// Isolated HOME so tests do not depend on the developer's ~/.synth state
// and parallel test suites do not collide on shared workspace files.
let testHome: string

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-ns-test-'))
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

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'mk', 'com.example', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespace).toBe('com.example')
    // Either created: true or created: false (already exists)
    expect(typeof parsed.created).toBe('boolean')
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
  })

  it('accepts --force flag', async () => {
    // Create namespace first
    await runCli(['ns', 'mk', 'com.example.forceremove'], { home: testHome })
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.forceremove', '--force'], { home: testHome })
    expect(error).toBeUndefined()
    // Either removes or says doesn't exist
    expect(stdout).toBeTruthy()
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
