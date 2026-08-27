/**
 * Reading decisions out of rendered decision/configuration models: the
 * decision-model index (issues, options, defaults), the per-choice
 * announcements `tx run`/`config init`/`config show` print, and the
 * structural validation of an explicit configuration model against the
 * transformation's decision model and the input model.
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
  /** Option name -> the issue that owns it. */
  optionIssues: Map<string, IssueInfo>
}

/**
 * Index a rendered decision model: issues, their options, and defaults.
 * The rendered graph does not materialize the Option->Issue containment
 * (issue.options stays empty and option.ParentIssue is unset), but the
 * model's elements[] preserves document order: every Option follows the
 * Issue that declared it.
 */
export function indexDecisionModel(store: ModelStore, decisionModel: unknown): DecisionModelIndex {
  const issues = new Map<string, IssueInfo>()
  const optionIssues = new Map<string, IssueInfo>()
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
      optionIssues.set(name, currentIssue)
    }
  }
  return { issues, optionIssues }
}

interface RawChoice {
  name?: string
  selectedOption?: { name?: unknown; isDefault?: unknown } | null
}

interface RawDecision {
  name?: string
  element?: { name?: unknown; path?: unknown } | null
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

export interface ConfigStructureResult {
  /** Structural violations; non-empty means the config must be rejected. */
  errors: string[]
  /**
   * Effective decisions: every explicit choice (no '(default)' suffix),
   * then one default fallback per decision-model issue no choice covered.
   */
  announcements: DecisionAnnouncement[]
}

/**
 * Structural validation of an explicit configuration model, after it has
 * rendered into the run's store: every choice's selectedOption must be an
 * option of the transformation's decision model, every ElementDecision must
 * point at an element of the input model, and every issue no choice covers
 * falls back to its default option (which then must exist).
 */
export function validateConfigStructure(
  store: ModelStore,
  configModel: unknown,
  decisionModel: unknown,
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

  const errors: string[] = []
  const announcements: DecisionAnnouncement[] = []
  const coveredIssues = new Set<string>()

  for (const decision of decisionsOf(configModel)) {
    const decisionLabel = decision.name ?? '(unnamed decision)'
    let typeName = ''
    try {
      typeName = store.getTypeOf(decision as StoreElement).name
    } catch {
      // Untyped element: treat as a global decision
    }
    let elementName: string | undefined
    if (typeName === 'ElementDecision') {
      const element = decision.element
      if (element === null || element === undefined || typeof element.name !== 'string') {
        errors.push(`decision '${decisionLabel}' names no resolvable source-model element`)
      } else if (inputPath !== undefined && element.path !== inputPath) {
        errors.push(
          `decision '${decisionLabel}' targets element '${String(element.path)}/${element.name}', which is not part of the input model '${inputPath}'`
        )
      } else {
        elementName = element.name
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
      coveredIssues.add(issue.name)
      announcements.push({
        issue: issue.name,
        option,
        ...(elementName !== undefined ? { element: elementName } : {}),
        isDefault: false
      })
    }
  }

  // Issues the configuration leaves open fall back to their default option
  for (const issue of index.issues.values()) {
    if (coveredIssues.has(issue.name)) {
      continue
    }
    const fallback = issue.options.find((option) => option.isDefault) ?? issue.options[0]
    if (fallback === undefined) {
      errors.push(`issue '${issue.name}' is not covered by the configuration and has no default option to fall back to`)
      continue
    }
    announcements.push({ issue: issue.name, option: fallback.name, isDefault: true })
  }

  return { errors, announcements }
}
