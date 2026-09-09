import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runCli } from '../../../test-utils/run-cli.js'

// Tests execute from lib/commands/model/__tests__; fixtures are referenced
// at their source location (they are not compiled by TypeScript).
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const txFixturesDir = join(packageRoot, 'src/tx/__tests__/fixtures')

// The taught authoring form: a type-only import of SynthHeaderInput from the
// library's envelope subpath and a header written as
// `as const satisfies SynthHeaderInput`.
const TYPED_MODEL = `/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { EERSchema, Entity, Attribute, Domain, Relationship, Role } from 'eer-metamodel'
import type * as t from 'eer-metamodel/model'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  author: 'Typed Author <typed@example.org>',
  version: '0.3.0',
  description: 'Typed-header gate test model',
  tags: ['typed', 'gate']
} as const satisfies SynthHeaderInput

export default (store: ModelStore): ExprNode<t.IEERSchema> => (
  <EERSchema name="TypedPersons" store={store}>
    <Domain name="number" />
    <Domain name="string" />
    <Entity name="Person">
      <Attribute name="personId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="personName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Entity name="Organization">
      <Attribute name="organizationId" isKey={true}>
        <Domain $refByName="number" />
      </Attribute>
      <Attribute name="organizationName" isKey={false}>
        <Domain $refByName="string" />
      </Attribute>
    </Entity>
    <Relationship name="worksIn">
      <Role name="WorksIn" lowerBound="0" upperBound="1" domain={<Entity $refByName="Organization"></Entity>} />
      <Role name="Employs" lowerBound="0" upperBound="M" domain={<Entity $refByName="Person"></Entity>} />
    </Relationship>
  </EERSchema>
)
`

// Isolated HOME so tests neither read nor mutate the developer's ~/.synth
// workspace; the workspace lives at <home>/.synth (init default path).
let testHome: string
let tempDir: string
let modelsDir: string

const run = (args: string[]) => runCli(args, { home: testHome })

beforeAll(async () => {
  testHome = mkdtempSync(join(tmpdir(), 'synth-typed-header-home-'))
  tempDir = mkdtempSync(join(tmpdir(), 'synth-typed-header-src-'))
  modelsDir = join(testHome, '.synth', 'models')
  await run(['init'])
  await run(['ns', 'mk', 'com.example'])
  await run(['tx', 'install', join(txFixturesDir, 'eer-to-relational')])
}, 60000)

afterAll(() => {
  rmSync(testHome, { recursive: true, force: true })
  rmSync(tempDir, { recursive: true, force: true })
})

describe('typed $synth header (as const satisfies SynthHeaderInput)', () => {
  const sourcePath = () => join(tempDir, 'typed-persons.tsx')
  const workspacePath = () => join(modelsDir, 'com', 'example', 'typed-persons.tsx')

  it('model import accepts the typed form and parses the header fields', async () => {
    writeFileSync(sourcePath(), TYPED_MODEL)
    const imported = await run(['model', 'import', sourcePath(), '--as', 'com.example/typed-persons'])
    expect(imported.error).toBeUndefined()
    expect(imported.stdout).toContain('Imported com.example/typed-persons')

    const { stdout, error } = await run(['model', 'show', 'com.example/typed-persons', '--json'])
    expect(error).toBeUndefined()
    const { header } = JSON.parse(stdout)
    expect(header.kind).toBe('model')
    expect(header.metamodel).toBe('eer-metamodel')
    expect(header.author).toBe('Typed Author <typed@example.org>')
    expect(header.version).toBe('0.3.0')
    expect(header.description).toBe('Typed-header gate test model')
    expect(header.tags).toEqual(['typed', 'gate'])
    expect(header.generatedBy).toBeNull()
    expect(header.references).toEqual({})
  })

  it('the workspace copy retains the type import and the satisfies clause after stamping', async () => {
    // Pinned behavior: stamping replaces the $synth literal up to and
    // including `as const` and leaves the rest of the file untouched, so
    // the workspace copy keeps both the `satisfies SynthHeaderInput`
    // clause and the type-only envelope import. Re-imports and re-stamps
    // keep the file in the typed form.
    const stamped = readFileSync(workspacePath(), 'utf-8')
    expect(stamped).toContain("import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'")
    expect(stamped).toMatch(/\} as const satisfies SynthHeaderInput/)
    // The stamp itself happened: tool-maintained fields were filled in.
    expect(stamped).toContain('createdAt:')
    expect(stamped).toContain('modifiedAt:')
  })

  it('the imported model works downstream: validate and an m2m run over it', async () => {
    const validated = await run(['model', 'validate', 'com.example/typed-persons'])
    expect(validated.error).toBeUndefined()
    expect(validated.stdout).toContain('Model com.example/typed-persons is valid')

    const ran = await run([
      'tx', 'run', 'eer-to-relational', '--in', 'com.example/typed-persons',
      '--default-configs', '--out', 'com.example/typed-persons-rel'
    ])
    expect(ran.error).toBeUndefined()
    expect(ran.stdout).toContain('Wrote com.example/typed-persons-rel')
  })
})
