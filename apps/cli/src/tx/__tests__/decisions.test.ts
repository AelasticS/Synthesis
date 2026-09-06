import type { ModelStore } from '@aelastics/synthesis/store'

import { indexDecisionModel, validateConfigStructure } from '../decisions.js'

/**
 * The structural validation only consults the store for element type
 * names; a structural fake keeps these tests free of the engine's render
 * machinery. Elements carry their type name in `__type` (untyped elements
 * omit it, mirroring elements the real store does not know).
 */
const fakeStore = {
  getTypeOf(element: { __type?: string }) {
    if (element.__type === undefined) {
      throw new Error('untyped element')
    }
    return { name: element.__type }
  }
} as unknown as ModelStore

interface FakeElement {
  __type?: string
  id?: string
  name?: string
  path?: string
  isDefault?: boolean
  [key: string]: unknown
}

let nextId = 1
const el = (type: string, name: string, extra: Record<string, unknown> = {}): FakeElement => ({
  __type: type,
  id: String(nextId++),
  name,
  path: '//dm/DM',
  ...extra
})

// Decision model: elements[] in document order, each Issue followed by its
// Options (the rendered graph does not materialize the containment).
const namingIssue = el('ModelIssue', 'NamingConvention')
const camelCase = el('Option', 'CamelCase', { isDefault: false })
const snakeCase = el('Option', 'SnakeCase', { isDefault: true })
const pkIssue = el('ElementIssue', 'PrimaryKeyStrategy')
const autoInc = el('Option', 'UseAutoIncrement', { isDefault: true })
const manualInc = el('Option', 'UseManualIncrement', { isDefault: false })
const noDefaultIssue = el('ElementIssue', 'CollationStrategy')
const collationA = el('Option', 'CollationA', { isDefault: false })
const collationB = el('Option', 'CollationB', { isDefault: false })

const decisionModel = {
  name: 'RelationSchemaDesign',
  elements: [namingIssue, camelCase, snakeCase, pkIssue, autoInc, manualInc, noDefaultIssue, collationA, collationB]
}

// Input model: two flat attributes and one nested attribute (hierarchical
// path below the model path; the engine nests element paths by container).
const inputPath = '//www.aelastics.org/Input'
const attr = (name: string, path: string = inputPath): FakeElement =>
  ({ __type: 'Attribute', id: String(nextId++), name, path })
const personId = attr('personId')
const organizationId = attr('organizationId')
const nestedId = attr('nestedId', `${inputPath}/Sub`)
const inputRoot = {
  name: 'Input',
  path: '//www.aelastics.org',
  elements: [personId, organizationId, nestedId]
}

// Binding model: PrimaryKeyStrategy attaches to every Attribute.
const bindingModel = {
  bindings: [{ element: { name: 'Attribute' }, issues: [{ name: 'PrimaryKeyStrategy' }] }]
}

const globalDecision = (name: string, option: FakeElement): FakeElement =>
  el('Decision', name, { choices: [{ name: `${name}_choice`, selectedOption: option }] })

const elementDecision = (name: string, element: FakeElement, option: FakeElement): FakeElement =>
  el('ElementDecision', name, {
    element,
    choices: [{ name: `${name}_choice`, selectedOption: option }]
  })

const fullCoverage = () => [
  globalDecision('gc_naming', snakeCase),
  elementDecision('ec_personId', personId, autoInc),
  elementDecision('ec_organizationId', organizationId, autoInc),
  elementDecision('ec_nestedId', nestedId, autoInc)
]

const validate = (decisions: unknown[], binding: unknown = bindingModel) =>
  validateConfigStructure(fakeStore, { decisions }, decisionModel, binding, inputRoot)

describe('indexDecisionModel', () => {
  it('indexes issues with their options and defaults in document order', () => {
    const index = indexDecisionModel(fakeStore, decisionModel)
    expect([...index.issues.keys()]).toEqual(['NamingConvention', 'PrimaryKeyStrategy', 'CollationStrategy'])
    expect(index.issues.get('NamingConvention')?.options.map((option) => option.name)).toEqual([
      'CamelCase',
      'SnakeCase'
    ])
    expect(index.optionIssues.get('UseAutoIncrement')?.name).toBe('PrimaryKeyStrategy')
    expect(index.warnings).toEqual([])
  })

  it('warns when two issues declare an option with the same name', () => {
    const issueA = el('ModelIssue', 'IssueA')
    const issueB = el('ModelIssue', 'IssueB')
    const shared1 = el('Option', 'Shared', { isDefault: true })
    const shared2 = el('Option', 'Shared', { isDefault: true })
    const index = indexDecisionModel(fakeStore, { name: 'DM', elements: [issueA, shared1, issueB, shared2] })
    expect(index.warnings).toHaveLength(1)
    expect(index.warnings[0]).toContain(`'Shared'`)
    expect(index.warnings[0]).toContain(`'IssueA'`)
    expect(index.warnings[0]).toContain(`'IssueB'`)
    // Document-order attribution: the first declaring issue owns the name
    expect(index.optionIssues.get('Shared')?.name).toBe('IssueA')
  })

  it('uses the materialized containment when present and indexes composite sub-issues', () => {
    // The rendered graph puts a composite option's subtree BEFORE the
    // option itself (props render first), so document order would
    // attribute HistoryTable to its own sub-issue; containment must win.
    const rowHistory = el('ElementIssue', 'RowHistory')
    const noHistory = el('Option', 'NoHistory', { isDefault: true })
    const discriminator = el('ElementIssue', 'HistoryDiscriminator')
    const validFrom = el('Option', 'ValidFromTimestamp', { isDefault: true })
    const counter = el('Option', 'VersionCounter', { isDefault: false })
    discriminator.possibleOptions = [validFrom, counter]
    const historyTable = el('Option', 'HistoryTable', {
      isDefault: false,
      optionType: { subIssues: [discriminator] }
    })
    rowHistory.possibleOptions = [noHistory, historyTable]
    const model = {
      name: 'DM',
      issues: [rowHistory],
      elements: [rowHistory, noHistory, discriminator, validFrom, counter, historyTable]
    }
    const index = indexDecisionModel(fakeStore, model)
    expect([...index.issues.keys()]).toEqual(['RowHistory', 'HistoryDiscriminator'])
    expect(index.optionIssues.get('HistoryTable')?.name).toBe('RowHistory')
    expect(index.optionIssues.get('NoHistory')?.name).toBe('RowHistory')
    expect(index.optionIssues.get('ValidFromTimestamp')?.name).toBe('HistoryDiscriminator')
    expect(index.issues.get('HistoryDiscriminator')?.typeName).toBe('ElementIssue')
    expect(index.issues.get('HistoryDiscriminator')?.options.map((o) => o.name)).toEqual([
      'ValidFromTimestamp',
      'VersionCounter'
    ])
    expect(index.warnings).toEqual([])
  })
})

describe('validateConfigStructure coverage', () => {
  it('accepts a fully covering configuration without defaults', () => {
    const result = validate(fullCoverage())
    expect(result.errors).toEqual([])
    expect(result.uncoveredDefaults).toEqual([])
    expect(result.announcements.every((announcement) => !announcement.isDefault)).toBe(true)
  })

  it('falls back to the default option for an uncovered global issue', () => {
    const result = validate(fullCoverage().filter((decision) => decision.name !== 'gc_naming'))
    expect(result.errors).toEqual([])
    expect(result.announcements).toContainEqual({ issue: 'NamingConvention', option: 'SnakeCase', isDefault: true })
    expect(result.uncoveredDefaults).toHaveLength(1)
    expect(result.uncoveredDefaults[0].issue.name).toBe('NamingConvention')
    expect(result.uncoveredDefaults[0].option.name).toBe('SnakeCase')
    expect(result.uncoveredDefaults[0].element).toBeUndefined()
  })

  it('tracks element-issue coverage per element, not per issue', () => {
    // personId stays covered; organizationId and nestedId lose their choices
    const result = validate(
      fullCoverage().filter((decision) => decision.name !== 'ec_organizationId' && decision.name !== 'ec_nestedId')
    )
    expect(result.errors).toEqual([])
    const defaults = result.announcements.filter((announcement) => announcement.isDefault)
    expect(defaults).toContainEqual({
      issue: 'PrimaryKeyStrategy',
      option: 'UseAutoIncrement',
      element: 'organizationId',
      isDefault: true
    })
    expect(defaults).toContainEqual({
      issue: 'PrimaryKeyStrategy',
      option: 'UseAutoIncrement',
      element: 'nestedId',
      isDefault: true
    })
    expect(result.uncoveredDefaults.map((slot) => slot.element)).toEqual([organizationId, nestedId])
  })

  it('treats a global choice for an element issue as covering every element', () => {
    const result = validate([globalDecision('gc_naming', snakeCase), globalDecision('gc_pk', manualInc)])
    expect(result.errors).toEqual([])
    expect(result.uncoveredDefaults).toEqual([])
  })

  it('honours binding conditions when computing required element slots', () => {
    // The condition accepts only personId; the other attributes need no choice
    const conditional = {
      bindings: [
        {
          element: { name: 'Attribute' },
          issues: [{ name: 'PrimaryKeyStrategy' }],
          condition: 'return (e) => e.name === "personId"'
        }
      ]
    }
    const result = validate([globalDecision('gc_naming', snakeCase)], conditional)
    expect(result.errors).toEqual([])
    expect(result.uncoveredDefaults).toHaveLength(1)
    expect(result.uncoveredDefaults[0].element).toBe(personId)
  })

  it('errors on an uncovered slot whose issue marks no default option', () => {
    const binding = {
      bindings: [{ element: { name: 'Attribute' }, issues: [{ name: 'CollationStrategy' }] }]
    }
    const result = validate([globalDecision('gc_naming', snakeCase)], binding)
    const collationErrors = result.errors.filter((error) => error.includes('CollationStrategy'))
    expect(collationErrors).toHaveLength(3) // one per attribute
    expect(collationErrors[0]).toContain(`for element 'personId'`)
    expect(collationErrors[0]).toContain('no default option')
    expect(collationErrors[0]).toContain(`'CollationA'`)
    // No fabricated fallback: options[0] must never be announced as default
    expect(result.announcements.filter((a) => a.issue === 'CollationStrategy')).toEqual([])
    expect(result.uncoveredDefaults.filter((slot) => slot.issue.name === 'CollationStrategy')).toEqual([])
  })
})

describe('validateConfigStructure containment (nested elements)', () => {
  it('accepts an element decision targeting a nested element of the input model', () => {
    const result = validate(fullCoverage())
    expect(result.errors).toEqual([])
  })

  it('rejects an element decision targeting an element outside the input model', () => {
    const foreign = attr('foreignId', '//www.aelastics.org/Other')
    const result = validate([...fullCoverage(), elementDecision('ec_foreign', foreign, autoInc)])
    expect(result.errors.some((error) => error.includes('foreignId') && error.includes('not part of the input model'))).toBe(
      true
    )
  })

  it('rejects a path that merely shares the input path as a prefix string', () => {
    const sneaky = attr('sneakyId', '//www.aelastics.org/InputOther')
    const result = validate([...fullCoverage(), elementDecision('ec_sneaky', sneaky, autoInc)])
    expect(result.errors.some((error) => error.includes('sneakyId'))).toBe(true)
  })
})

describe('validateConfigStructure duplicate rejection', () => {
  it('rejects two global choices for the same issue, naming both options', () => {
    const result = validate([...fullCoverage(), globalDecision('gc_naming2', camelCase)])
    const conflict = result.errors.find((error) => error.includes(`issue 'NamingConvention'`))
    expect(conflict).toBeDefined()
    expect(conflict).toContain(`'SnakeCase'`)
    expect(conflict).toContain(`'CamelCase'`)
    expect(conflict).toContain(`'gc_naming'`)
    expect(conflict).toContain(`'gc_naming2'`)
  })

  it('rejects two element choices for the same (issue, element) slot', () => {
    const result = validate([...fullCoverage(), elementDecision('ec_personId2', personId, manualInc)])
    const conflict = result.errors.find(
      (error) => error.includes(`issue 'PrimaryKeyStrategy'`) && error.includes(`element 'personId'`)
    )
    expect(conflict).toBeDefined()
    expect(conflict).toContain(`'UseAutoIncrement'`)
    expect(conflict).toContain(`'UseManualIncrement'`)
  })

  it('rejects a global choice conflicting with an element choice for the same issue', () => {
    const result = validate([...fullCoverage(), globalDecision('gc_pk', manualInc)])
    const conflict = result.errors.find((error) => error.includes('covered both globally'))
    expect(conflict).toBeDefined()
    expect(conflict).toContain(`'PrimaryKeyStrategy'`)
  })

  it('still rejects a choice selecting an option unknown to the decision model', () => {
    const bogus = el('Option', 'NoSuchOption')
    const result = validate([...fullCoverage(), globalDecision('gc_bogus', bogus)])
    expect(result.errors.some((error) => error.includes(`'NoSuchOption'`))).toBe(true)
  })
})
