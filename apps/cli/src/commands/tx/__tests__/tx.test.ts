import { runCli } from '../../../test-utils/run-cli.js'

describe('tx ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx ls')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('tx ls')
  })
})

describe('tx install', () => {
  it('requires package arg', async () => {
    const { error } = await runCli(['tx', 'install'])
    expect(error).toBeDefined()
  })

  it('runs with package arg', async () => {
    const { stdout, error } = await runCli(['tx', 'install', '@pkg/tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx install')
    expect(stdout).toContain('@pkg/tx')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'install', '@pkg/tx', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.args.package).toBe('@pkg/tx')
  })
})

describe('tx uninstall', () => {
  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'uninstall'])
    expect(error).toBeDefined()
  })

  it('runs with name arg', async () => {
    const { stdout, error } = await runCli(['tx', 'uninstall', 'my-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx uninstall')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'uninstall', 'my-tx', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('tx show', () => {
  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'show'])
    expect(error).toBeDefined()
  })

  it('runs with name arg', async () => {
    const { stdout, error } = await runCli(['tx', 'show', 'my-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx show')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'show', 'my-tx', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('tx init', () => {
  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'init'])
    expect(error).toBeDefined()
  })

  it('runs with name arg', async () => {
    const { stdout, error } = await runCli(['tx', 'init', 'my-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx init')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'init', 'my-tx', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('tx build', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'build'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx build')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'build', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('tx test', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'test'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx test')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'test', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('tx pack', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'pack'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx pack')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'pack', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('tx publish', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'publish'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth tx publish')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'publish', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})
