import { runCli } from '../../test-utils/run-cli.js'

describe('cd', () => {
  it('shows current namespace when no arg given', async () => {
    const { stdout, error } = await runCli(['cd'])
    expect(error).toBeUndefined()
    // Either shows current namespace or "No namespace set"
    expect(stdout).toBeTruthy()
  })

  it('switches to existing namespace', async () => {
    // First ensure namespace exists
    await runCli(['ns', 'mk', 'com.example.cdtest'])
    const { stdout, error } = await runCli(['cd', 'com.example.cdtest'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example.cdtest')
  })

  it('errors on non-existent namespace', async () => {
    const { error } = await runCli(['cd', 'nonexistent.namespace.12345'])
    expect(error).toBeDefined()
  })
})

describe('init', () => {
  it('runs with default path', async () => {
    const { stdout, error } = await runCli(['init'])
    expect(error).toBeUndefined()
    // Either creates new workspace or says it exists
    expect(stdout).toMatch(/Creating workspace|Workspace already exists/)
  })

  it('accepts --path flag with temp directory', async () => {
    const tmpPath = `/tmp/synth-test-${Date.now()}`
    const { stdout, error } = await runCli(['init', '--path', tmpPath])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Creating workspace')
    expect(stdout).toContain(tmpPath)
  })
})

describe('doctor', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Workspace Health Check')
    expect(stdout).toContain('Summary:')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['doctor', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.workspace).toBeDefined()
    expect(parsed.checks).toBeDefined()
    expect(Array.isArray(parsed.checks)).toBe(true)
  })
})

describe('workspace', () => {
  it('shows workspace info', async () => {
    const { stdout, error } = await runCli(['workspace'])
    expect(error).toBeUndefined()
    // Shows workspace path or says none initialized
    expect(stdout).toMatch(/Workspace:|No workspace initialized/)
  })

  it('rejects invalid workspace path', async () => {
    const { error } = await runCli(['workspace', '--set', '/nonexistent/path'])
    expect(error).toBeDefined()
  })
})

describe('run', () => {
  it('requires tx arg and --in flag', async () => {
    const { error } = await runCli(['run'])
    expect(error).toBeDefined()
  })

  it('errors when transformation not found', async () => {
    const { error, stderr } = await runCli(['run', 'my-tx', '--in', 'ns/model'])
    expect(error).toBeDefined()
    // Should report transformation not found (verifies real file check)
    expect(stderr).toContain('Transformation not found')
  })

  it('validates transformation exists before running', async () => {
    const { error, stderr } = await runCli(['run', 'nonexistent-tx', '--in', 'ns/model'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Transformation not found: nonexistent-tx')
  })
})

describe('m2t', () => {
  it('requires model arg and --template and --out flags', async () => {
    const { error } = await runCli(['m2t'])
    expect(error).toBeDefined()
  })

  it('errors when model not found', async () => {
    const { error, stderr } = await runCli(
      ['m2t', 'ns/model', '--template', 'my-template', '--out', './output']
    )
    expect(error).toBeDefined()
    // Should report model not found (verifies real file check)
    expect(stderr).toContain('Model not found')
  })

  it('validates model exists before running', async () => {
    const { error, stderr } = await runCli(
      ['m2t', 'nonexistent/model', '--template', 'tpl', '--out', './out']
    )
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found: nonexistent/model')
  })
})
