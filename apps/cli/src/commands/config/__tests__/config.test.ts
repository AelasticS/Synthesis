import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
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
  let testWorkspace: string
  let configsDir: string

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `synth-test-${Date.now()}`)
    configsDir = join(testWorkspace, 'configs')
    await mkdir(configsDir, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(testWorkspace)) {
      await rm(testWorkspace, { recursive: true, force: true })
    }
  })

  it('shows message when no configs exist', async () => {
    const { stdout, error } = await runCli(['config', 'ls', '--workspace', testWorkspace])
    expect(error).toBeUndefined()
    expect(stdout).toContain('No configurations found')
  })

  it('lists config files', async () => {
    await writeFile(join(configsDir, 'test.json'), '{}')
    await writeFile(join(configsDir, 'another.cfg.json'), '{}')

    const { stdout, error } = await runCli(['config', 'ls', '--workspace', testWorkspace])
    expect(error).toBeUndefined()
    expect(stdout).toContain('test.json')
    expect(stdout).toContain('another.cfg.json')
  })

  it('filters by transformation with --for flag', async () => {
    await writeFile(join(configsDir, 'eer-to-relational.json'), '{}')
    await writeFile(join(configsDir, 'other.json'), '{}')

    const { stdout, error } = await runCli(['config', 'ls', '--for', 'eer-to-relational', '--workspace', testWorkspace])
    expect(error).toBeUndefined()
    expect(stdout).toContain('eer-to-relational.json')
    expect(stdout).not.toContain('other.json')
  })
})

describe('config show', () => {
  let testWorkspace: string
  let configsDir: string

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `synth-test-${Date.now()}`)
    configsDir = join(testWorkspace, 'configs')
    await mkdir(configsDir, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(testWorkspace)) {
      await rm(testWorkspace, { recursive: true, force: true })
    }
  })

  it('requires ref arg', async () => {
    const { error } = await runCli(['config', 'show'])
    expect(error).toBeDefined()
  })

  it('shows config content', async () => {
    const configData = { key: 'value', nested: { foo: 'bar' } }
    await writeFile(join(configsDir, 'test.json'), JSON.stringify(configData))

    const { stdout, error } = await runCli(['config', 'show', 'test', '--workspace', testWorkspace])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.key).toBe('value')
    expect(parsed.nested.foo).toBe('bar')
  })

  it('errors when config not found', async () => {
    const { error } = await runCli(['config', 'show', 'nonexistent', '--workspace', testWorkspace])
    expect(error).toBeDefined()
  })
})

describe('config edit', () => {
  let testWorkspace: string
  let configsDir: string

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `synth-test-${Date.now()}`)
    configsDir = join(testWorkspace, 'configs')
    await mkdir(configsDir, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(testWorkspace)) {
      await rm(testWorkspace, { recursive: true, force: true })
    }
  })

  it('requires ref arg', async () => {
    const { error } = await runCli(['config', 'edit'])
    expect(error).toBeDefined()
  })

  it('errors when config not found', async () => {
    const { error } = await runCli(['config', 'edit', 'nonexistent', '--workspace', testWorkspace])
    expect(error).toBeDefined()
  })
})

describe('config rm', () => {
  let testWorkspace: string
  let configsDir: string

  beforeEach(async () => {
    testWorkspace = join(tmpdir(), `synth-test-${Date.now()}`)
    configsDir = join(testWorkspace, 'configs')
    await mkdir(configsDir, { recursive: true })
  })

  afterEach(async () => {
    if (existsSync(testWorkspace)) {
      await rm(testWorkspace, { recursive: true, force: true })
    }
  })

  it('requires ref arg', async () => {
    const { error } = await runCli(['config', 'rm'])
    expect(error).toBeDefined()
  })

  it('deletes config file', async () => {
    const configPath = join(configsDir, 'test.json')
    await writeFile(configPath, '{}')
    expect(existsSync(configPath)).toBe(true)

    const { stdout, error } = await runCli(['config', 'rm', 'test', '--workspace', testWorkspace])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Deleted configuration')
    expect(existsSync(configPath)).toBe(false)
  })

  it('errors when config not found', async () => {
    const { error } = await runCli(['config', 'rm', 'nonexistent', '--workspace', testWorkspace])
    expect(error).toBeDefined()
  })
})
