/**
 * Configuration-model resolution, generation, and persistence.
 *
 * The engine's serializations do not round-trip a configuration model: the
 * transformation-kept JSX prints object props as bare identifiers
 * (`selectedOption={SnakeCase}`) and `exportToJSX` inlines the whole
 * decision/source graphs. So the CLI serializes the rendered configuration
 * model itself, emitting the same `$refByName` reference style a
 * hand-written configuration uses: every issue/option/element/binding is
 * a reference into the transformation's parts or the source model, which
 * is exactly why such a file only renders with the tx context loaded.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { ModelStore } from '@aelastics/synthesis/store'
import { Context } from '@aelastics/synthesis/jsx'
import { SourceModelToDefaultConfigurationModel } from '@aelastics/synthesis/variability'
import {
  Choice as ChoiceTemplate,
  ElementChoice as ElementChoiceTemplate,
  GlobalChoice as GlobalChoiceTemplate
} from '@aelastics/synthesis/metamodels/configuration'

import { parseSynthHeader, serializeSynthHeader } from '../models/header.js'
import type { SynthHeader } from '../models/header.js'
import { writeGatedModelFile } from '../models/loader.js'
import { makeGeneratedHeader } from '../models/stamp.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { normalizeRef, refToModelPath } from '../support/refs.js'
import { collectDecisions, formatDecisionAnnouncement, indexDecisionModel } from './decisions.js'
import type { DecisionAnnouncement, UncoveredDefaultSlot } from './decisions.js'
import type { EngineOutputBuffer } from './engine-output.js'
import { renderModelWithTxContext } from './load.js'
import type { TxParts } from './load.js'
import type { TxManifest } from './manifest.js'
import { importTxModule, moduleExport } from './modules.js'
import { buildModelModuleSource, uniqueJsxTags } from './output.js'

type StoreElement = Parameters<ModelStore['getTypeOf']>[0]

/** Metamodel specifier stamped into every configuration model's header. */
export const CONFIGURATION_METAMODEL = '@aelastics/synthesis/metamodels/configuration/model'

const CONFIG_COMPONENTS = '@aelastics/synthesis/metamodels/configuration'
const DECISION_COMPONENTS = '@aelastics/synthesis/metamodels/decision'
const BINDING_COMPONENTS = '@aelastics/synthesis/metamodels/binding'
const JSX_MODULE = '@aelastics/synthesis/jsx'

/** Which module exports each tag the serializer may emit. */
const TAG_MODULES: Record<string, string> = {
  ConfigurationModel: CONFIG_COMPONENTS,
  GlobalChoice: CONFIG_COMPONENTS,
  ElementChoice: CONFIG_COMPONENTS,
  Choice: CONFIG_COMPONENTS,
  GlobalIssue: DECISION_COMPONENTS,
  ElementIssue: DECISION_COMPONENTS,
  Option: DECISION_COMPONENTS,
  BindingModel: BINDING_COMPONENTS,
  Model: JSX_MODULE,
  Element: JSX_MODULE
}

// The generator is typed against @aelastics/synthesis/metamodel, whose
// types the CLI does not consume; the manifest-driven call site is untyped anyway.
const DefaultConfigGenerator = SourceModelToDefaultConfigurationModel as unknown as new (
  store: ModelStore,
  extra: { bindingModel: unknown }
) => { transform(input: unknown): unknown }

/** Why resolving a configuration-model ref failed. */
export type ConfigModelResolveErrorKind = 'invalid-ref' | 'missing' | 'malformed-header' | 'wrong-kind'

/**
 * Typed failure of `resolveConfigurationModel`; `exit` is the CLI exit
 * code the failure maps to: one contract for every command that takes a
 * configuration-model ref.
 */
export class ConfigModelResolveError extends Error {
  public constructor(
    public readonly kind: ConfigModelResolveErrorKind,
    public readonly exit: number,
    message: string
  ) {
    super(message)
  }
}

export interface ResolvedConfigModel {
  ref: string
  path: string
  header: SynthHeader
}

/**
 * Resolve a configuration-model ref nominally: normalize the ref, find the
 * file, parse the `$synth` header (parse errors are surfaced, never
 * swallowed), and require kind 'configuration-model'. Shared by
 * `config show`/`rm`/`edit` and `transformation run --config` so their checks and exit
 * codes cannot drift: missing -> NOT_FOUND, malformed header or wrong
 * kind -> VALIDATION_FAILURE.
 */
export async function resolveConfigurationModel(
  modelsDir: string,
  rawRef: string
): Promise<ResolvedConfigModel> {
  let ref: string
  try {
    ref = normalizeRef(rawRef)
  } catch (err) {
    throw new ConfigModelResolveError('invalid-ref', EXIT_CODES.FAILURE, errorMessage(err))
  }
  const path = refToModelPath(modelsDir, ref)
  if (!existsSync(path)) {
    throw new ConfigModelResolveError(
      'missing',
      EXIT_CODES.NOT_FOUND,
      `Configuration model not found: ${ref} (looked for ${path})`
    )
  }
  const parsed = parseSynthHeader(await readFile(path, 'utf-8'))
  if (parsed.error !== undefined) {
    throw new ConfigModelResolveError(
      'malformed-header',
      EXIT_CODES.VALIDATION_FAILURE,
      `Configuration model ${ref} has a malformed $synth header: ${parsed.error}`
    )
  }
  const header = parsed.header
  if (header === null || header.kind !== 'configuration-model') {
    throw new ConfigModelResolveError(
      'wrong-kind',
      EXIT_CODES.VALIDATION_FAILURE,
      `${ref} is not a configuration model: its $synth header ${header === null ? 'is missing' : `declares kind '${header.kind}'`} (expected kind 'configuration-model').`
    )
  }
  return { ref, path, header }
}

export interface WritableTarget {
  ref: string
  path: string
}

/**
 * Resolve a ref a command is about to write: normalize it and enforce the
 * exists/--overwrite gate. Shared by `transformation run --out`, `transformation run --save-config`,
 * and `config init --out`.
 */
export function resolveWritableRef(
  modelsDir: string,
  rawRef: string,
  overwrite: boolean,
  label: string
): WritableTarget {
  const ref = normalizeRef(rawRef)
  const path = refToModelPath(modelsDir, ref)
  if (existsSync(path) && !overwrite) {
    throw new Error(`${label} already exists: ${ref}. Use --overwrite to replace it.`)
  }
  return { ref, path }
}

/**
 * Run `SourceModelToDefaultConfigurationModel` over the input model: one
 * default choice per issue the binding model attaches, global and
 * per-element. The result lives in the same store as the input and parts.
 */
export function generateDefaultConfigModel(
  store: ModelStore,
  inputRoot: unknown,
  bindingModel: unknown
): unknown {
  const generator = new DefaultConfigGenerator(store, { bindingModel })
  return generator.transform(inputRoot)
}

/**
 * Materialize default choices for uncovered (issue, element?) slots into a
 * rendered configuration model, exactly as the default generator would
 * have created them: a GlobalChoice/ElementChoice decision holding one
 * Choice whose selectedOption is the issue's default option. Without this
 * the engine would apply nothing for those slots (its Option() evaluation
 * has no default fallback) while the CLI announces '(default)'.
 */
export function materializeDefaultChoices(
  store: ModelStore,
  configModel: unknown,
  slots: UncoveredDefaultSlot[]
): void {
  if (slots.length === 0) {
    return
  }
  const root = configModel as { name?: unknown; path?: unknown; decisions?: unknown[] }
  if (typeof root.name !== 'string' || typeof root.path !== 'string') {
    throw new Error('cannot materialize default choices: the configuration model root has no name/path')
  }
  const modelPath = `${root.path}/${root.name}`
  // The store enforces unique qualified names; suffix until free so a
  // user-kept decision with the base name never collides.
  const uniqueName = (base: string): string => {
    let name = base
    let counter = 2
    while (store.getByName(`${modelPath}/${name}`) !== undefined) {
      name = `${base}_${counter++}`
    }
    return name
  }
  const context = new Context()
  context.pushStore(store as unknown as Parameters<Context['pushStore']>[0])
  context.pushModel(configModel as Parameters<Context['pushModel']>[0])
  try {
    for (const slot of slots) {
      const choiceNode = ChoiceTemplate({
        name: uniqueName(`default_${slot.issue.name}_${slot.option.name}`),
        description: `Default choice for issue ${slot.issue.name}`,
        issue: slot.issue.element,
        selectedOption: slot.option.element
      } as unknown as Parameters<typeof ChoiceTemplate>[0])
      const decisionNode =
        slot.element === undefined
          ? GlobalChoiceTemplate({
              name: uniqueName(`default_gc_${slot.issue.name}`),
              choices: [choiceNode]
            } as unknown as Parameters<typeof GlobalChoiceTemplate>[0])
          : ElementChoiceTemplate({
              name: uniqueName(`default_ec_${String((slot.element as { name?: unknown }).name ?? 'element')}_${slot.issue.name}`),
              element: slot.element,
              choices: [choiceNode]
            } as unknown as Parameters<typeof ElementChoiceTemplate>[0])
      const rendered = decisionNode.render(context)
      // A standalone render creates the decision inside the model but does
      // not connect it to the parent's `decisions` collection (that wiring
      // is the ConfigurationModel tag's connectionInfo); connect here.
      const decisions = root.decisions
      if (Array.isArray(decisions) && !decisions.includes(rendered)) {
        decisions.push(rendered)
      }
    }
  } finally {
    context.popModel()
    context.popStore()
  }
}

interface NamedElement {
  name?: unknown
  path?: unknown
}

// $refByName targets and JSX attribute values are double-quoted; rendered
// element names/paths must not be able to break out of the literal.
function attrValue(value: string, what: string): string {
  if (/["\\\n\r]/.test(value)) {
    throw new Error(`cannot serialize ${what}: '${value}' contains quote or control characters`)
  }
  return `"${value}"`
}

function refByName(element: unknown, what: string): string {
  const named = element as NamedElement | null | undefined
  if (named === null || named === undefined || typeof named.name !== 'string' || typeof named.path !== 'string') {
    throw new Error(`cannot serialize ${what}: the reference did not resolve to a named element`)
  }
  return `${named.path}/${named.name}`
}

/**
 * Serialize a rendered configuration model to the editable `$refByName`
 * JSX form. Choice names are re-derived as `<decision>_<option>` so the
 * persisted file is stable across runs (the generator appends random
 * suffixes). The decision model provides each option's owning issue; the
 * choice's own issue reference stays unresolved in the rendered graph.
 */
export function serializeConfigModel(
  store: ModelStore,
  configModel: unknown,
  decisionModel: unknown
): string {
  const index = indexDecisionModel(store, decisionModel)
  const root = configModel as {
    name?: unknown
    sourceModel?: unknown
    bindingModel?: unknown
    decisions?: unknown[]
  }
  if (typeof root.name !== 'string' || root.name === '') {
    throw new Error('cannot serialize configuration model: the root has no name')
  }

  const lines: string[] = []
  lines.push('<ConfigurationModel')
  lines.push(`  name=${attrValue(root.name, 'configuration model name')}`)
  lines.push(`  sourceModel={<Model $refByName=${attrValue(refByName(root.sourceModel, 'sourceModel'), 'sourceModel reference')} />}`)
  lines.push(`  bindingModel={<BindingModel $refByName=${attrValue(refByName(root.bindingModel, 'bindingModel'), 'bindingModel reference')} />}`)
  lines.push('  store={store}')
  lines.push('>')

  for (const rawDecision of root.decisions ?? []) {
    const decision = rawDecision as {
      name?: unknown
      element?: unknown
      choices?: Array<{ selectedOption?: unknown }>
    }
    const decisionName = typeof decision.name === 'string' && decision.name !== '' ? decision.name : undefined
    if (decisionName === undefined) {
      throw new Error('cannot serialize configuration model: a decision has no name')
    }
    let typeName = ''
    try {
      typeName = store.getTypeOf(rawDecision as StoreElement).name
    } catch {
      // Untyped decisions serialize as global choices
    }
    const isElementDecision = typeName === 'ElementDecision'
    lines.push(`  <${isElementDecision ? 'ElementChoice' : 'GlobalChoice'}`)
    lines.push(`    name=${attrValue(decisionName, `decision name`)}`)
    if (isElementDecision) {
      const target = refByName(decision.element, `element of decision '${decisionName}'`)
      lines.push(`    element={<Element $refByName=${attrValue(target, 'element reference')} />}`)
    }
    lines.push('    choices={[')
    for (const choice of decision.choices ?? []) {
      const option = choice.selectedOption as NamedElement | null | undefined
      const optionName = typeof option?.name === 'string' ? option.name : undefined
      if (optionName === undefined) {
        throw new Error(`cannot serialize configuration model: a choice in decision '${decisionName}' has no resolved selectedOption`)
      }
      const issue = index.optionIssues.get(optionName)
      if (issue === undefined) {
        throw new Error(`cannot serialize configuration model: option '${optionName}' is not part of the decision model`)
      }
      const issueTag = issue.typeName === 'ElementIssue' ? 'ElementIssue' : 'GlobalIssue'
      lines.push('      <Choice')
      lines.push(`        name=${attrValue(`${decisionName}_${optionName}`, 'choice name')}`)
      lines.push(`        issue={<${issueTag} $refByName=${attrValue(refByName(issue.element, `issue '${issue.name}'`), 'issue reference')} />}`)
      lines.push(`        selectedOption={<Option $refByName=${attrValue(refByName(option, `option '${optionName}'`), 'option reference')} />}`)
      lines.push('      />,')
    }
    lines.push('    ]}')
    lines.push('  />')
  }

  lines.push('</ConfigurationModel>')
  return lines.join('\n')
}

/**
 * Group the tags a serialized configuration JSX uses by the component
 * module exporting them: one scan serves both the import lines and the
 * export verification. An unexpected tag is a serializer defect.
 */
export function groupConfigTagsByModule(jsx: string): Map<string, string[]> {
  const byModule = new Map<string, string[]>()
  for (const tag of uniqueJsxTags(jsx)) {
    const module = TAG_MODULES[tag]
    if (module === undefined) {
      throw new Error(`serialized configuration JSX uses unexpected tag '${tag}'`)
    }
    byModule.set(module, [...(byModule.get(module) ?? []), tag])
  }
  return byModule
}

/**
 * Wrap serialized configuration JSX into a complete workspace model module
 * (the same shape `model import --tx` accepts). Imports are grouped per
 * component module and cover exactly the tags the JSX uses; callers that
 * already computed the grouping pass it in.
 */
export function buildConfigModelModule(
  jsx: string,
  header: SynthHeader,
  byModule: Map<string, string[]> = groupConfigTagsByModule(jsx)
): string {
  const jsxModuleTags = ['createExprNode', ...(byModule.get(JSX_MODULE) ?? [])]
  const importLines = [
    `import { ${jsxModuleTags.join(', ')} } from '${JSX_MODULE}'`,
    ...[...byModule.entries()]
      .filter(([module]) => module !== JSX_MODULE)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([module, tags]) => `import { ${tags.join(', ')} } from '${module}'`)
  ]
  return buildModelModuleSource(importLines, serializeSynthHeader(header), jsx.replace(/^/gm, '  '))
}

export interface ConfigWriteRequest {
  store: ModelStore
  configModel: unknown
  decisionModel: unknown
  manifest: TxManifest
  packageDir: string
  /** Workspace ref of the source model this configuration applies to. */
  sourceRef: string
  targetPath: string
  modelsDir: string
}

/**
 * Persist a generated configuration model as a workspace model file:
 * serialize, verify every emitted tag against the exporting component
 * modules, stamp the provenance header, and write through the gated
 * temp-file path. The gate renders the candidate WITH the transformation's
 * parts and its header's reference closure; a plain render can never
 * resolve a configuration model's references.
 */
export async function writeConfigModelFile(request: ConfigWriteRequest): Promise<void> {
  const { store, configModel, decisionModel, manifest, packageDir, sourceRef, targetPath, modelsDir } = request
  const jsx = serializeConfigModel(store, configModel, decisionModel)

  // Same verification approach as transformation run's m2m writer: every tag the JSX
  // uses must be exported (as a component function) by its declared module.
  // The grouping is computed once and reused for the emitted import lines.
  const byModule = groupConfigTagsByModule(jsx)
  for (const [module, tags] of byModule) {
    const mod = await importTxModule(packageDir, module)
    for (const tag of tags) {
      if (typeof moduleExport(mod, tag) !== 'function') {
        throw new Error(`configuration output uses component '${tag}', but '${module}' does not export it`)
      }
    }
  }

  const header = await makeGeneratedHeader({
    kind: 'configuration-model',
    metamodel: CONFIGURATION_METAMODEL,
    references: { sourceModel: sourceRef },
    generatedBy: { tx: manifest.name, txVersion: manifest.version, config: 'defaults' },
    description: `Default configuration for ${manifest.name} on ${sourceRef}`
  })

  await mkdir(dirname(targetPath), { recursive: true })
  await writeGatedModelFile(
    targetPath,
    buildConfigModelModule(jsx, header, byModule),
    async (candidatePath) =>
      await renderModelWithTxContext(candidatePath, packageDir, new ModelStore(), modelsDir, manifest)
  )
}

/** Typed failure of `generateAndPersistDefaultConfig`; `exit` maps to the CLI exit code. */
export class DefaultConfigError extends Error {
  public constructor(
    public readonly exit: number,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options)
  }
}

export interface DefaultConfigRequest {
  buffer: EngineOutputBuffer
  store: ModelStore
  inputRoot: unknown
  parts: TxParts
  manifest: TxManifest
  packageDir: string
  /** Workspace ref of the source model the configuration applies to. */
  sourceRef: string
  modelsDir: string
  /** Pre-resolved target; when set, the generated model is persisted there. */
  target?: WritableTarget
  /** Called once per effective decision, before any persistence. */
  announce: (line: string) => void
}

export interface DefaultConfigResult {
  configModel: unknown
  decisions: DecisionAnnouncement[]
  /** Decision-model defects worth surfacing (duplicate option names). */
  warnings: string[]
}

/**
 * The default-configuration flow shared by `config init` and the
 * execution core's `--default-configs` path (with `--save-config`
 * persisting what was generated): generate the default configuration in
 * the caller's store, announce every decision it records, and (when a
 * target is given) persist it through the gated writer. Failures carry
 * the exit code the caller must use.
 */
export async function generateAndPersistDefaultConfig(
  request: DefaultConfigRequest
): Promise<DefaultConfigResult> {
  const { buffer, store, inputRoot, parts, manifest, packageDir, sourceRef, modelsDir, target, announce } = request
  let configModel: unknown
  try {
    configModel = await buffer.run(() => generateDefaultConfigModel(store, inputRoot, parts.bindingModel))
  } catch (err) {
    throw new DefaultConfigError(
      EXIT_CODES.FAILURE,
      `Failed to generate the default configuration: ${errorMessage(err)}`,
      { cause: err }
    )
  }
  const decisions = collectDecisions(store, configModel, parts.decisionModel)
  for (const announcement of decisions) {
    announce(formatDecisionAnnouncement(announcement))
  }
  if (target !== undefined) {
    try {
      await buffer.run(() =>
        writeConfigModelFile({
          store,
          configModel,
          decisionModel: parts.decisionModel,
          manifest,
          packageDir,
          sourceRef,
          targetPath: target.path,
          modelsDir
        })
      )
    } catch (err) {
      throw new DefaultConfigError(
        EXIT_CODES.VALIDATION_FAILURE,
        `Generated configuration model failed the import gate (${target.ref} was left unchanged): ${errorMessage(err)}`,
        { cause: err }
      )
    }
  }
  return { configModel, decisions, warnings: indexDecisionModel(store, parts.decisionModel).warnings }
}
