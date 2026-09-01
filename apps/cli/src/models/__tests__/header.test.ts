import { parseSynthHeader, serializeSynthHeader, writeSynthHeader } from '../header.js'
import type { SynthHeader } from '../header.js'

const completeHeaderText = `export const $synth = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/eer',
  references: {},
  generatedBy: null,
  createdAt: '2026-08-27T10:00:00.000Z',
  modifiedAt: '2026-08-27T10:00:00.000Z',
  author: 'Sinisa Neskovic <sinisa@example.org>',
  version: '0.1.0',
  description: 'Persons EER schema',
  tags: ['hr', 'example'],
  license: 'Apache-2.0',
  custom: {}
} as const`

const completeHeader: SynthHeader = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/eer',
  references: {},
  generatedBy: null,
  createdAt: '2026-08-27T10:00:00.000Z',
  modifiedAt: '2026-08-27T10:00:00.000Z',
  author: 'Sinisa Neskovic <sinisa@example.org>',
  version: '0.1.0',
  description: 'Persons EER schema',
  tags: ['hr', 'example'],
  license: 'Apache-2.0',
  custom: {}
}

const sampleFile = `import { ModelStore } from '@aelastics/synthesis/engine'
import { Entity } from '@synthesis/standard-metamodels/eer'

${completeHeaderText}

export default (store: ModelStore) => (
  <Entity name='Person' />
)
`

describe('parseSynthHeader', () => {
  it('parses a complete header with all fields typed correctly', () => {
    const { header, error } = parseSynthHeader(sampleFile)
    expect(error).toBeUndefined()
    expect(header).toEqual(completeHeader)
  })

  it('returns header null without error when the file has no $synth export', () => {
    const result = parseSynthHeader(`import x from 'y'\n\nexport default 42\n`)
    expect(result.header).toBeNull()
    expect(result.error).toBeUndefined()
  })

  it('parses with and without as const', () => {
    const base = `export const $synth = { kind: 'model', metamodel: 'mm' }`
    const withAsConst = parseSynthHeader(`${base} as const\n`)
    const withoutAsConst = parseSynthHeader(`${base}\n`)
    expect(withAsConst.error).toBeUndefined()
    expect(withoutAsConst.error).toBeUndefined()
    expect(withAsConst.header?.kind).toBe('model')
    expect(withoutAsConst.header?.kind).toBe('model')
    expect(withAsConst.header).toEqual(withoutAsConst.header)
  })

  it('defaults all optional fields when only kind and metamodel are present', () => {
    const { header, error } = parseSynthHeader(`export const $synth = { kind: 'metamodel', metamodel: 'core' } as const`)
    expect(error).toBeUndefined()
    expect(header).toEqual({
      kind: 'metamodel',
      metamodel: 'core',
      references: {},
      generatedBy: null,
      createdAt: '',
      modifiedAt: '',
      author: '',
      version: '',
      description: '',
      tags: [],
      license: null,
      custom: {}
    })
  })

  it('rejects a function call value', () => {
    const { header, error } = parseSynthHeader(
      `export const $synth = { kind: 'model', metamodel: 'mm', author: getAuthor() }`
    )
    expect(header).toBeNull()
    expect(error).toMatch(/function calls are not supported/)
    expect(error).toContain('getAuthor')
  })

  it('rejects an identifier value', () => {
    const { header, error } = parseSynthHeader(
      `export const $synth = { kind: 'model', metamodel: 'mm', license: Apache }`
    )
    expect(header).toBeNull()
    expect(error).toMatch(/identifier 'Apache' is not a supported value/)
  })

  it('rejects a template literal value', () => {
    const { header, error } = parseSynthHeader(
      'export const $synth = { kind: \'model\', metamodel: `mm-${x}` }'
    )
    expect(header).toBeNull()
    expect(error).toMatch(/template literals are not supported/)
  })

  it('rejects spreads and computed keys', () => {
    const spread = parseSynthHeader(`export const $synth = { ...base, kind: 'model', metamodel: 'mm' }`)
    expect(spread.header).toBeNull()
    expect(spread.error).toMatch(/spread elements are not supported/)

    const computed = parseSynthHeader(`export const $synth = { [key]: 1, kind: 'model', metamodel: 'mm' }`)
    expect(computed.header).toBeNull()
    expect(computed.error).toMatch(/computed property keys are not supported/)
  })

  it('rejects a header missing kind or metamodel', () => {
    const noKind = parseSynthHeader(`export const $synth = { metamodel: 'mm' }`)
    expect(noKind.header).toBeNull()
    expect(noKind.error).toMatch(/missing required field 'kind'/)

    const noMetamodel = parseSynthHeader(`export const $synth = { kind: 'model' }`)
    expect(noMetamodel.header).toBeNull()
    expect(noMetamodel.error).toMatch(/missing required field 'metamodel'/)

    const badKind = parseSynthHeader(`export const $synth = { kind: 'sculpture', metamodel: 'mm' }`)
    expect(badKind.header).toBeNull()
    expect(badKind.error).toMatch(/invalid kind 'sculpture'/)
  })

  it('parses nested objects and arrays in custom, trailing commas, both quote styles', () => {
    const text = `export const $synth = {
  kind: "model",
  metamodel: "mm",
  tags: ['a', "b",],
  custom: {
    nested: { depth: 2, flags: [true, false, null,], ratio: -1.5e2, },
    "quoted key": 'value',
  },
} as const`
    const { header, error } = parseSynthHeader(text)
    expect(error).toBeUndefined()
    expect(header?.tags).toEqual(['a', 'b'])
    expect(header?.custom).toEqual({
      nested: { depth: 2, flags: [true, false, null], ratio: -150 },
      'quoted key': 'value'
    })
  })

  it('parses generatedBy provenance objects', () => {
    const text = `export const $synth = {
  kind: 'model',
  metamodel: 'mm',
  generatedBy: { tx: 'eer-to-relational', txVersion: '1.2.0', config: 'com.example/persons.cfg', date: '2026-08-27T10:00:00.000Z' }
}`
    const { header, error } = parseSynthHeader(text)
    expect(error).toBeUndefined()
    expect(header?.generatedBy).toEqual({
      tx: 'eer-to-relational',
      txVersion: '1.2.0',
      config: 'com.example/persons.cfg',
      date: '2026-08-27T10:00:00.000Z'
    })
  })

  it('handles strings containing braces and escaped quotes without breaking literal-end detection', () => {
    const text = `export const $synth = {
  kind: 'model',
  metamodel: 'mm',
  description: 'braces } { inside and a \\' quote',
  author: "she said \\"hi\\" and { more }",
  custom: { note: 'ends with }' }
} as const

const after = 'still here'`
    const { header, error } = parseSynthHeader(text)
    expect(error).toBeUndefined()
    expect(header?.description).toBe("braces } { inside and a ' quote")
    expect(header?.author).toBe('she said "hi" and { more }')
    expect(header?.custom).toEqual({ note: 'ends with }' })
  })

  it('decodes standard escape sequences', () => {
    const { header, error } = parseSynthHeader(
      `export const $synth = { kind: 'model', metamodel: 'mm', description: 'tab\\there\\nnewline \\u0041\\u{1F600}' }`
    )
    expect(error).toBeUndefined()
    expect(header?.description).toBe('tab\there\nnewline A\u{1F600}')
  })
})

describe('serializeSynthHeader', () => {
  it('produces the exact deterministic text', () => {
    expect(serializeSynthHeader(completeHeader)).toBe(completeHeaderText)
  })

  it('serializes nested references, generatedBy, tags and custom deterministically', () => {
    const header: SynthHeader = {
      kind: 'configuration-model',
      metamodel: '@aelastics/synthesis/decision-framework/configuration',
      references: { sourceModel: 'com.example/persons', bindingModel: 'eer-to-relational/binding' },
      generatedBy: { tx: 'eer-to-relational', txVersion: '1.2.0', date: '2026-08-27T10:00:00.000Z' },
      createdAt: '2026-08-27T10:00:00.000Z',
      modifiedAt: '2026-08-27T10:00:00.000Z',
      author: '',
      version: '0.1.0',
      description: "it's got a quote",
      tags: [],
      license: null,
      custom: { nested: { flag: true, count: 3 }, list: [1, 2] }
    }
    expect(serializeSynthHeader(header)).toBe(`export const $synth = {
  kind: 'configuration-model',
  metamodel: '@aelastics/synthesis/decision-framework/configuration',
  references: {
    sourceModel: 'com.example/persons',
    bindingModel: 'eer-to-relational/binding'
  },
  generatedBy: {
    tx: 'eer-to-relational',
    txVersion: '1.2.0',
    date: '2026-08-27T10:00:00.000Z'
  },
  createdAt: '2026-08-27T10:00:00.000Z',
  modifiedAt: '2026-08-27T10:00:00.000Z',
  author: '',
  version: '0.1.0',
  description: 'it\\'s got a quote',
  tags: [],
  license: null,
  custom: {
    nested: {
      flag: true,
      count: 3
    },
    list: [1, 2]
  }
} as const`)
  })
})

describe('writeSynthHeader', () => {
  const updatedHeader: SynthHeader = {
    ...completeHeader,
    modifiedAt: '2026-08-28T12:00:00.000Z',
    description: 'Updated description',
    tags: ['updated']
  }

  it('replaces an existing header leaving the rest of the file byte-identical', () => {
    const result = writeSynthHeader(sampleFile, updatedHeader)
    const [before, after] = sampleFile.split(completeHeaderText)
    expect(result).toBe(before + serializeSynthHeader(updatedHeader) + after)
    expect(parseSynthHeader(result).header).toEqual(updatedHeader)
  })

  it('replaces a header that has no as const and drops a trailing semicolon', () => {
    const file = `const x = 1\nexport const $synth = { kind: 'model', metamodel: 'mm' };\nconst y = 2\n`
    const result = writeSynthHeader(file, updatedHeader)
    expect(result).toBe(`const x = 1\n${serializeSynthHeader(updatedHeader)}\nconst y = 2\n`)
  })

  it('inserts after the last top-level import with one blank line before and after', () => {
    const file = `import { a } from 'pkg-a'
import {
  b,
  c
} from 'pkg-b'

export default () => a(b, c)
`
    const result = writeSynthHeader(file, completeHeader)
    expect(result).toBe(`import { a } from 'pkg-a'
import {
  b,
  c
} from 'pkg-b'

${completeHeaderText}

export default () => a(b, c)
`)
    expect(parseSynthHeader(result).header).toEqual(completeHeader)
  })

  it('inserts at the top of a file with no imports', () => {
    const file = `export default 42\n`
    const result = writeSynthHeader(file, completeHeader)
    expect(result).toBe(`${completeHeaderText}\n\nexport default 42\n`)
  })

  it('handles an empty file', () => {
    expect(writeSynthHeader('', completeHeader)).toBe(`${completeHeaderText}\n`)
  })

  it('round-trips: parse(write(x)) equals x', () => {
    const header: SynthHeader = {
      kind: 'decision-model',
      metamodel: '@aelastics/synthesis/decision-framework/decisions',
      references: { bindingModel: 'tx/binding' },
      generatedBy: { tx: 'gen-tx', date: '2026-08-27T00:00:00.000Z' },
      createdAt: '2026-08-27T00:00:00.000Z',
      modifiedAt: '2026-08-27T00:00:00.000Z',
      author: 'A <a@b.c>',
      version: '2.0.0',
      description: 'braces } and \'quotes\' survive',
      tags: ['x', 'y'],
      license: null,
      custom: { deep: { list: ['s', 1, false, null] } }
    }
    const written = writeSynthHeader(`import z from 'z'\n\nexport default null\n`, header)
    const { header: parsed, error } = parseSynthHeader(written)
    expect(error).toBeUndefined()
    expect(parsed).toEqual(header)
  })
})
