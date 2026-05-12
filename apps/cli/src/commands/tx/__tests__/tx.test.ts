import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { runCli } from '../../../test-utils/run-cli.js'

// Create a unique temp directory for each test run
const testTmpDir = join(tmpdir(), `synth-tx-test-${Date.now()}`)
const testTxDir = join(testTmpDir, 'test-tx')
const testTxPkgJson = {
  name: 'test-tx',
  version: '1.0.0',
  description: 'Test transformation',
  synth: {
    sourceMetamodel: 'source-meta',
    targetMetamodel: 'target-meta'
  }
}

beforeAll(() => {
  // Create test transformation directory
  mkdirSync(testTxDir, { recursive: true })
  writeFileSync(join(testTxDir, 'package.json'), JSON.stringify(testTxPkgJson, null, 2))
})

afterAll(() => {
  // Clean up test directory
  if (existsSync(testTmpDir)) {
    rmSync(testTmpDir, { recursive: true, force: true })
  }
})

describe('tx ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'ls'])
    expect(error).toBeUndefined()
    // Should show "No transformations installed." or list transformations
    expect(stdout).toBeTruthy()
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'ls', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('transformations')
    expect(Array.isArray(parsed.transformations)).toBe(true)
  })
})

describe('tx install', () => {
  it('requires package arg', async () => {
    const { error } = await runCli(['tx', 'install'])
    expect(error).toBeDefined()
  })

  it('errors on non-existent path', async () => {
    const { error } = await runCli(['tx', 'install', '/non/existent/path'])
    expect(error).toBeDefined()
  })

  it('installs local directory transformation', async () => {
    const { stdout, error } = await runCli(['tx', 'install', testTxDir])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Installed transformation')
    expect(stdout).toContain('test-tx')
  })

  it('outputs JSON with --json flag on install', async () => {
    // First uninstall if exists
    await runCli(['tx', 'uninstall', 'test-tx'])

    const { stdout, error } = await runCli(['tx', 'install', testTxDir, '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.installed).toBe(true)
    expect(parsed.name).toBe('test-tx')
    expect(parsed.version).toBe('1.0.0')
  })
})

describe('tx uninstall', () => {
  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'uninstall'])
    expect(error).toBeDefined()
  })

  it('errors on non-existent transformation', async () => {
    const { error } = await runCli(['tx', 'uninstall', 'non-existent-tx'])
    expect(error).toBeDefined()
  })

  it('uninstalls installed transformation', async () => {
    // First ensure it's installed
    await runCli(['tx', 'install', testTxDir])

    const { stdout, error } = await runCli(['tx', 'uninstall', 'test-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Uninstalled transformation')
    expect(stdout).toContain('test-tx')
  })

  it('outputs JSON with --json flag on uninstall', async () => {
    // First ensure it's installed
    await runCli(['tx', 'install', testTxDir])

    const { stdout, error } = await runCli(['tx', 'uninstall', 'test-tx', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.uninstalled).toBe(true)
    expect(parsed.name).toBe('test-tx')
  })
})

describe('tx show', () => {
  beforeEach(async () => {
    // Ensure transformation is installed before each show test
    await runCli(['tx', 'uninstall', 'test-tx'])
    await runCli(['tx', 'install', testTxDir])
  })

  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'show'])
    expect(error).toBeDefined()
  })

  it('errors on non-existent transformation', async () => {
    const { error } = await runCli(['tx', 'show', 'non-existent-tx'])
    expect(error).toBeDefined()
  })

  it('shows transformation metadata', async () => {
    const { stdout, error } = await runCli(['tx', 'show', 'test-tx'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('test-tx')
    expect(stdout).toContain('1.0.0')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'show', 'test-tx', '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.name).toBe('test-tx')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.description).toBe('Test transformation')
    expect(parsed.sourceMetamodel).toBe('source-meta')
    expect(parsed.targetMetamodel).toBe('target-meta')
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
