import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { runCli } from '../../../test-utils/run-cli.js'

describe('model commands', () => {
  let tempDir: string
  let workspaceDir: string

  // Helper to run CLI with temp HOME
  const run = (args: string[]) => runCli(args, { home: tempDir })

  beforeEach(async () => {
    // Create temp directory for test workspace
    tempDir = await mkdtemp(join(tmpdir(), 'synth-test-'))
    workspaceDir = join(tempDir, 'workspace')

    // Create workspace structure
    await mkdir(join(workspaceDir, 'models', 'com.example'), { recursive: true })

    // Create a test model
    await writeFile(
      join(workspaceDir, 'models', 'com.example', 'test-model.json'),
      JSON.stringify({ name: 'TestModel', version: '1.0' }, null, 2)
    )

    // Create config in ~/.synth/config.json
    await mkdir(join(tempDir, '.synth'), { recursive: true })
    await writeFile(
      join(tempDir, '.synth', 'config.json'),
      JSON.stringify({
        workspace: workspaceDir,
        currentNamespace: 'com.example',
        transformations: {}
      })
    )
  })

  afterEach(async () => {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('model ls', () => {
    it('lists models in current namespace', async () => {
      const { stdout, error } = await run(['model', 'ls'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('test-model')
    })

    it('outputs JSON with --json flag', async () => {
      const { stdout, error } = await run(['model', 'ls', '--json'])
      expect(error).toBeUndefined()
      const parsed = JSON.parse(stdout)
      expect(parsed.models).toContain('test-model')
      expect(parsed.namespace).toBe('com.example')
    })

    it('shows empty message when no models', async () => {
      // Create empty namespace
      await mkdir(join(workspaceDir, 'models', 'empty.ns'), { recursive: true })
      await writeFile(
        join(tempDir, '.synth', 'config.json'),
        JSON.stringify({
          workspace: workspaceDir,
          currentNamespace: 'empty.ns',
          transformations: {}
        })
      )

      const { stdout, error } = await run(['model', 'ls'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('No models found')
    })
  })

  describe('model show', () => {
    it('requires ref arg', async () => {
      const { error } = await run(['model', 'show'])
      expect(error).toBeDefined()
    })

    it('displays model content', async () => {
      const { stdout, error } = await run(['model', 'show', 'com.example/test-model'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('TestModel')
      expect(stdout).toContain('1.0')
    })

    it('outputs JSON with --json flag', async () => {
      const { stdout, error } = await run(['model', 'show', 'com.example/test-model', '--json'])
      expect(error).toBeUndefined()
      const parsed = JSON.parse(stdout)
      expect(parsed.ref).toBe('com.example/test-model')
      expect(parsed.model.name).toBe('TestModel')
    })

    it('errors on invalid ref format', async () => {
      const { error } = await run(['model', 'show', 'invalid-ref'])
      expect(error).toBeDefined()
    })

    it('errors on non-existent model', async () => {
      const { error } = await run(['model', 'show', 'com.example/nonexistent'])
      expect(error).toBeDefined()
    })
  })

  describe('model import', () => {
    let sourceFile: string

    beforeEach(async () => {
      // Create a source file to import
      sourceFile = join(tempDir, 'source-model.json')
      await writeFile(sourceFile, JSON.stringify({ name: 'ImportedModel' }))
    })

    it('requires file arg', async () => {
      const { error } = await run(['model', 'import'])
      expect(error).toBeDefined()
    })

    it('imports file to current namespace', async () => {
      const { stdout, error } = await run(['model', 'import', sourceFile])
      expect(error).toBeUndefined()
      expect(stdout).toContain('Imported com.example/source-model')

      // Verify file was created
      const destPath = join(workspaceDir, 'models', 'com.example', 'source-model.json')
      expect(existsSync(destPath)).toBe(true)
    })

    it('imports file with --as flag', async () => {
      const { stdout, error } = await run(['model', 'import', sourceFile, '--as', 'other.ns/custom-name'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('Imported other.ns/custom-name')

      // Verify file was created in correct location
      const destPath = join(workspaceDir, 'models', 'other.ns', 'custom-name.json')
      expect(existsSync(destPath)).toBe(true)
    })

    it('outputs JSON with --json flag', async () => {
      const { stdout, error } = await run(['model', 'import', sourceFile, '--json'])
      expect(error).toBeUndefined()
      const parsed = JSON.parse(stdout)
      expect(parsed.imported).toBe('com.example/source-model')
    })

    it('errors on non-existent source file', async () => {
      const { error } = await run(['model', 'import', '/nonexistent/file.json'])
      expect(error).toBeDefined()
    })

    it('errors on invalid JSON source file', async () => {
      const invalidFile = join(tempDir, 'invalid.json')
      await writeFile(invalidFile, 'not valid json')
      const { error } = await run(['model', 'import', invalidFile])
      expect(error).toBeDefined()
    })
  })

  describe('model export', () => {
    it('requires ref arg', async () => {
      const { error } = await run(['model', 'export'])
      expect(error).toBeDefined()
    })

    it('exports model to specified path', async () => {
      const destFile = join(tempDir, 'test-model.json')
      const { stdout, error } = await run(['model', 'export', 'com.example/test-model', '--to', destFile])
      expect(error).toBeUndefined()
      expect(stdout).toContain('Exported com.example/test-model')

      // Verify file was created
      expect(existsSync(destFile)).toBe(true)
      const content = JSON.parse(await readFile(destFile, 'utf-8'))
      expect(content.name).toBe('TestModel')
    })

    it('exports model with --to flag', async () => {
      const destFile = join(tempDir, 'custom-output.json')
      const { stdout, error } = await run(['model', 'export', 'com.example/test-model', '--to', destFile])
      expect(error).toBeUndefined()
      expect(stdout).toContain(destFile)

      expect(existsSync(destFile)).toBe(true)
    })

    it('outputs JSON with --json flag', async () => {
      const destFile = join(tempDir, 'export-test.json')
      const { stdout, error } = await run(['model', 'export', 'com.example/test-model', '--to', destFile, '--json'])
      expect(error).toBeUndefined()
      const parsed = JSON.parse(stdout)
      expect(parsed.exported).toBe('com.example/test-model')
    })

    it('errors on invalid ref format', async () => {
      const { error } = await run(['model', 'export', 'invalid-ref'])
      expect(error).toBeDefined()
    })

    it('errors on non-existent model', async () => {
      const { error } = await run(['model', 'export', 'com.example/nonexistent'])
      expect(error).toBeDefined()
    })
  })

  describe('model rm', () => {
    it('requires ref arg', async () => {
      const { error } = await run(['model', 'rm'])
      expect(error).toBeDefined()
    })

    it('deletes model file', async () => {
      const modelPath = join(workspaceDir, 'models', 'com.example', 'test-model.json')
      expect(existsSync(modelPath)).toBe(true)

      const { stdout, error } = await run(['model', 'rm', 'com.example/test-model'])
      expect(error).toBeUndefined()
      expect(stdout).toContain('Deleted com.example/test-model')

      expect(existsSync(modelPath)).toBe(false)
    })

    it('outputs JSON with --json flag', async () => {
      const { stdout, error } = await run(['model', 'rm', 'com.example/test-model', '--json'])
      expect(error).toBeUndefined()
      const parsed = JSON.parse(stdout)
      expect(parsed.deleted).toBe('com.example/test-model')
    })

    it('errors on invalid ref format', async () => {
      const { error } = await run(['model', 'rm', 'invalid-ref'])
      expect(error).toBeDefined()
    })

    it('errors on non-existent model', async () => {
      const { error } = await run(['model', 'rm', 'com.example/nonexistent'])
      expect(error).toBeDefined()
    })
  })
})

describe('model validate', () => {
  // Note: model validate is still a stub command, so keep these tests
  it('requires ref arg', async () => {
    const { error } = await runCli(['model', 'validate'])
    expect(error).toBeDefined()
  })

  it('errors when model not found', async () => {
    const { error, stderr } = await runCli(['model', 'validate', 'ns/name'])
    expect(error).toBeDefined()
    // Should report model not found (verifies real file check)
    expect(stderr).toContain('Model not found')
  })

  it('validates model ref format', async () => {
    const { error, stderr } = await runCli(['model', 'validate', 'invalid-ref'])
    expect(error).toBeDefined()
    expect(stderr).toContain('Invalid model ref')
  })

  it('reports not found for nonexistent model', async () => {
    const { error, stderr } = await runCli(
      ['model', 'validate', 'nonexistent/model', '--against', '@pkg/mm']
    )
    expect(error).toBeDefined()
    expect(stderr).toContain('Model not found: nonexistent/model')
  })
})
