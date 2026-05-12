import { runCli } from '../../../test-utils/run-cli.js'

describe('config init', () => {
  it('requires tx arg and --for flag', async () => {
    const { error } = await runCli(['config', 'init'])
    expect(error).toBeDefined()
  })

  it('runs with required args', async () => {
    const { stdout, error } = await runCli(
      ['config', 'init', 'my-tx', '--for', 'ns/model']
    )
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth config init')
    expect(stdout).toContain('my-tx')
  })

  it('accepts --out flag', async () => {
    const { stdout, error } = await runCli(
      ['config', 'init', 'my-tx', '--for', 'ns/model', '--out', 'ns/cfg']
    )
    expect(error).toBeUndefined()
    expect(stdout).toContain('ns/cfg')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(
      ['config', 'init', 'my-tx', '--for', 'ns/model', '--json']
    )
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('config init')
  })
})

describe('config ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['config', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth config ls')
  })

  it('accepts --for flag', async () => {
    const { stdout, error } = await runCli(['config', 'ls', '--for', 'my-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('my-tx')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['config', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('config ls')
  })
})

describe('config show', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['config', 'show'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['config', 'show', 'ns/cfg'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth config show')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['config', 'show', 'ns/cfg', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('config edit', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['config', 'edit'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['config', 'edit', 'ns/cfg'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth config edit')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['config', 'edit', 'ns/cfg', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('config rm', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['config', 'rm'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['config', 'rm', 'ns/cfg'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth config rm')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['config', 'rm', 'ns/cfg', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})
