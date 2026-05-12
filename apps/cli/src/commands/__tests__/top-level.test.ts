import { runCli } from '../../test-utils/run-cli.js'

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
    expect(stdout).toContain('[stub] synth doctor')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['doctor', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('doctor')
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

  it('runs with required args', async () => {
    const { stdout, error } = await runCli(['run', 'my-tx', '--in', 'ns/model'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth run')
    expect(stdout).toContain('my-tx')
    expect(stdout).toContain('ns/model')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['run', 'my-tx', '--in', 'ns/model', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('run')
    expect(parsed.args.tx).toBe('my-tx')
  })
})

describe('m2t', () => {
  it('requires model arg and --template and --out flags', async () => {
    const { error } = await runCli(['m2t'])
    expect(error).toBeDefined()
  })

  it('runs with required args', async () => {
    const { stdout, error } = await runCli(
      ['m2t', 'ns/model', '--template', 'my-template', '--out', './output']
    )
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth m2t')
    expect(stdout).toContain('ns/model')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(
      ['m2t', 'ns/model', '--template', 'tpl', '--out', './out', '--json']
    )
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('m2t')
  })
})
