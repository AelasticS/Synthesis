import { runCli } from '../../../test-utils/run-cli.js'

describe('ns ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['ns', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth ns ls')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('ns ls')
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
    expect(stdout).toContain('[stub] synth ns mk')
    expect(stdout).toContain('com.example')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'mk', 'com.example', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('ns mk')
    expect(parsed.args.namespace).toBe('com.example')
  })
})

describe('ns rm', () => {
  it('requires namespace arg', async () => {
    const { error } = await runCli(['ns', 'rm'])
    expect(error).toBeDefined()
  })

  it('runs with namespace arg', async () => {
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth ns rm')
  })

  it('accepts --force flag', async () => {
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example', '--force'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('force')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['ns', 'rm', 'com.example', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('ns rm')
  })
})
