/**
 * Configuration-model generation and persistence.
 *
 * The engine's serializations do not round-trip a configuration model: the
 * transformation-kept JSX prints object props as bare identifiers
 * (`selectedOption={SnakeCase}`) and `exportToJSX` inlines the whole
 * decision/source graphs. So the CLI serializes the rendered configuration
 * model itself, emitting the same `$refByName` reference style a
 * hand-written configuration uses — every issue/option/element/binding is
 * a reference into the transformation's parts or the source model, which
 * is exactly why such a file only renders with the tx context loaded.
 */

import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

import { ModelStore } from '@synthesis/engine'
import { SourceModelToDefaultConfigurationModel } from '@synthesis/decision-framework/decisions/4.source-model-2-default-configuration-model/SourceModel2DefaultConfigurationModel'

import { serializeSynthHeader } from '../models/header.js'
import type { SynthHeader } from '../models/header.js'
import { writeGatedModelFile } from '../models/loader.js'
import { makeGeneratedHeader } from '../models/stamp.js'
import { indexDecisionModel } from './decisions.js'
import { renderModelWithTxContext } from './load.js'
import type { TxManifest } from './manifest.js'
import { importTxModule, moduleExport } from './modules.js'
import { uniqueJsxTags } from './output.js'

type StoreElement = Parameters<ModelStore['getTypeOf']>[0]

/** Metamodel specifier stamped into every configuration model's header. */
export const CONFIGURATION_METAMODEL =
  '@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model'

const CONFIG_COMPONENTS =
  '@synthesis/decision-framework/decisions/3.configuration-model/configuration-meta.model-components'
const DECISION_COMPONENTS =
  '@synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components'
const BINDING_COMPONENTS =
  '@synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components'
const JSX_RUNTIME = '@synthesis/jsx-runtime'

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
  Model: JSX_RUNTIME,
  Element: JSX_RUNTIME
}

// The generator is typed against @synthesis/metamodel-core, which is not a
// CLI dependency; the manifest-driven call site is untyped anyway.
const DefaultConfigGenerator = SourceModelToDefaultConfigurationModel as unknown as new (
  store: ModelStore,
  extra: { bindingModel: unknown }
) => { transform(input: unknown): unknown }

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
 * suffixes). The decision model provides each option's owning issue — the
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
 * Wrap serialized configuration JSX into a complete workspace model module
 * — the same shape `model import --tx` accepts. Imports are grouped per
 * component module and cover exactly the tags the JSX uses.
 */
export function buildConfigModelModule(jsx: string, header: SynthHeader): string {
  const byModule = new Map<string, string[]>()
  for (const tag of uniqueJsxTags(jsx)) {
    const module = TAG_MODULES[tag]
    if (module === undefined) {
      throw new Error(`serialized configuration JSX uses unexpected tag '${tag}'`)
    }
    byModule.set(module, [...(byModule.get(module) ?? []), tag])
  }
  const jsxRuntimeTags = ['createExprNode', ...(byModule.get(JSX_RUNTIME) ?? [])]
  byModule.delete(JSX_RUNTIME)
  const importLines = [
    `import { ${jsxRuntimeTags.join(', ')} } from '${JSX_RUNTIME}'`,
    ...[...byModule.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([module, tags]) => `import { ${tags.join(', ')} } from '${module}'`)
  ]
  return [
    '/** @jsx createExprNode */',
    '',
    ...importLines,
    '',
    serializeSynthHeader(header),
    '',
    'export default (store) => (',
    jsx.replace(/^/gm, '  '),
    ')',
    ''
  ].join('\n')
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
 * parts and its header's reference closure — a plain render can never
 * resolve a configuration model's references.
 */
export async function writeConfigModelFile(request: ConfigWriteRequest): Promise<void> {
  const { store, configModel, decisionModel, manifest, packageDir, sourceRef, targetPath, modelsDir } = request
  const jsx = serializeConfigModel(store, configModel, decisionModel)

  // Same verification approach as tx run's m2m writer: every tag the JSX
  // uses must be exported (as a component function) by its declared module.
  for (const tag of uniqueJsxTags(jsx)) {
    const module = TAG_MODULES[tag]
    if (module === undefined) {
      throw new Error(`serialized configuration JSX uses unexpected tag '${tag}'`)
    }
    const mod = await importTxModule(packageDir, module)
    if (typeof moduleExport(mod, tag) !== 'function') {
      throw new Error(`configuration output uses component '${tag}', but '${module}' does not export it`)
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
    buildConfigModelModule(jsx, header),
    async (candidatePath) => await renderModelWithTxContext(candidatePath, packageDir, new ModelStore(), modelsDir)
  )
}
