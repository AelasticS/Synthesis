import { runCli } from '../../../test-utils/run-cli.js'

describe('ns ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['ns', 'ls'])
    expect(error).toBeUndefined()
    // Real command outputs namespace list or "No namespaces found" message
    expect(stdout).toBeTruthy()
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('namespaces')
    expect(Array.isArray(parsed.namespaces)).toBe(true)
  })
})

describe('ns mk', () => {
  it('requires namespace arg', async () => {
    const { error } = await runCli(['ns', 'mk'])
    expect(error).toBeDefined()
  })

  it('runs with namespace arg', async () => {
    const { stdout, error } = await runCli(['ns', 'mk', 'com.example'])
    expect(error).toBeUndefined()
    // Real command creates namespace or says it already exists
    expect(stdout).toContain('com.example')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'mk', 'com.example', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespace).toBe('com.example')
    // Either created: true or created: false (already exists)
    expect(typeof parsed.created).toBe('boolean')
  })
})

describe('ns rm', () => {
  it('requires namespace arg', async () => {
    const { error } = await runCli(['ns', 'rm'])
    expect(error).toBeDefined()
  })

  it('runs with namespace arg', async () => {
    // First create the namespace
    await runCli(['ns', 'mk', 'com.example.toremove'])
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.toremove'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example.toremove')
  })

  it('accepts --force flag', async () => {
    // Create namespace first
    await runCli(['ns', 'mk', 'com.example.forceremove'])
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.forceremove', '--force'])
    expect(error).toBeUndefined()
    // Either removes or says doesn't exist
    expect(stdout).toBeTruthy()
  })

  it('outputs JSON with --json flag', async () => {
    // Create namespace first
    await runCli(['ns', 'mk', 'com.example.jsonremove'])
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example.jsonremove', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.namespace).toBe('com.example.jsonremove')
    // Either removed: true or removed: false
    expect(typeof parsed.removed).toBe('boolean')
  })
})
