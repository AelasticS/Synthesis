import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// Tests execute from lib/commands/tx/__tests__; the fixture transformation
// packages are plain directories referenced at their source location.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')

// Create a unique temp directory for each test run
const testTmpDir = join(tmpdir(), `synth-tx-test-${Date.now()}`)
const testTxDir = join(testTmpDir, 'test-tx')
const testTxPkgJson = {
  name: 'test-tx',
  version: '1.0.0',
  description: 'Test transformation'
}
const testTxSynthJson = {
  kind: 'm2m',
  entry: './lib/transformation.js',
  exportName: 'TestTransformation',
  source: { metamodel: 'source-meta' },
  target: { metamodel: 'target-meta' }
}

// Isolated HOME so tests do not depend on the developer's ~/.synth state
// and parallel test suites do not collide on shared workspace files.
let testHome: string

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-tx-home-'))
  await runCli(['init'], { home: testHome })
  // Create test transformation directory
  mkdirSync(testTxDir, { recursive: true })
  writeFileSync(join(testTxDir, 'package.json'), JSON.stringify(testTxPkgJson, null, 2))
  writeFileSync(join(testTxDir, 'synth.json'), JSON.stringify(testTxSynthJson, null, 2))
})

afterAll(() => {
  // Clean up test directories
  if (existsSync(testTmpDir)) {
    rmSync(testTmpDir, { recursive: true, force: true })
  }
  rmSync(testHome, { recursive: true, force: true })
})

describe('tx ls', () => {
  it('runs successfully', async () => {
    const { stdout, error } = await runCli(['tx', 'ls'], { home: testHome })
    expect(error).toBeUndefined()
    // Should show "No transformations installed." or list transformations
    expect(stdout).toBeTruthy()
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'ls', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed).toHaveProperty('transformations')
    expect(Array.isArray(parsed.transformations)).toBe(true)
  })
})

describe('tx install', () => {
  it('requires package arg', async () => {
    const { error } = await runCli(['tx', 'install'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('errors on non-existent path', async () => {
    const { error } = await runCli(['tx', 'install', '/non/existent/path'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('installs local directory transformation', async () => {
    const { stdout, error } = await runCli(['tx', 'install', testTxDir], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('Installed transformation')
    expect(stdout).toContain('test-tx')
  })

  it('outputs JSON with --json flag on install', async () => {
    // First uninstall if exists
    await runCli(['tx', 'uninstall', 'test-tx'], { home: testHome })

    const { stdout, error } = await runCli(['tx', 'install', testTxDir, '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.installed).toBe(true)
    expect(parsed.name).toBe('test-tx')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.kind).toBe('m2m')
    expect(parsed.variability).toBe(false)
  })

  it('rejects a package without a transformation manifest', async () => {
    const noManifestDir = join(testTmpDir, 'no-manifest-tx')
    mkdirSync(noManifestDir, { recursive: true })
    writeFileSync(join(noManifestDir, 'package.json'), JSON.stringify({ name: 'no-manifest-tx', version: '1.0.0' }))

    const { error, stderr } = await runCli(['tx', 'install', noManifestDir], { home: testHome })
    expect(error).toBeDefined()
    expect(stderr).toContain('No transformation manifest found')
  })

  it('rejects a package whose manifest is missing required fields', async () => {
    const invalidDir = join(testTmpDir, 'invalid-manifest-tx')
    mkdirSync(invalidDir, { recursive: true })
    writeFileSync(join(invalidDir, 'package.json'), JSON.stringify({ name: 'invalid-manifest-tx', version: '1.0.0' }))
    writeFileSync(join(invalidDir, 'synth.json'), JSON.stringify({ kind: 'm2m' }))

    const { error, stderr } = await runCli(['tx', 'install', invalidDir], { home: testHome })
    expect(error).toBeDefined()
    // oclif wraps stderr at terminal width; flatten before asserting
    expect(stderr.replace(/·?\s*\n\s*›?\s*/g, ' ')).toContain(`field 'entry'`)
  })

  it('rejects a manifest name that would escape the transformations directory', async () => {
    // The name becomes a directory segment; separators and '..' must not
    // let an install write outside transformations/ or clobber siblings.
    for (const [badName, reason] of [
      ['../evil', 'path separator'],
      ['a/b', 'path separator'],
      ['a\\\\b', 'path separator'],
      ['..', `contains '..'`]
    ] as const) {
      const dir = join(testTmpDir, `bad-name-tx-${Buffer.from(badName).toString('hex')}`)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'bad-name-tx', version: '1.0.0' }))
      writeFileSync(join(dir, 'synth.json'), JSON.stringify({ ...testTxSynthJson, name: badName }))

      const { error, stderr } = await runCli(['tx', 'install', dir], { home: testHome })
      expect(error).toBeDefined()
      // oclif wraps stderr at terminal width; flatten before asserting
      const flat = stderr.replace(/·?\s*\n\s*›?\s*/g, ' ')
      expect(flat).toContain('is not usable as an install directory name')
      expect(flat).toContain(reason)
    }
  })
})

describe('tx uninstall', () => {
  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'uninstall'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('errors on non-existent transformation', async () => {
    const { error } = await runCli(['tx', 'uninstall', 'non-existent-tx'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('uninstalls installed transformation', async () => {
    // First ensure it's installed
    await runCli(['tx', 'install', testTxDir], { home: testHome })

    const { stdout, error } = await runCli(['tx', 'uninstall', 'test-tx'], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('Uninstalled transformation')
    expect(stdout).toContain('test-tx')
  })

  it('outputs JSON with --json flag on uninstall', async () => {
    // First ensure it's installed
    await runCli(['tx', 'install', testTxDir], { home: testHome })

    const { stdout, error } = await runCli(['tx', 'uninstall', 'test-tx', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.uninstalled).toBe(true)
    expect(parsed.name).toBe('test-tx')
  })
})

describe('tx show', () => {
  beforeEach(async () => {
    // Ensure transformation is installed before each show test
    await runCli(['tx', 'uninstall', 'test-tx'], { home: testHome })
    await runCli(['tx', 'install', testTxDir], { home: testHome })
  })

  it('requires name arg', async () => {
    const { error } = await runCli(['tx', 'show'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('errors on non-existent transformation', async () => {
    const { error } = await runCli(['tx', 'show', 'non-existent-tx'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('shows transformation metadata', async () => {
    const { stdout, error } = await runCli(['tx', 'show', 'test-tx'], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('test-tx')
    expect(stdout).toContain('1.0.0')
    expect(stdout).toContain('kind: m2m')
    expect(stdout).toContain('source metamodel: source-meta')
    expect(stdout).toContain('target metamodel: target-meta')
    expect(stdout).toContain('variability: no')
  })

  it('outputs JSON with --json flag', async () => {
    const { stdout, error } = await runCli(['tx', 'show', 'test-tx', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.name).toBe('test-tx')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.description).toBe('Test transformation')
    expect(parsed.kind).toBe('m2m')
    expect(parsed.entry).toBe('./lib/transformation.js')
    expect(parsed.exportName).toBe('TestTransformation')
    expect(parsed.sourceMetamodel).toBe('source-meta')
    expect(parsed.targetMetamodel).toBe('target-meta')
    expect(parsed.variability).toBe(false)
  })

  it('degrades to config data with a warning when the installed manifest is broken', async () => {
    // A synth.json at the package root takes precedence, so a broken one
    // makes every manifest load fail for this installed entry.
    const installedDir = join(testHome, '.synth', 'transformations', 'test-tx')
    writeFileSync(join(installedDir, 'synth.json'), '{ broken json')

    const human = await runCli(['tx', 'show', 'test-tx'], { home: testHome })
    expect(human.error).toBeUndefined()
    expect(human.code).toBe(0)
    expect(human.stdout).toContain('Transformation: test-tx')
    expect(human.stdout).toContain('version: 1.0.0')
    expect(human.stdout).toContain(installedDir)
    expect(human.stderr).toContain('manifest could not be loaded')
    expect(human.stderr).toContain('Failed to parse')

    const jsonRun = await runCli(['tx', 'show', 'test-tx', '--json'], { home: testHome })
    expect(jsonRun.error).toBeUndefined()
    expect(jsonRun.code).toBe(0)
    const parsed = JSON.parse(jsonRun.stdout)
    expect(parsed.name).toBe('test-tx')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.path).toBe(installedDir)
    expect(parsed.manifestError).toContain('Failed to parse')
    expect(parsed.kind).toBeUndefined()
  })
})

describe('fixture transformation packages', () => {
  const m2mFixture = join(fixturesDir, 'eer-to-relational')
  const m2tFixture = join(fixturesDir, 'rel-to-sql-ddl')

  afterAll(async () => {
    await runCli(['tx', 'uninstall', 'eer-to-relational'], { home: testHome })
    await runCli(['tx', 'uninstall', 'rel-to-sql-ddl'], { home: testHome })
  })

  it('installs the eer-to-relational (m2m) fixture and shows its manifest', async () => {
    const install = await runCli(['tx', 'install', m2mFixture, '--json'], { home: testHome })
    expect(install.error).toBeUndefined()
    const installed = JSON.parse(install.stdout)
    expect(installed.installed).toBe(true)
    expect(installed.name).toBe('eer-to-relational')
    expect(installed.kind).toBe('m2m')
    expect(installed.variability).toBe(true)

    const { stdout, error } = await runCli(['tx', 'show', 'eer-to-relational'], { home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('kind: m2m')
    expect(stdout).toContain('source metamodel: eer-metamodel')
    expect(stdout).toContain('target metamodel: relational-metamodel')
    expect(stdout).toContain('target components: relational-metamodel')
    expect(stdout).toContain('variability: yes')
    expect(stdout).toContain('entry: ./lib/transformation.js (export: EER2RelDomainWithDecisionTransformation)')
    expect(stdout).toContain(
      'metamodel: ./lib/eer-to-rel-small/er-metamodel.js (export: EERModel)'
    )
    expect(stdout).toContain(
      'decision model: ./lib/eer-to-rel-small/02-decision-model.js (export: RelationSchemaDesignIssues)'
    )
    expect(stdout).toContain(
      'binding model: ./lib/eer-to-rel-small/03-binding-model.js (export: ER_Bindings)'
    )
  })

  it('installs the rel-to-sql-ddl (m2t) fixture and shows its manifest', async () => {
    const install = await runCli(['tx', 'install', m2tFixture], { home: testHome })
    expect(install.error).toBeUndefined()
    expect(install.stdout).toContain(`Installed transformation 'rel-to-sql-ddl@0.1.0' (m2t)`)

    const { stdout, error } = await runCli(['tx', 'show', 'rel-to-sql-ddl', '--json'], { home: testHome })
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.name).toBe('rel-to-sql-ddl')
    expect(parsed.kind).toBe('m2t')
    expect(parsed.exportName).toBe('Rel2DdlTransformation')
    expect(parsed.sourceMetamodel).toBe('relational-metamodel')
    expect(parsed.targetMetamodel).toBe('text')
    // The m2t fixture is configuration-based (IdentifierQuoting) since Phase 4
    expect(parsed.variability).toBe(true)
    expect(parsed.parts.decisionModel.exportName).toBe('DdlGenerationIssues')
    expect(parsed.parts.bindingModel.exportName).toBe('Rel_Bindings')
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
    const { error } = await runCli(['tx', 'init'], { home: testHome })
    expect(error).toBeDefined()
  })

  it('creates project directory with scaffolded files', async () => {
    const projectName = 'test-tx-project'
    const projectDir = join(testDir, projectName)

    // Run from test directory
    const { stdout, error } = await runCli(['tx', 'init', projectName], { cwd: testDir, home: testHome })
    expect(error).toBeUndefined()
    expect(stdout).toContain('Creating transformation project')

    // Verify files were created
    expect(existsSync(join(projectDir, 'package.json'))).toBe(true)
    expect(existsSync(join(projectDir, 'synth.json'))).toBe(true)
    expect(existsSync(join(projectDir, 'tsconfig.json'))).toBe(true)
    expect(existsSync(join(projectDir, 'src', 'index.ts'))).toBe(true)
  })

  it('scaffolds a package that tx install accepts as-is', async () => {
    const projectName = 'installable-scaffold'
    const projectDir = join(testDir, projectName)

    const init = await runCli(['tx', 'init', projectName], { cwd: testDir, home: testHome })
    expect(init.error).toBeUndefined()

    // The manifest's exportName must name the scaffolded class
    const indexTs = readFileSync(join(projectDir, 'src', 'index.ts'), 'utf-8')
    const synth = JSON.parse(readFileSync(join(projectDir, 'synth.json'), 'utf-8'))
    expect(indexTs).toContain(`export class ${synth.exportName}`)

    try {
      const install = await runCli(['tx', 'install', projectDir, '--json'], { cwd: testDir, home: testHome })
      expect(install.error).toBeUndefined()
      const parsed = JSON.parse(install.stdout)
      expect(parsed.installed).toBe(true)
      expect(parsed.name).toBe(projectName)
      expect(parsed.kind).toBe('m2m')
    } finally {
      await runCli(['tx', 'uninstall', projectName], { home: testHome })
    }
  })

  it('fails if directory already exists', async () => {
    const projectName = 'existing-project'
    const projectDir = join(testDir, projectName)

    // Create the directory first
    mkdirSync(projectDir, { recursive: true })

    const { error } = await runCli(['tx', 'init', projectName], { cwd: testDir, home: testHome })
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
      const { error, stderr } = await runCli(['tx', 'build'], { cwd: testDir, home: testHome })
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
      const { error, stderr } = await runCli(['tx', 'test'], { cwd: testDir, home: testHome })
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

      const { stdout, error } = await runCli(['tx', 'test'], { cwd: testDir, home: testHome })
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
      const { error, stderr } = await runCli(['tx', 'pack'], { cwd: testDir, home: testHome })
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
      const { error, stderr } = await runCli(['tx', 'publish'], { cwd: testDir, home: testHome })
      expect(error).toBeDefined()
      expect(stderr).toContain('No package.json found')
    } finally {
      rmSync(testDir, { recursive: true })
    }
  })

  it('supports --dry-run flag', async () => {
    // This will still fail because there's no package.json, but it should accept the flag
    const { error } = await runCli(['tx', 'publish', '--dry-run', '--help'], { home: testHome })
    // --help should work with the flag present
    expect(error).toBeUndefined()
  })
})
