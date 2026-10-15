/**
 * Reading decisions out of rendered decision/configuration models: the
 * decision-model index (issues, options, defaults), the per-choice
 * announcements `tx run`/`config init`/`config show` print, and the
 * structural validation of an explicit configuration model against the
 * transformation's decision model, binding model, and the input model.
 */

import type { ModelStore } from '@aelastics/synthesis/store'

type StoreElement = Parameters<ModelStore['getTypeOf']>[0]

export interface DecisionAnnouncement {
  issue: string
  option: string
  element?: string
  isDefault: boolean
}

export interface OptionInfo {
  name: string
  /** Rendered decision-model element (carries path/name for refs). */
  element: unknown
  isDefault: boolean
}

export interface IssueInfo {
  name: string
  /** Rendered decision-model element (carries path/name for refs). */
  element: unknown
  /** Metamodel type name: 'ModelIssue' or 'ElementIssue'. */
  typeName: string
  /** Options in document order. */
  options: OptionInfo[]
}

export interface DecisionModelIndex {
  /** Issue name -> info, in document order. */
  issues: Map<string, IssueInfo>
  /** Option name -> the issue that owns it (first declaring issue wins). */
  optionIssues: Map<string, IssueInfo>
  /** Defects of the decision model itself (duplicate option names). */
  warnings: string[]
}

/**
 * Index a rendered decision model: issues, their options, and defaults.
 * The containment the rendered graph materializes (decisionModel.issues,
 * issue.options, and an OpeningOption's subIssues) is the
 * attribution mechanism, and it is what makes opening options sound
 * here: an opening option's whole subtree renders BEFORE the option
 * itself (props render first), so document order would attribute the
 * option to its own sub-issue. Sub-issues are indexed like top-level
 * issues; an option name used by two issues is ambiguous and reported
 * as a warning. For a model whose containment did not materialize, the
 * old document-order walk over elements[] (every Option follows the
 * Issue that declared it) remains as the fallback.
 */
export function indexDecisionModel(store: ModelStore, decisionModel: unknown): DecisionModelIndex {
  const issues = new Map<string, IssueInfo>()
  const optionIssues = new Map<string, IssueInfo>()
  const warnings: string[] = []

  const typeNameOf = (element: unknown): string => {
    try {
      return store.getTypeOf(element as StoreElement).name
    } catch {
      return ''
    }
  }

  const claimOption = (issue: IssueInfo, name: string, element: unknown): void => {
    issue.options.push({ name, element, isDefault: (element as { isDefault?: unknown }).isDefault === true })
    const previousOwner = optionIssues.get(name)
    if (previousOwner === undefined) {
      optionIssues.set(name, issue)
    } else if (previousOwner !== issue) {
      warnings.push(
        `decision model option name '${name}' is declared by both issue '${previousOwner.name}' and issue '${issue.name}'; choices selecting it are attributed to '${previousOwner.name}'`
      )
    }
  }

  const registerIssue = (element: unknown): void => {
    const name = (element as { name?: unknown }).name
    if (typeof name !== 'string' || name === '') {
      return
    }
    // a sub-issue may also be listed among the model's top-level issues
    if (issues.has(name)) {
      return
    }
    const info: IssueInfo = { name, element, typeName: typeNameOf(element), options: [] }
    issues.set(name, info)
    const options = ((element as { options?: unknown[] }).options ?? [])
    for (const option of options) {
      const optionName = (option as { name?: unknown }).name
      if (typeof optionName !== 'string' || optionName === '') {
        continue
      }
      claimOption(info, optionName, option)
      // An opening option opens sub-issues; index them like any issue.
      const subIssues = ((option as { subIssues?: unknown[] }).subIssues ?? [])
      for (const sub of subIssues) {
        registerIssue(sub)
      }
    }
  }

  const topIssues = ((decisionModel as { issues?: unknown[] } | undefined)?.issues ?? [])
  if (topIssues.length > 0) {
    for (const issue of topIssues) {
      registerIssue(issue)
    }
    return { issues, optionIssues, warnings }
  }

  // Fallback: document-order reconstruction over elements[].
  const elements = (decisionModel as { elements?: unknown[] } | undefined)?.elements ?? []
  let currentIssue: IssueInfo | undefined
  for (const element of elements) {
    const name = (element as { name?: unknown }).name
    if (typeof name !== 'string' || name === '') {
      continue
    }
    const typeName = typeNameOf(element)
    if (typeName === '') {
      continue
    }
    if (typeName.endsWith('Issue')) {
      currentIssue = { name, element, typeName, options: [] }
      issues.set(name, currentIssue)
    } else if ((typeName === 'Option' || typeName === 'OpeningOption') && currentIssue !== undefined) {
      claimOption(currentIssue, name, element)
    }
  }
  return { issues, optionIssues, warnings }
}

interface RawChoice {
  name?: string
  /** Set on an ElementLevelChoice: the source-model element it applies to. */
  element?: { name?: unknown; path?: unknown; id?: unknown } | null
  selectedOption?: { name?: unknown; isDefault?: unknown; parentIssue?: { name?: unknown } | null } | null
}

function choicesOf(configModel: unknown): RawChoice[] {
  return ((configModel as { choices?: unknown[] } | undefined)?.choices ?? []) as RawChoice[]
}

/** True for an ElementLevelChoice (model-level choices carry no element). */
function isElementLevel(store: ModelStore, choice: RawChoice): boolean {
  try {
    return store.getTypeOf(choice as StoreElement).name === 'ElementLevelChoice'
  } catch {
    // Untyped element: decided by the element it points at
    return choice.element !== undefined && choice.element !== null
  }
}

/**
 * One announcement per choice in the configuration model. Model-level
 * choices carry no element; element-level choices point at the
 * source-model element the choice applies to. The issue label comes from
 * the decision model, falling back to the option's own parentIssue;
 * '(default)' marks options flagged as the issue's default.
 */
export function collectDecisions(
  store: ModelStore,
  configModel: unknown,
  decisionModel: unknown
): DecisionAnnouncement[] {
  const { optionIssues } = indexDecisionModel(store, decisionModel)
  const announcements: DecisionAnnouncement[] = []
  for (const choice of choicesOf(configModel)) {
    const option = choice.selectedOption?.name
    if (typeof option !== 'string') {
      continue
    }
    const parentIssue = choice.selectedOption?.parentIssue?.name
    const elementName = choice.element?.name
    announcements.push({
      issue: optionIssues.get(option)?.name ?? (typeof parentIssue === 'string' ? parentIssue : '(unknown issue)'),
      option,
      ...(typeof elementName === 'string' && elementName !== '' ? { element: elementName } : {}),
      isDefault: choice.selectedOption?.isDefault === true
    })
  }
  return announcements
}

export function formatDecisionAnnouncement(announcement: DecisionAnnouncement): string {
  const suffix = announcement.isDefault ? ' (default)' : ''
  return announcement.element === undefined
    ? `decision ${announcement.issue} -> ${announcement.option}${suffix}`
    : `decision for element ${announcement.element}: ${announcement.issue} -> ${announcement.option}${suffix}`
}

/** An uncovered (issue, element?) slot with the default option to apply. */
export interface UncoveredDefaultSlot {
  issue: IssueInfo
  option: OptionInfo
  /** Input-model element instance for element-scoped slots. */
  element?: unknown
}

export interface ConfigStructureResult {
  /** Structural violations; non-empty means the config must be rejected. */
  errors: string[]
  /**
   * Effective decisions: every explicit choice (no '(default)' suffix),
   * then one default fallback per (issue, element?) slot no choice covered.
   */
  announcements: DecisionAnnouncement[]
  /** Decision-model defects worth surfacing (duplicate option names). */
  warnings: string[]
  /**
   * Uncovered slots whose default choices must be materialized into the
   * rendered configuration model before the transformation runs: the
   * engine's Option() evaluation has no fallback of its own, so an
   * announced default that is not present as a real Choice would silently
   * apply nothing.
   */
  uncoveredDefaults: UncoveredDefaultSlot[]
}

interface NamedInputElement {
  id?: unknown
  name?: unknown
  path?: unknown
}

/** Stable identity for an input-model element (the engine matches by id). */
function elementKeyOf(element: unknown): string {
  const named = element as NamedInputElement
  if (named.id !== undefined && named.id !== null) {
    return `id:${String(named.id)}`
  }
  return `name:${String(named.path)}/${String(named.name)}`
}

function elementLabelOf(element: unknown): string {
  const name = (element as NamedInputElement).name
  return typeof name === 'string' ? name : '(unnamed element)'
}

interface ElementSlot {
  issue: IssueInfo
  element: unknown
}

interface RawBinding {
  element?: { name?: unknown } | null
  issues?: Array<{ name?: unknown } | null>
  condition?: unknown
}

/**
 * The (issue, element) slots the binding model attaches to this input
 * model, exactly the element choices `SourceModelToDefaultConfigurationModel`
 * would generate: a binding matches an element when the element's type name
 * equals the binding's declared element name and the optional condition
 * accepts it (`new Function(condition)()` yields the predicate; a
 * non-function result passes, mirroring the generator).
 */
function computeElementSlots(
  store: ModelStore,
  index: DecisionModelIndex,
  bindingModel: unknown,
  inputRoot: unknown
): ElementSlot[] {
  const bindings = ((bindingModel as { bindings?: unknown[] } | undefined)?.bindings ?? []) as RawBinding[]
  const elements = (inputRoot as { elements?: unknown[] } | undefined)?.elements ?? []
  const slots: ElementSlot[] = []
  const seen = new Set<string>()
  for (const element of elements) {
    let typeName: string
    try {
      typeName = store.getTypeOf(element as StoreElement).name
    } catch {
      continue
    }
    for (const binding of bindings) {
      if (binding.element?.name !== typeName) {
        continue
      }
      if (typeof binding.condition === 'string') {
        let predicate: unknown
        try {
          predicate = new Function(binding.condition)()
        } catch {
          // A condition the generator could not evaluate either: treat the
          // binding as unconditional so the slot still demands coverage.
          predicate = undefined
        }
        if (typeof predicate === 'function' && !(predicate as (e: unknown) => unknown)(element)) {
          continue
        }
      }
      for (const rawIssue of binding.issues ?? []) {
        const issueName = rawIssue?.name
        const issue = typeof issueName === 'string' ? index.issues.get(issueName) : undefined
        if (issue === undefined || issue.typeName !== 'ElementIssue') {
          continue
        }
        const key = `${issue.name} ${elementKeyOf(element)}`
        if (!seen.has(key)) {
          seen.add(key)
          slots.push({ issue, element })
        }
      }
    }
  }
  return slots
}

interface Cover {
  option: string
  choiceLabel: string
}

const formatCovers = (covers: Cover[]): string =>
  covers.map((cover) => `option '${cover.option}' in choice '${cover.choiceLabel}'`).join(', ')

/**
 * Structural validation of an explicit configuration model, after it has
 * rendered into the run's store: every choice's selectedOption must be an
 * option of the transformation's decision model, every element-level choice must
 * point at an element of the input model (nested elements included; their
 * paths extend the model path), each (issue, element?) slot may be covered
 * at most once, and every slot no choice covers falls back to the issue's
 * default option, which the caller must then materialize (see
 * `uncoveredDefaults`). An uncovered slot without a default option is an
 * error: the engine would have nothing to apply.
 */
export function validateConfigStructure(
  store: ModelStore,
  configModel: unknown,
  decisionModel: unknown,
  bindingModel: unknown,
  inputRoot: unknown
): ConfigStructureResult {
  const index = indexDecisionModel(store, decisionModel)
  const decisionModelName = (decisionModel as { name?: unknown } | undefined)?.name
  const dmLabel = typeof decisionModelName === 'string' ? decisionModelName : '(decision model)'
  const input = inputRoot as { name?: unknown; path?: unknown }
  const inputPath =
    typeof input?.path === 'string' && typeof input?.name === 'string'
      ? `${input.path}/${input.name}`
      : undefined
  // Nested elements carry hierarchical paths (<modelPath>/<container>/...):
  // containment accepts the model path itself and everything below it.
  const isInsideInput = (path: unknown): boolean =>
    inputPath === undefined ||
    path === inputPath ||
    (typeof path === 'string' && path.startsWith(`${inputPath}/`))

  const errors: string[] = []
  const announcements: DecisionAnnouncement[] = []
  const uncoveredDefaults: UncoveredDefaultSlot[] = []
  /** Issue name -> covers from global (model-wide) decisions. */
  const globalCovers = new Map<string, Cover[]>()
  /** Issue name -> element key -> { covers, label }. */
  const elementCovers = new Map<string, Map<string, { covers: Cover[]; label: string }>>()

  for (const choice of choicesOf(configModel)) {
    const choiceLabel = choice.name ?? '(unnamed choice)'
    const elementLevel = isElementLevel(store, choice)
    let element: unknown
    let elementName: string | undefined
    if (elementLevel) {
      const target = choice.element
      if (target === null || target === undefined || typeof target.name !== 'string') {
        errors.push(`choice '${choiceLabel}' names no resolvable source-model element`)
        continue
      } else if (!isInsideInput(target.path)) {
        errors.push(
          `choice '${choiceLabel}' targets element '${String(target.path)}/${target.name}', which is not part of the input model '${inputPath}'`
        )
        continue
      }
      element = target
      elementName = target.name
    }
    const option = choice.selectedOption?.name
    if (typeof option !== 'string' || option === '') {
      errors.push(`choice '${choiceLabel}' has no resolvable selectedOption`)
      continue
    }
    const issue = index.optionIssues.get(option)
    if (issue === undefined) {
      errors.push(
        `choice '${choiceLabel}' selects option '${option}', which is not an option of the transformation's decision model '${dmLabel}'`
      )
      continue
    }
    const cover: Cover = { option, choiceLabel }
    if (element !== undefined) {
      const byElement = elementCovers.get(issue.name) ?? new Map<string, { covers: Cover[]; label: string }>()
      elementCovers.set(issue.name, byElement)
      const key = elementKeyOf(element)
      const entry = byElement.get(key) ?? { covers: [], label: elementName as string }
      byElement.set(key, entry)
      entry.covers.push(cover)
    } else {
      const covers = globalCovers.get(issue.name) ?? []
      globalCovers.set(issue.name, covers)
      covers.push(cover)
    }
    announcements.push({
      issue: issue.name,
      option,
      ...(elementName !== undefined ? { element: elementName } : {}),
      isDefault: false
    })
  }

  // A slot covered twice is nondeterministic in the engine (the first
  // matching option method wins, in registration order): reject.
  for (const [issueName, covers] of globalCovers) {
    if (covers.length > 1) {
      errors.push(
        `issue '${issueName}' has ${covers.length} conflicting choices (${formatCovers(covers)}); keep exactly one`
      )
    }
  }
  for (const [issueName, byElement] of elementCovers) {
    for (const entry of byElement.values()) {
      if (entry.covers.length > 1) {
        errors.push(
          `issue '${issueName}' for element '${entry.label}' has ${entry.covers.length} conflicting choices (${formatCovers(entry.covers)}); keep exactly one`
        )
      }
    }
    const global = globalCovers.get(issueName)
    if (global !== undefined && global.length > 0) {
      for (const entry of byElement.values()) {
        errors.push(
          `issue '${issueName}' is covered both globally (${formatCovers(global)}) and for element '${entry.label}' (${formatCovers(entry.covers)}); the engine cannot prioritize between them: remove one`
        )
      }
    }
  }

  // Every slot the transformation consults must resolve to a real choice.
  // Uncovered slots fall back to the issue's default option; the caller
  // materializes those into the configuration model. No default -> error.
  const fallBack = (issue: IssueInfo, element?: unknown): void => {
    const fallback = issue.options.find((option) => option.isDefault)
    if (fallback === undefined) {
      const scope = element === undefined ? '' : ` for element '${elementLabelOf(element)}'`
      const available = issue.options.map((option) => `'${option.name}'`).join(', ')
      errors.push(
        `issue '${issue.name}'${scope} is not covered by the configuration and its decision model marks no default option; add a choice selecting one of: ${available === '' ? '(no options declared)' : available}`
      )
      return
    }
    announcements.push({
      issue: issue.name,
      option: fallback.name,
      ...(element === undefined ? {} : { element: elementLabelOf(element) }),
      isDefault: true
    })
    uncoveredDefaults.push({ issue, option: fallback, ...(element === undefined ? {} : { element }) })
  }

  for (const issue of index.issues.values()) {
    // Element-scoped issues are covered per element (below); everything
    // else takes one model-wide choice.
    if (issue.typeName === 'ElementIssue') {
      continue
    }
    if (!globalCovers.has(issue.name)) {
      fallBack(issue)
    }
  }
  for (const slot of computeElementSlots(store, index, bindingModel, inputRoot)) {
    // A global choice for the issue applies to every element (the engine's
    // choice resolution never filters global decisions), so it covers the
    // element slot too.
    if (globalCovers.has(slot.issue.name)) {
      continue
    }
    if (elementCovers.get(slot.issue.name)?.has(elementKeyOf(slot.element)) === true) {
      continue
    }
    fallBack(slot.issue, slot.element)
  }

  return { errors, announcements, warnings: index.warnings, uncoveredDefaults }
}
