import { runCli } from '../../../test-utils/run-cli.js'

describe('model ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['model', 'ls'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth model ls')
  })

  it('accepts --ns flag', async () => {
    const { stdout, error } = await runCli(['model', 'ls', '--ns', 'com.example'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('com.example')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['model', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('model ls')
  })
})

describe('model show', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['model', 'show'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['model', 'show', 'ns/name'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth model show')
    expect(stdout).toContain('ns/name')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['model', 'show', 'ns/name', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.args.ref).toBe('ns/name')
  })
})

describe('model import', () => {
  it('requires file arg', async () => {
    const { error } = await runCli(['model', 'import'])
    expect(error).toBeDefined()
  })

  it('runs with file arg', async () => {
    const { stdout, error } = await runCli(['model', 'import', './model.json'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth model import')
  })

  it('accepts --as flag', async () => {
    const { stdout, error } = await runCli(
      ['model', 'import', './model.json', '--as', 'ns/name']
    )
    expect(error).toBeUndefined()
    expect(stdout).toContain('ns/name')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['model', 'import', './model.json', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
    expect(parsed.command).toBe('model import')
  })
})

describe('model export', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['model', 'export'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['model', 'export', 'ns/name'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth model export')
  })

  it('accepts --to flag', async () => {
    const { stdout, error } = await runCli(
      ['model', 'export', 'ns/name', '--to', './out.json']
    )
    expect(error).toBeUndefined()
    expect(stdout).toContain('./out.json')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['model', 'export', 'ns/name', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('model rm', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['model', 'rm'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['model', 'rm', 'ns/name'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth model rm')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['model', 'rm', 'ns/name', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})

describe('model validate', () => {
  it('requires ref arg', async () => {
    const { error } = await runCli(['model', 'validate'])
    expect(error).toBeDefined()
  })

  it('runs with ref arg', async () => {
    const { stdout, error } = await runCli(['model', 'validate', 'ns/name'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('[stub] synth model validate')
  })

  it('accepts --against flag', async () => {
    const { stdout, error } = await runCli(
      ['model', 'validate', 'ns/name', '--against', '@pkg/mm']
    )
    expect(error).toBeUndefined()
    expect(stdout).toContain('@pkg/mm')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['model', 'validate', 'ns/name', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.stub).toBe(true)
  })
})
