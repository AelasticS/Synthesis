import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

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
