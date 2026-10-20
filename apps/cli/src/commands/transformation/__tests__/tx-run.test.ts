import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// Tests execute from lib/commands/tx/__tests__; fixtures are referenced at
// their source location (they are not compiled by TypeScript).
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const fixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')
const personsFixture = join(packageRoot, 'src/models/__tests__/fixtures/persons.tsx')

// Isolated HOME so tests neither read nor mutate the developer's ~/.synth
// workspace; the workspace lives at <home>/.synth (init default path).
let testHome: string
let tempDir: string
let modelsDir: string

const run = (args: string[]) => runCli(args, { home: testHome })

// oclif wraps stderr at terminal width, inserting '·\n ›' inside messages;
// flatten the wrapping so substring assertions can span line breaks.
const flatten = (text: string): string => text.replace(/·?\s*\n\s*›?\s*/g, ' ')

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-tx-run-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-tx-run-out-'))
  modelsDir = join(testHome, '.synth', 'models')
  await run(['init'])
  await run(['ns', 'mk', 'com.example'])
  await run(['model', 'import', personsFixture, '--as', 'com.example/persons'])
  await run(['tx', 'install', join(fixturesDir, 'eer-to-relational')])
  await run(['tx', 'install', join(fixturesDir, 'rel-to-sql-ddl')])
})

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
  rmSync(tempDir, { recursive: true, force: true })
})

describe('tx run errors', () => {
  it('fails with NOT_FOUND for an unknown transformation and lists installed ones', async () => {
    const { code, stderr } = await run(['tx', 'run', 'no-such-tx', '--in', 'com.example/persons'])
    expect(code).toBe(3)
    expect(stderr).toContain('Transformation not found')
    expect(stderr).toContain('eer-to-relational')
  })

  it('fails with NOT_FOUND when the input model is missing', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/missing', '--out', 'com.example/x'
    ])
    expect(code).toBe(3)
    expect(stderr).toContain('Source model not found')
  })

  it('fails with NOT_FOUND and a reinstall hint when the installed package is gone', async () => {
    // Register a valid transformation, then rip its package directory out
    // from under the workspace config.
    const ghostDir = join(tempDir, 'ghost-tx')
    mkdirSync(ghostDir, { recursive: true })
    writeFileSync(join(ghostDir, 'package.json'), JSON.stringify({ name: 'ghost-tx', version: '1.0.0' }))
    writeFileSync(
      join(ghostDir, 'synth.json'),
      JSON.stringify({
        kind: 'm2m',
        entry: './lib/transformation.js',
        exportName: 'GhostTransformation',
        source: { metamodel: 'mm/source' },
        target: { metamodel: 'mm/target' }
      })
    )
    const install = await run(['tx', 'install', ghostDir])
    expect(install.error).toBeUndefined()
    rmSync(join(testHome, '.synth', 'transformations', 'ghost-tx'), { recursive: true, force: true })

    try {
      const { code, stderr } = await run(['tx', 'run', 'ghost-tx', '--in', 'com.example/persons'])
      expect(code).toBe(3)
      expect(flatten(stderr)).toContain('installed package is missing')
      expect(flatten(stderr)).toContain('transformation install')
    } finally {
      await run(['tx', 'uninstall', 'ghost-tx'])
    }
  })

  it('rejects an input model with a malformed $synth header (exit 2)', async () => {
    // Placed directly in the models tree: `model import` would refuse to
    // stamp this, but tx run must not silently skip the metamodel gate.
    const brokenPath = join(modelsDir, 'com', 'example', 'broken-header.tsx')
    writeFileSync(
      brokenPath,
      `export const $synth = { kind: 'model', metamodel: undefined }\nexport default () => ({ render: () => 'x' })\n`
    )
    try {
      const { code, stderr } = await run([
        'tx', 'run', 'eer-to-relational', '--in', 'com.example/broken-header', '--out', 'com.example/never'
      ])
      expect(code).toBe(2)
      expect(flatten(stderr)).toContain('malformed $synth header')
    } finally {
      rmSync(brokenPath, { force: true })
    }
  })

  it('rejects an input model whose metamodel does not match the manifest (exit 2)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons', '--out-dir', join(tempDir, 'never')
    ])
    expect(code).toBe(2)
    expect(stderr).toContain('eer-metamodel')
    expect(stderr).toContain('relational-metamodel')
  })

  it('requires --out-dir for an m2t transformation', async () => {
    const { code, stderr } = await run(['tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons'])
    expect(code).toBe(1)
    expect(stderr).toContain('--out-dir')
  })

  it('rejects --out on m2t and --out-dir on m2m', async () => {
    const outOnM2t = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons', '--out', 'com.example/x'
    ])
    expect(outOnM2t.code).toBe(1)
    expect(flatten(outOnM2t.stderr)).toContain('--out is only valid when the transformation is m2m')

    const outDirOnM2m = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out-dir', tempDir
    ])
    expect(outDirOnM2m.code).toBe(1)
    expect(flatten(outDirOnM2m.stderr)).toContain('--out-dir is only valid when the transformation is m2t')
  })
})

describe('tx run configuration consent (uniform policy)', () => {
  // Decisions are NEVER applied without explicit consent: a configuration-based
  // transformation runs on --config or on --default-configs, and with
  // neither it aborts (exit 2) before any engine work.
  it('aborts a configuration-based run without --config or --default-configs, teaching both', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--out', 'com.example/never-consent'
    ])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`Transformation 'eer-to-relational' is configuration-based`)
    expect(message).toContain('synth config init eer-to-relational --for com.example/persons')
    expect(message).toContain('--default-configs')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-consent.tsx'))).toBe(false)
  })

  it('rejects --config combined with --default-configs (core exclusivity, exit 1)', async () => {
    // The exclusivity lives in the execution core, not in oclif flag
    // metadata, so `tx run` and `run` fail with one identical message.
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/whatever', '--default-configs', '--out', 'com.example/never-consent'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('--config and --default-configs are mutually exclusive')
  })

  it('rejects --save-config without --default-configs (exit 1, before any engine work)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--save-config', 'com.example/never-saved', '--out', 'com.example/never-consent'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('--save-config')
    expect(message).toContain('--default-configs')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-saved.tsx'))).toBe(false)
  })

  describe('on a transformation without decisions', () => {
    // A manifest-only fixture: the config-policy checks run before any
    // module of the package is loaded.
    beforeAll(async () => {
      const plainDir = join(tempDir, 'plain-tx')
      mkdirSync(plainDir, { recursive: true })
      writeFileSync(join(plainDir, 'package.json'), JSON.stringify({ name: 'plain-tx', version: '1.0.0' }))
      writeFileSync(
        join(plainDir, 'synth.json'),
        JSON.stringify({
          kind: 'm2m',
          entry: './lib/transformation.js',
          exportName: 'PlainTransformation',
          source: { metamodel: 'eer-metamodel' },
          target: { metamodel: 'relational-metamodel' }
        })
      )
      const install = await run(['tx', 'install', plainDir])
      expect(install.error).toBeUndefined()
    })

    afterAll(async () => {
      await run(['tx', 'uninstall', 'plain-tx'])
    })

    it('rejects --config', async () => {
      const { code, stderr } = await run([
        'tx', 'run', 'plain-tx', '--in', 'com.example/persons',
        '--config', 'com.example/tx-cfg', '--out', 'com.example/never-plain'
      ])
      expect(code).toBe(1)
      expect(flatten(stderr)).toContain('--config is only valid for configuration-based transformations')
    })

    it('rejects --default-configs', async () => {
      const { code, stderr } = await run([
        'tx', 'run', 'plain-tx', '--in', 'com.example/persons',
        '--default-configs', '--out', 'com.example/never-plain'
      ])
      expect(code).toBe(1)
      expect(flatten(stderr)).toContain('--default-configs is only valid for configuration-based transformations')
    })

    it('rejects --save-config', async () => {
      const { code, stderr } = await run([
        'tx', 'run', 'plain-tx', '--in', 'com.example/persons',
        '--save-config', 'com.example/never-plain-cfg', '--out', 'com.example/never-plain'
      ])
      expect(code).toBe(1)
      expect(flatten(stderr)).toContain('--save-config is only valid for configuration-based transformations')
    })
  })
})

describe('tx run m2m', () => {
  const outRef = 'com.example/persons-rel'
  const outPath = () => join(modelsDir, 'com', 'example', 'persons-rel.tsx')

  it('runs the configuration-based m2m fixture end to end', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs', '--out', outRef
    ])
    expect(error).toBeUndefined()
    // Default configuration decisions are announced, one line each
    expect(stdout).toContain('SnakeCase')
    expect(stdout).toContain('PrimaryKeyStrategy -> UseAutoIncrement (default)')
    expect(stdout).toContain(`Wrote ${outRef}`)
    expect(existsSync(outPath())).toBe(true)
  })

  it('writes a model that passes its own import gate (model validate)', async () => {
    const { stdout, error } = await run(['model', 'validate', outRef])
    expect(error).toBeUndefined()
    expect(stdout).toContain(`Model ${outRef} is valid`)
  })

  it('stamps provenance into the generated header', async () => {
    const { stdout, error } = await run(['model', 'show', outRef, '--json'])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.header.kind).toBe('model')
    expect(parsed.header.metamodel).toBe('relational-metamodel')
    expect(parsed.header.generatedBy.tx).toBe('eer-to-relational')
    expect(parsed.header.generatedBy.config).toBe('defaults')
  })

  it('keeps the workspace clean for doctor', async () => {
    const { stdout, error } = await run(['doctor'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('0 errors')
  })

  it('refuses an existing target without --overwrite (exit 1)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs', '--out', outRef
    ])
    expect(code).toBe(1)
    expect(stderr).toContain('--overwrite')
    // The refused run must not have clobbered the model
    expect(existsSync(outPath())).toBe(true)
  })

  it('replaces an existing target with --overwrite via temp-file rename, leaving no temp behind', async () => {
    const before = readFileSync(outPath(), 'utf-8')
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs', '--out', outRef, '--overwrite'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain(`Wrote ${outRef}`)
    // The result was renamed over the target (same model, fresh header dates)
    const after = readFileSync(outPath(), 'utf-8')
    expect(after).toContain('export default')
    expect(after).not.toBe(before)
    // No `<name>.<pid>.tmp.tsx` intermediate may survive the rename
    const siblings = readdirSync(dirname(outPath()))
    expect(siblings.filter((name) => name.includes('.tmp'))).toEqual([])
    // And the replacement still passes the workspace's own gate
    const validate = await run(['model', 'validate', outRef])
    expect(validate.error).toBeUndefined()
  })

  it('emits a machine-readable result with --json', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons-rel-json', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.tx).toBe('eer-to-relational')
    expect(parsed.in).toBe('com.example/persons')
    expect(parsed.out).toBe('com.example/persons-rel-json')
    expect(parsed.kind).toBe('m2m')
    expect(Array.isArray(parsed.written)).toBe(true)
    expect(parsed.written.length).toBe(1)
    expect(existsSync(parsed.written[0])).toBe(true)
    const options = parsed.decisions.map((decision: { option: string }) => decision.option)
    expect(options).toContain('SnakeCase')
    expect(options).toContain('UseAutoIncrement')
  })
})

describe('tx run --config', () => {
  const cfgPath = () => join(modelsDir, 'com', 'example', 'tx-cfg.tsx')

  beforeAll(async () => {
    const init = await run(['config', 'init', 'eer-to-relational', '--for', 'com.example/persons', '--out', 'com.example/tx-cfg'])
    expect(init.error).toBeUndefined()
    await run(['model', 'import', personsFixture, '--as', 'com.example/persons-b'])
  })

  it('fails with NOT_FOUND for a missing configuration ref', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/no-such-cfg', '--out', 'com.example/never-cfg'
    ])
    expect(code).toBe(3)
    expect(stderr).toContain('Configuration model not found')
  })

  it('rejects a --config model that is not a configuration model (exit 2)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/persons', '--out', 'com.example/never-cfg'
    ])
    expect(code).toBe(2)
    expect(flatten(stderr)).toContain('not a configuration model')
  })

  it('rejects a configuration whose sourceModel does not match --in (exit 2, naming both)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons-b',
      '--config', 'com.example/tx-cfg', '--out', 'com.example/never-cfg'
    ])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`created for source model 'com.example/persons'`)
    expect(message).toContain(`transforms 'com.example/persons-b'`)
  })

  it('rejects a configuration selecting an unknown option (exit 2, naming it)', async () => {
    const edited = readFileSync(cfgPath(), 'utf-8').replaceAll('SnakeCase', 'NoSuchOption')
    const badPath = join(modelsDir, 'com', 'example', 'tx-cfg-bad.tsx')
    writeFileSync(badPath, edited)
    try {
      const { code, stderr } = await run([
        'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
        '--config', 'com.example/tx-cfg-bad', '--out', 'com.example/never-cfg'
      ])
      expect(code).toBe(2)
      expect(flatten(stderr)).toContain('NoSuchOption')
    } finally {
      rmSync(badPath, { force: true })
    }
  })

  it('rejects --save-config combined with --config', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/tx-cfg', '--save-config', 'com.example/never-save',
      '--out', 'com.example/never-cfg'
    ])
    expect(code).not.toBe(0)
    expect(flatten(stderr)).toContain('cannot also be provided')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-save.tsx'))).toBe(false)
  })

  it('runs with the explicit configuration and announces choices without the default suffix', async () => {
    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/tx-cfg', '--out', 'com.example/persons-rel-explicit', '--json'
    ])
    expect(error).toBeUndefined()
    const parsed = JSON.parse(stdout)
    expect(parsed.config).toBe('com.example/tx-cfg')
    const decisions = parsed.decisions as Array<{ option: string; isDefault: boolean }>
    expect(decisions.length).toBeGreaterThan(0)
    expect(decisions.every((decision) => decision.isDefault === false)).toBe(true)
    expect(decisions.map((decision) => decision.option)).toContain('SnakeCase')
  })
})

describe('tx run --save-config collision guards', () => {
  it('rejects a --save-config target equal to --in even with --overwrite', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/persons', '--overwrite', '--out', 'com.example/never-collide'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('--save-config target com.example/persons is the same ref as --in')
    // Failing fast: neither the input model nor the output may be touched
    expect(readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8')).toContain('EERSchema')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-collide.tsx'))).toBe(false)
  })

  it('detects the collision through ref normalization (slash namespace form)', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com/example/persons', '--overwrite', '--out', 'com.example/never-collide'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('same ref as --in')
  })

  it('rejects a --save-config target equal to the explicit --out ref', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/never-collide', '--out', 'com.example/never-collide'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('same ref as the --out target')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-collide.tsx'))).toBe(false)
  })

  it('rejects a --save-config target equal to the derived default --out ref', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--save-config', 'com.example/persons-eer-to-relational'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('default --out target')
  })

  it('rejects an --out target equal to --in even with --overwrite', async () => {
    const before = readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8')
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons', '--default-configs',
      '--out', 'com.example/persons', '--overwrite'
    ])
    expect(code).toBe(1)
    const message = flatten(stderr)
    expect(message).toContain('the --out target com.example/persons is the same ref as --in')
    expect(message).toContain('overwrite the input model')
    expect(readFileSync(join(modelsDir, 'com', 'example', 'persons.tsx'), 'utf-8')).toBe(before)
  })
})

describe('tx run --config with deleted choices (default materialization)', () => {
  // THE acceptance criterion of the default fallback: what tx run announces
  // as '(default)' must be what the engine actually applies. The engine's
  // Option() evaluation has no fallback of its own, so tx run has to add
  // the default choice to the configuration model it hands over.
  const matCfgPath = () => join(modelsDir, 'com', 'example', 'mat-cfg.tsx')

  /** Closing line of a serialized choice block (its attributes are one per line). */
  const BLOCK_END = '\n    />'

  /** Remove the whole ModelLevelChoice/ElementLevelChoice block containing `marker`. */
  const removeChoiceBlock = (text: string, marker: string): string => {
    const markerIdx = text.indexOf(marker)
    expect(markerIdx).toBeGreaterThan(-1)
    const open = text.lastIndexOf('\n    <', markerIdx)
    const close = text.indexOf(BLOCK_END, markerIdx) + BLOCK_END.length
    return text.slice(0, open) + text.slice(close)
  }

  beforeAll(async () => {
    const init = await run([
      'config', 'init', 'eer-to-relational', '--for', 'com.example/persons', '--out', 'com.example/mat-cfg'
    ])
    expect(init.error).toBeUndefined()
  })

  it('applies and announces the default when the global NamingConvention choice was deleted', async () => {
    const edited = removeChoiceBlock(readFileSync(matCfgPath(), 'utf-8'), 'gc_NamingConvention')
    writeFileSync(join(modelsDir, 'com', 'example', 'mat-cfg-no-nc.tsx'), edited)

    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/mat-cfg-no-nc', '--out', 'com.example/rel-mat-no-nc'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('decision NamingConvention -> SnakeCase (default)')
    // The default (SnakeCase) really steered the transformation
    const model = readFileSync(join(modelsDir, 'com', 'example', 'rel-mat-no-nc.tsx'), 'utf-8')
    expect(model).toContain('name="person_id"')
    expect(model).not.toContain('name="personId"')
  })

  it('applies and announces the per-element default when one element choice was deleted', async () => {
    // element choices carry scope-qualified names since entities became
    // name scopes (ec_<Entity>_<attribute>)
    const edited = removeChoiceBlock(readFileSync(matCfgPath(), 'utf-8'), 'ec_Person_personId')
    expect(edited).not.toContain('ec_Person_personId')
    writeFileSync(join(modelsDir, 'com', 'example', 'mat-cfg-no-pid.tsx'), edited)

    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/mat-cfg-no-pid', '--out', 'com.example/rel-mat-no-pid'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('decision for element personId: PrimaryKeyStrategy -> UseAutoIncrement (default)')
    // Without the materialized default the engine would have thrown (no
    // option condition true, no default VarOption); with it, personId's
    // primary key strategy is applied for real.
    const model = readFileSync(join(modelsDir, 'com', 'example', 'rel-mat-no-pid.tsx'), 'utf-8')
    expect(model).toContain('name="person_id" isKey={true} isAutoincrement={true}')
  })

  it('rejects duplicate choices for one issue, naming the issue and both options (exit 2)', async () => {
    const text = readFileSync(matCfgPath(), 'utf-8')
    const start = text.indexOf('    <ModelLevelChoice')
    const end = text.indexOf(BLOCK_END, start) + BLOCK_END.length
    const block = text.slice(start, end)
    const duplicate = block
      .replaceAll('gc_NamingConvention', 'gc_NamingConvention2')
      .replaceAll('SnakeCase', 'CamelCase')
    writeFileSync(join(modelsDir, 'com', 'example', 'mat-cfg-dup.tsx'), text.slice(0, end) + '\n' + duplicate + text.slice(end))

    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/mat-cfg-dup', '--out', 'com.example/never-dup'
    ])
    expect(code).toBe(2)
    const message = flatten(stderr)
    expect(message).toContain(`issue 'NamingConvention'`)
    expect(message).toContain('SnakeCase')
    expect(message).toContain('CamelCase')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-dup.tsx'))).toBe(false)
  })

  it('renders the configuration with its own header reference closure (helper models)', async () => {
    // A hand-edited configuration referencing a helper workspace model:
    // validate/show already load the header closure, so tx run must too.
    const helper = [
      '/** @jsx createExprNode */',
      '',
      "import { createExprNode } from '@aelastics/synthesis/jsx'",
      "import { DecisionModel, ModelLevelIssue, Option } from '@aelastics/synthesis/metamodels/decision'",
      '',
      'export const $synth = {',
      "  kind: 'decision-model',",
      "  metamodel: '',",
      "  description: 'Workspace copy of the naming issue, referenced by a hand-edited configuration'",
      '} as const',
      '',
      'export default (store) => (',
      '  <DecisionModel name="HelperIssues" description="Helper decision model" store={store}>',
      '    <ModelLevelIssue name="NamingConvention" description="Copy of the naming issue">',
      '      <Option name="SnakeCase" isDefault={true} />',
      '    </ModelLevelIssue>',
      '  </DecisionModel>',
      ')',
      ''
    ].join('\n')
    writeFileSync(join(modelsDir, 'com', 'example', 'helper-issues.tsx'), helper)

    // An option is referenced as <namespace>/<DecisionModel name>/<Option name>
    // (the issue is not part of the path); the namespace is www.aelastics.org.
    const originalChoice = 'selectedOption={<Option $refByName="//www.aelastics.org/RelationSchemaDesign/SnakeCase" />}'
    const helperChoice = 'selectedOption={<Option $refByName="//www.aelastics.org/HelperIssues/SnakeCase" />}'

    const original = readFileSync(matCfgPath(), 'utf-8')
    expect(original).toContain(originalChoice)

    const edited = original
      .replace(
        "references: {\n    sourceModel: 'com.example/persons'\n  },",
        "references: {\n    sourceModel: 'com.example/persons',\n    helperIssues: 'com.example/helper-issues'\n  },"
      )
      // the naming choice now selects the helper model's copy of the option
      .replace(originalChoice, helperChoice)
    expect(edited).toContain('helperIssues')
    expect(edited).toContain(helperChoice)
    expect(edited).not.toContain(originalChoice)
    writeFileSync(join(modelsDir, 'com', 'example', 'mat-cfg-helper.tsx'), edited)

    const validate = await run(['model', 'validate', 'com.example/mat-cfg-helper', '--tx', 'eer-to-relational'])
    expect(validate.error).toBeUndefined()

    const { stdout, error } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--config', 'com.example/mat-cfg-helper', '--out', 'com.example/rel-mat-helper'
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Wrote com.example/rel-mat-helper')
  })
})

describe('tx run m2t', () => {
  it('chains the generated relational model into SQL DDL generation', async () => {
    const genDir = join(tempDir, 'gen')
    const { stdout, error } = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons-rel', '--default-configs', '--out-dir', genDir
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('decision IdentifierQuoting -> Unquoted (default)')
    expect(stdout).toContain('Wrote ')

    const sqlFiles = readdirSync(genDir).filter((name) => name.endsWith('.sql'))
    expect(sqlFiles.length).toBe(1)
    const sql = readFileSync(join(genDir, sqlFiles[0]), 'utf-8')
    expect(sql).toContain('CREATE TABLE person')
    expect(sql).toContain('person_id INTEGER PRIMARY KEY')
    // FK REFERENCES targets go through the same naming convention as the
    // CREATE TABLE identifiers: snake_case 'organization', never the raw
    // entity name 'Organization'
    expect(sql).toContain('CREATE TABLE organization')
    expect(sql).toContain('REFERENCES organization')
    expect(sql).not.toContain('REFERENCES Organization')
  })

  it('honors an explicit DoubleQuoted configuration for the m2t step', async () => {
    // The m2t fixture is configuration-based too: config init against the
    // relational model, select DoubleQuoted, and the emitted DDL wraps
    // every identifier in double quotes.
    const init = await run([
      'config', 'init', 'rel-to-sql-ddl', '--for', 'com.example/persons-rel', '--out', 'com.example/ddl-cfg'
    ])
    expect(init.error).toBeUndefined()
    expect(init.stdout).toContain('decision IdentifierQuoting -> Unquoted (default)')

    const cfgPath = join(modelsDir, 'com', 'example', 'ddl-cfg.tsx')
    writeFileSync(cfgPath, readFileSync(cfgPath, 'utf-8').replaceAll('Unquoted', 'DoubleQuoted'))

    const genDir = join(tempDir, 'gen-quoted')
    const { stdout, error } = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons-rel',
      '--config', 'com.example/ddl-cfg', '--out-dir', genDir
    ])
    expect(error).toBeUndefined()
    expect(stdout).toContain('decision IdentifierQuoting -> DoubleQuoted')
    expect(stdout).not.toContain('DoubleQuoted (default)')
    const sqlFiles = readdirSync(genDir).filter((name) => name.endsWith('.sql'))
    const sql = readFileSync(join(genDir, sqlFiles[0]), 'utf-8')
    expect(sql).toContain('CREATE TABLE "person"')
    expect(sql).toContain('"person_id" INTEGER PRIMARY KEY')
    // The quoted REFERENCES target matches the quoted table name exactly
    expect(sql).toContain('CREATE TABLE "organization"')
    expect(sql).toContain('REFERENCES "organization"')
  })
})

describe('tx run --param', () => {
  it('rejects a parameter that is not valid JSON', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--default-configs', '--out', 'com.example/never-param',
      '--param', "'{worker: Judy}'"
    ])
    expect(code).not.toBe(0)
    expect(flatten(stderr)).toContain('--param is not valid JSON')
    expect(existsSync(join(modelsDir, 'com', 'example', 'never-param.tsx'))).toBe(false)
  })

  it('hands the parameter to the run and records it verbatim in the provenance', async () => {
    const paramJson = '{"worker":"Judy","sensitivity":2}'
    // the harness joins argv into a shell line, so the JSON needs quoting
    const { code } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--default-configs', '--out', 'com.example/persons-rel-param',
      '--trace', 'com.example/persons-param-trace',
      '--param', `'${paramJson}'`
    ])
    expect(code).toBe(0)
    // The fixture ignores the parameter (transform(root, param) simply
    // does not read it), which is exactly the compatibility contract;
    // the provenance must remember it anyway, on the output model AND
    // on the trace.
    const { stdout } = await run(['model', 'show', 'com.example/persons-rel-param', '--json'])
    const parsed = JSON.parse(stdout)
    expect(parsed.header.generatedBy.param).toBe(paramJson)
    const trace = readFileSync(join(modelsDir, 'com', 'example', 'persons-param-trace.tsx'), 'utf-8')
    expect(trace).toContain(`param: '{"worker":"Judy","sensitivity":2}'`)
  })
})

describe('tx run --trace', () => {
  it('persists the outcome trace and the effective configuration next to it', async () => {
    const { code, stdout } = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/persons',
      '--default-configs', '--out', 'com.example/persons-rel-traced',
      '--trace', 'com.example/persons-trace'
    ])
    expect(code).toBe(0)
    expect(stdout).toContain('Wrote com.example/persons-trace')
    expect(stdout).toContain('Wrote com.example/persons-trace-config')

    const tracePath = join(modelsDir, 'com', 'example', 'persons-trace.tsx')
    expect(existsSync(tracePath)).toBe(true)
    const trace = readFileSync(tracePath, 'utf-8')
    // The call tree: an @E2E rule is a RuleInvocation, the option methods it
    // runs are Invocations linked to their caller through `parent`.
    expect(trace).toContain('<TraceModel')
    expect(trace).toContain('<RuleInvocation name="Attribute2Column_personId"')
    expect(trace).toContain(
      '<Invocation name="useAutoIncrement_personId" function="useAutoIncrement" parent={<Invocation $refByName="Attribute2Column_personId" />}>'
    )
    // A nested consultation (primaryKeyStrategy fires inside the column
    // rule) is a Resolution on the invocation of the option it executed,
    // carrying the configuration choice for that element.
    expect(trace).toContain('<Resolution name="r3_UseAutoIncrement" byDefault={false}')
    expect(trace).toContain('ec_Person_personId_PrimaryKeyStrategy')
    // The trace names its run's models so its references can resolve.
    expect(trace).toContain("sourceModel: 'com.example/persons'")
    expect(trace).toContain("targetModel: 'com.example/persons-rel-traced'")
    expect(trace).toContain("configModel: 'com.example/persons-trace-config'")
    // The effective configuration is a real workspace model.
    expect(existsSync(join(modelsDir, 'com', 'example', 'persons-trace-config.tsx'))).toBe(true)
  })

  it('persists a trace for an m2t run, without a target model reference', async () => {
    const genDir = join(tempDir, 'gen-traced')
    const { code, stdout } = await run([
      'tx', 'run', 'rel-to-sql-ddl', '--in', 'com.example/persons-rel',
      '--default-configs', '--out-dir', genDir,
      '--trace', 'com.example/ddl-trace'
    ])
    expect(code).toBe(0)
    expect(stdout).toContain('Wrote com.example/ddl-trace')
    const trace = readFileSync(join(modelsDir, 'com', 'example', 'ddl-trace.tsx'), 'utf-8')
    expect(trace).toContain('<TraceModel')
    expect(trace).toContain("sourceModel: 'com.example/persons-rel'")
    expect(trace).not.toContain('targetModel:')
  })

  it('rejects --trace on a multi-step chain, teaching the stepwise path', async () => {
    const { code, stderr } = await run([
      'tx', 'run', 'eer-to-relational', 'rel-to-sql-ddl', '--in', 'com.example/persons',
      '--default-configs', '--out-dir', join(tempDir, 'never-traced'),
      '--trace', 'com.example/never-trace'
    ])
    expect(code).toBe(1)
    expect(flatten(stderr)).toContain('--trace is not supported for multi-step runs')
  })
})
