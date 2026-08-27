/**
 * Reading decisions out of rendered decision/configuration models: the
 * decision-model index (issues, options, defaults), the per-choice
 * announcements `tx run`/`config init`/`config show` print, and the
 * structural validation of an explicit configuration model against the
 * transformation's decision model, binding model, and the input model.
 */

import type { ModelStore } from '@synthesis/engine'

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
 * The rendered graph does not materialize the Option->Issue containment
 * (issue.options stays empty and option.ParentIssue is unset), but the
 * model's elements[] preserves document order: every Option follows the
 * Issue that declared it. Ownership is therefore keyed by (issue, option)
 * with document order as the attribution mechanism — an option name used
 * by two issues is ambiguous and reported as a warning. Interim until the
 * engine materializes the containment link; then this reconstruction (and
 * the ambiguity) disappears.
 */
export function indexDecisionModel(store: ModelStore, decisionModel: unknown): DecisionModelIndex {
  const issues = new Map<string, IssueInfo>()
  const optionIssues = new Map<string, IssueInfo>()
  const warnings: string[] = []
  const elements = (decisionModel as { elements?: unknown[] } | undefined)?.elements ?? []
  let currentIssue: IssueInfo | undefined
  for (const element of elements) {
    const name = (element as { name?: unknown }).name
    if (typeof name !== 'string' || name === '') {
      continue
    }
    let typeName: string
    try {
      typeName = store.getTypeOf(element as StoreElement).name
    } catch {
      continue
    }
    if (typeName.endsWith('Issue')) {
      currentIssue = { name, element, typeName, options: [] }
      issues.set(name, currentIssue)
    } else if (typeName === 'Option' && currentIssue !== undefined) {
      const isDefault = (element as { isDefault?: unknown }).isDefault === true
      currentIssue.options.push({ name, element, isDefault })
      const previousOwner = optionIssues.get(name)
      if (previousOwner === undefined) {
        optionIssues.set(name, currentIssue)
      } else if (previousOwner !== currentIssue) {
        warnings.push(
          `decision model option name '${name}' is declared by both issue '${previousOwner.name}' and issue '${currentIssue.name}'; choices selecting it are attributed to '${previousOwner.name}' (document order)`
        )
      }
    }
  }
  return { issues, optionIssues, warnings }
}

interface RawChoice {
  name?: string
  selectedOption?: { name?: unknown; isDefault?: unknown } | null
}

interface RawDecision {
  name?: string
  element?: { name?: unknown; path?: unknown; id?: unknown } | null
  choices?: RawChoice[]
}

function decisionsOf(configModel: unknown): RawDecision[] {
  return ((configModel as { decisions?: unknown[] } | undefined)?.decisions ?? []) as RawDecision[]
}

/**
 * One announcement per Choice in the configuration model. Global Decisions
 * carry no element; ElementDecisions point at the source-model element the
 * choice applies to. The issue label comes from the decision model (the
 * choice's own issue reference stays unresolved in the rendered graph);
 * '(default)' marks options flagged as the issue's default.
 */
export function collectDecisions(
  store: ModelStore,
  configModel: unknown,
  decisionModel: unknown
): DecisionAnnouncement[] {
  const { optionIssues } = indexDecisionModel(store, decisionModel)
  const announcements: DecisionAnnouncement[] = []
  for (const decision of decisionsOf(configModel)) {
    for (const choice of decision.choices ?? []) {
      const option = choice.selectedOption?.name
      if (typeof option !== 'string') {
        continue
      }
      const elementName = decision.element?.name
      announcements.push({
        issue: optionIssues.get(option)?.name ?? decision.name ?? '(unknown issue)',
        option,
        ...(typeof elementName === 'string' && elementName !== '' ? { element: elementName } : {}),
        isDefault: choice.selectedOption?.isDefault === true
      })
    }
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
   * rendered configuration model before the transformation runs — the
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
 * model — exactly the element choices `SourceModelToDefaultConfigurationModel`
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
  decisionLabel: string
}

const formatCovers = (covers: Cover[]): string =>
  covers.map((cover) => `option '${cover.option}' in decision '${cover.decisionLabel}'`).join(', ')

/**
 * Structural validation of an explicit configuration model, after it has
 * rendered into the run's store: every choice's selectedOption must be an
 * option of the transformation's decision model, every ElementDecision must
 * point at an element of the input model (nested elements included — their
 * paths extend the model path), each (issue, element?) slot may be covered
 * at most once, and every slot no choice covers falls back to the issue's
 * default option — which the caller must then materialize (see
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

  for (const decision of decisionsOf(configModel)) {
    const decisionLabel = decision.name ?? '(unnamed decision)'
    let typeName = ''
    try {
      typeName = store.getTypeOf(decision as StoreElement).name
    } catch {
      // Untyped element: treat as a global decision
    }
    let element: unknown
    let elementName: string | undefined
    if (typeName === 'ElementDecision') {
      const target = decision.element
      if (target === null || target === undefined || typeof target.name !== 'string') {
        errors.push(`decision '${decisionLabel}' names no resolvable source-model element`)
      } else if (!isInsideInput(target.path)) {
        errors.push(
          `decision '${decisionLabel}' targets element '${String(target.path)}/${target.name}', which is not part of the input model '${inputPath}'`
        )
      } else {
        element = target
        elementName = target.name
      }
    }
    for (const choice of decision.choices ?? []) {
      const choiceLabel = choice.name ?? '(unnamed choice)'
      const option = choice.selectedOption?.name
      if (typeof option !== 'string' || option === '') {
        errors.push(`choice '${choiceLabel}' in decision '${decisionLabel}' has no resolvable selectedOption`)
        continue
      }
      const issue = index.optionIssues.get(option)
      if (issue === undefined) {
        errors.push(
          `choice '${choiceLabel}' in decision '${decisionLabel}' selects option '${option}', which is not an option of the transformation's decision model '${dmLabel}'`
        )
        continue
      }
      const cover: Cover = { option, decisionLabel }
      if (element !== undefined) {
        const byElement = elementCovers.get(issue.name) ?? new Map<string, { covers: Cover[]; label: string }>()
        elementCovers.set(issue.name, byElement)
        const key = elementKeyOf(element)
        const entry = byElement.get(key) ?? { covers: [], label: elementName as string }
        byElement.set(key, entry)
        entry.covers.push(cover)
      } else if (typeName !== 'ElementDecision') {
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
          `issue '${issueName}' is covered both globally (${formatCovers(global)}) and for element '${entry.label}' (${formatCovers(entry.covers)}); the engine cannot prioritize between them — remove one`
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
