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
  const testDir = join(tmpdir(), 'synth-tx-init-test')

  beforeEach(() => {
    // Clean up test directory before each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    // Clean up after tests
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  })

  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'init'])
    expect(error).toBeDefined()
  })

  it('creates project directory with scaffolded files', async () => {
    const projectName = 'test-tx-project'
    const projectDir = join(testDir, projectName)

    // Run from test directory
    const { stdout, error } = await runCli(['tx', 'init', projectName], { cwd: testDir })
    expect(error).toBeUndefined()
    expect(stdout).toContain('Creating transformation project')

    // Verify files were created
    expect(existsSync(join(projectDir, 'package.json'))).toBe(true)
    expect(existsSync(join(projectDir, 'tsconfig.json'))).toBe(true)
    expect(existsSync(join(projectDir, 'src', 'index.ts'))).toBe(true)
  })

  it('fails if directory already exists', async () => {
    const projectName = 'existing-project'
    const projectDir = join(testDir, projectName)

    // Create the directory first
    mkdirSync(projectDir, { recursive: true })

    const { error } = await runCli(['tx', 'init', projectName], { cwd: testDir })
    expect(error).toBeDefined()
  })
})

describe('tx build', () => {
  it('fails without package.json', async () => {
    const testDir = join(tmpdir(), 'synth-tx-build-test-empty')
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(testDir, { recursive: true })

    try {
      const { error, stderr } = await runCli(['tx', 'build'], { cwd: testDir })
      expect(error).toBeDefined()
      expect(stderr).toContain('No package.json found')
    } finally {
      rmSync(testDir, { recursive: true })
    }
  })
})

describe('tx test', () => {
  it('fails without package.json', async () => {
    const testDir = join(tmpdir(), 'synth-tx-test-test-empty')
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(testDir, { recursive: true })

    try {
      const { error, stderr } = await runCli(['tx', 'test'], { cwd: testDir })
      expect(error).toBeDefined()
      expect(stderr).toContain('No package.json found')
    } finally {
      rmSync(testDir, { recursive: true })
    }
  })

  it('reports no test script when package.json has no test script', async () => {
    const testDir = join(tmpdir(), 'synth-tx-test-no-script')
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(testDir, { recursive: true })

    try {
      // Create minimal package.json without test script
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', scripts: {} }))

      const { stdout, error } = await runCli(['tx', 'test'], { cwd: testDir })
      expect(error).toBeUndefined()
      expect(stdout).toContain('No test script')
    } finally {
      rmSync(testDir, { recursive: true })
    }
  })
})

describe('tx pack', () => {
  it('fails without package.json', async () => {
    const testDir = join(tmpdir(), 'synth-tx-pack-test-empty')
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(testDir, { recursive: true })

    try {
      const { error, stderr } = await runCli(['tx', 'pack'], { cwd: testDir })
      expect(error).toBeDefined()
      expect(stderr).toContain('No package.json found')
    } finally {
      rmSync(testDir, { recursive: true })
    }
  })
})

describe('tx publish', () => {
  it('fails without package.json', async () => {
    const testDir = join(tmpdir(), 'synth-tx-publish-test-empty')
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(testDir, { recursive: true })

    try {
      const { error, stderr } = await runCli(['tx', 'publish'], { cwd: testDir })
      expect(error).toBeDefined()
      expect(stderr).toContain('No package.json found')
    } finally {
      rmSync(testDir, { recursive: true })
    }
  })

  it('supports --dry-run flag', async () => {
    // This will still fail because there's no package.json, but it should accept the flag
    const { error } = await runCli(['tx', 'publish', '--dry-run', '--help'])
    // --help should work with the flag present
    expect(error).toBeUndefined()
  })
})
