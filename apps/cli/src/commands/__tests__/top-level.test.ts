import { runCli } from '../../test-utils/run-cli.js'

describe('init', () => {
  it('runs with default path', async () => {
    const { stdout, error } = await runCli(['init'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth init')
    expect(stdout).toContain('would:')
  })

  it('accepts --path flag', async () => {
    const { stdout, error } = await runCli(['init', '--path', '/custom/path'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('/custom/path')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['init', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('init')
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
  it('runs without --set', async () => {
    const { stdout, error } = await runCli(['workspace'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth workspace')
  })

  it('runs with --set', async () => {
    const { stdout, error } = await runCli(['workspace', '--set', '/new/path'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('/new/path')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['workspace', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('workspace')
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
