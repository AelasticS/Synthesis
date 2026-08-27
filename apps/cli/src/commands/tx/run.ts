import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { format } from 'node:util'

import { Args, Flags } from '@oclif/core'
import { isSuccess } from '@aelastics/result'
import { generate, ModelStore } from '@synthesis/engine'
import { Context } from '@synthesis/jsx-runtime'
import { SourceModelToDefaultConfigurationModel } from '@synthesis/decision-framework/decisions/4.source-model-2-default-configuration-model/SourceModel2DefaultConfigurationModel'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader, serializeSynthHeader } from '../../models/header.js'
import type { SynthHeader } from '../../models/header.js'
import { renderModel } from '../../models/loader.js'
import { resolveGitAuthor } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { parseRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { loadTxManifest } from '../../tx/manifest.js'
import type { TxManifest, TxPartRef } from '../../tx/manifest.js'
import { importTxModule, moduleExport, requireExport } from '../../tx/modules.js'

type StoreElement = Parameters<ModelStore['getTypeOf']>[0]

interface JsxNode {
  render(ctx: Context): unknown
}

interface TransformationInstance {
  transform(input: unknown): unknown
  /** abstractM2M keeps the serialized target-tree JSX here after transform(). */
  context?: { output?: { jsx?: unknown } }
}

type TransformationCtor = new (
  store: ModelStore,
  extra?: unknown,
  configModel?: unknown
) => TransformationInstance

// The generator is typed against @synthesis/metamodel-core, which is not a
// CLI dependency; the manifest-driven call site is untyped anyway.
const DefaultConfigGenerator = SourceModelToDefaultConfigurationModel as unknown as new (
  store: ModelStore,
  extra: { bindingModel: unknown }
) => { transform(input: unknown): unknown }

interface DecisionAnnouncement {
  issue: string
  option: string
  element?: string
  isDefault: boolean
}

/**
 * The engine traces transformations and dumps JSX via console.log (which
 * oclif's this.log also uses). Unless --verbose, each engine call runs
 * with console.log buffered; the buffer is flushed to stderr on failure so
 * errors keep their engine context.
 */
class EngineOutputBuffer {
  private lines: string[] = []
  private readonly originalLog = console.log

  public constructor(private readonly active: boolean) {}

  public async run<T>(fn: () => T | Promise<T>): Promise<T> {
    if (!this.active) {
      return await fn()
    }
    console.log = (...logArgs: unknown[]): void => {
      this.lines.push(format(...logArgs))
    }
    try {
      return await fn()
    } finally {
      console.log = this.originalLog
    }
  }

  public flushToStderr(): void {
    for (const line of this.lines) {
      process.stderr.write(`${line}\n`)
    }
    this.lines = []
  }
}

// Ref name segments allow only [A-Za-z0-9_-]; anything else in the tx name
// (e.g. '@scope/name') collapses to '-' for the default output ref.
function sanitizeTxName(name: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return sanitized === '' ? 'out' : sanitized
}

const JSX_TAG_RE = /<([A-Z][A-Za-z0-9_$]*)/g

function uniqueJsxTags(jsx: string): string[] {
  return [...new Set([...jsx.matchAll(JSX_TAG_RE)].map((match) => match[1]))].sort()
}

/**
 * Wrap serialized JSX into a complete workspace model module — the same
 * shape `model import` accepts, so the import gate applies unchanged.
 */
function buildModelModule(jsx: string, tags: string[], componentsSpec: string, header: SynthHeader): string {
  const rooted = jsx.replace(/^<([A-Z][A-Za-z0-9_$]*)/, '<$1 store={store}')
  return [
    '/** @jsx createExprNode */',
    '',
    "import { createExprNode } from '@synthesis/jsx-runtime'",
    `import { ${tags.join(', ')} } from '${componentsSpec}'`,
    '',
    serializeSynthHeader(header),
    '',
    'export default (store) => (',
    rooted,
    ')',
    ''
  ].join('\n')
}

/**
 * Option name -> owning issue name, from the rendered decision model. The
 * rendered graph does not materialize the Option->Issue containment
 * (issue.options stays empty and option.ParentIssue is unset), but the
 * model's elements[] preserves document order: every Option follows the
 * Issue that declared it.
 */
function mapOptionsToIssues(store: ModelStore, decisionModel: unknown): Map<string, string> {
  const map = new Map<string, string>()
  const elements = (decisionModel as { elements?: unknown[] } | undefined)?.elements ?? []
  let currentIssue: string | undefined
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
      currentIssue = name
    } else if (typeName === 'Option' && currentIssue !== undefined) {
      map.set(name, currentIssue)
    }
  }
  return map
}

/**
 * One announcement per Choice in the configuration model. Global Decisions
 * carry no element; ElementDecisions point at the source-model element the
 * choice applies to. The issue label comes from the decision model (the
 * choice's own issue reference stays unresolved in the rendered graph).
 */
function collectDecisions(
  store: ModelStore,
  configModel: unknown,
  decisionModel: unknown
): DecisionAnnouncement[] {
  const optionIssues = mapOptionsToIssues(store, decisionModel)
  const announcements: DecisionAnnouncement[] = []
  const decisions = (configModel as { decisions?: unknown[] } | undefined)?.decisions ?? []
  for (const rawDecision of decisions) {
    const decision = rawDecision as {
      name?: string
      element?: { name?: unknown } | null
      choices?: Array<{ selectedOption?: { name?: unknown; isDefault?: unknown } | null }>
    }
    for (const choice of decision.choices ?? []) {
      const option = choice.selectedOption?.name
      if (typeof option !== 'string') {
        continue
      }
      const elementName = decision.element?.name
      announcements.push({
        issue: optionIssues.get(option) ?? decision.name ?? '(unknown issue)',
        option,
        ...(typeof elementName === 'string' && elementName !== '' ? { element: elementName } : {}),
        isDefault: choice.selectedOption?.isDefault === true
      })
    }
  }
  return announcements
}

function formatDecisionAnnouncement(announcement: DecisionAnnouncement): string {
  const suffix = announcement.isDefault ? ' (default)' : ''
  return announcement.element === undefined
    ? `decision ${announcement.issue} -> ${announcement.option}${suffix}`
    : `decision for element ${announcement.element}: ${announcement.issue} -> ${announcement.option}${suffix}`
}

export default class TxRun extends BaseCommand {
  static override description = `Run an installed transformation on a workspace model.

An M2M result is written back into the workspace as a model file; an M2T result generates files under --out-dir. Without --out, an M2M result goes to '<namespace>/<name>-<tx>' derived from --in (tx name sanitized to ref-safe characters); an existing target is only replaced with --overwrite (exit 1 otherwise). A decision-based transformation runs on its generated default configuration and announces every decision. Exit codes: 2 for a source-metamodel mismatch or a result that fails the import gate, 3 for an unknown transformation or missing model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --out com.example/persons-rel',
    '<%= config.bin %> <%= command.id %> rel-to-sql-ddl --in com.example/persons-rel --out-dir ./generated'
  ]

  static override args = {
    tx: Args.string({
      description: 'Name of the installed transformation to run.',
      required: true
    })
  }

  static override flags = {
    in: Flags.string({
      description: 'Source model ref to transform.',
      required: true
    }),
    out: Flags.string({
      description:
        "Destination ref for the result model (m2m only; default: '<namespace>/<name>-<tx>' derived from --in)."
    }),
    'out-dir': Flags.string({
      description: 'Output directory for generated files (m2t only).'
    }),
    overwrite: Flags.boolean({
      description: 'Replace the target model if it already exists.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(TxRun)
    const json = Boolean(flags.json)
    const info = (message: string): void => {
      if (!json && !flags.quiet) {
        this.log(message)
      }
    }

    // 1. Resolve the installed transformation and its manifest
    const entry = this.workspaceConfig.transformations[args.tx]
    if (entry === undefined) {
      const installed = Object.keys(this.workspaceConfig.transformations)
      const hint =
        installed.length > 0
          ? `Installed transformations: ${installed.join(', ')}`
          : `No transformations installed. Use 'synth tx install' to install one.`
      this.jsonAwareFail(json, `Transformation not found: ${args.tx}. ${hint}`, EXIT_CODES.NOT_FOUND)
    }
    let manifest: TxManifest
    try {
      manifest = await loadTxManifest(entry.path)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    // Output flags must match the transformation kind before any work runs
    const outDirFlag = flags['out-dir']
    if (manifest.kind === 'm2m' && outDirFlag !== undefined) {
      this.jsonAwareFail(
        json,
        `--out-dir is only valid for m2t transformations; '${manifest.name}' is m2m — use --out <ref>.`,
        EXIT_CODES.FAILURE
      )
    }
    if (manifest.kind === 'm2t' && flags.out !== undefined) {
      this.jsonAwareFail(
        json,
        `--out is only valid for m2m transformations; '${manifest.name}' is m2t — use --out-dir <dir>.`,
        EXIT_CODES.FAILURE
      )
    }
    if (manifest.kind === 'm2t' && outDirFlag === undefined) {
      this.jsonAwareFail(
        json,
        `--out-dir is required for m2t transformation '${manifest.name}'.`,
        EXIT_CODES.FAILURE
      )
    }

    // 2. Resolve the input model and gate on its declared metamodel
    let inRef: string
    try {
      const parsed = parseRef(flags.in)
      inRef = `${parsed.namespace}/${parsed.name}`
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }
    const modelsDir = getModelsPath(this.workspaceConfig)
    const inPath = refToModelPath(modelsDir, inRef)
    if (!existsSync(inPath)) {
      this.jsonAwareFail(json, `Input model not found: ${inRef} (looked for ${inPath})`, EXIT_CODES.NOT_FOUND)
    }
    const inHeader = parseSynthHeader(await readFile(inPath, 'utf-8')).header
    if (inHeader !== null && inHeader.metamodel !== '' && inHeader.metamodel !== manifest.source.metamodel) {
      this.jsonAwareFail(
        json,
        `Type mismatch: input model ${inRef} declares metamodel '${inHeader.metamodel}' but transformation '${manifest.name}' expects '${manifest.source.metamodel}'.`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    // m2m target resolves before any engine work so clashes fail fast
    let m2mTarget: { ref: string; path: string } | undefined
    if (manifest.kind === 'm2m') {
      if (manifest.target.components === undefined) {
        this.jsonAwareFail(
          json,
          `Transformation '${manifest.name}' is m2m but its manifest declares no 'target.components' module; the result cannot be written as a workspace model.`,
          EXIT_CODES.FAILURE
        )
      }
      let outRef: string
      try {
        const parsed = parseRef(flags.out ?? `${inRef}-${sanitizeTxName(args.tx)}`)
        outRef = `${parsed.namespace}/${parsed.name}`
      } catch (err) {
        this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
      }
      const outPath = refToModelPath(modelsDir, outRef)
      if (existsSync(outPath) && !flags.overwrite) {
        this.jsonAwareFail(
          json,
          `Output model already exists: ${outRef}. Use --overwrite to replace it.`,
          EXIT_CODES.FAILURE
        )
      }
      m2mTarget = { ref: outRef, path: outPath }
    }

    info(`Running ${manifest.name}@${manifest.version} (${manifest.kind}) on ${inRef}`)

    const buffer = new EngineOutputBuffer(!flags.verbose)
    const step = async <T>(
      label: string,
      fn: () => T | Promise<T>,
      exitCode: number = EXIT_CODES.FAILURE
    ): Promise<T> => {
      try {
        return await buffer.run(fn)
      } catch (err) {
        buffer.flushToStderr()
        this.jsonAwareFail(json, `${label}: ${errorMessage(err)}`, exitCode)
      }
    }

    // 3. Load the input model's reference closure, then the model, into ONE store
    const store = new ModelStore()
    const visited = new Set<string>([inRef])
    const renderReferences = async (references: Record<string, string>): Promise<void> => {
      for (const target of Object.values(references)) {
        let targetRef: string
        try {
          const parsed = parseRef(target)
          targetRef = `${parsed.namespace}/${parsed.name}`
        } catch (err) {
          this.jsonAwareFail(json, `Invalid model reference '${target}': ${errorMessage(err)}`, EXIT_CODES.FAILURE)
        }
        if (visited.has(targetRef)) {
          continue
        }
        visited.add(targetRef)
        const targetPath = refToModelPath(modelsDir, targetRef)
        if (!existsSync(targetPath)) {
          this.jsonAwareFail(
            json,
            `Referenced model not found: ${targetRef} (required by ${inRef} or its references)`,
            EXIT_CODES.NOT_FOUND
          )
        }
        const targetHeader = parseSynthHeader(await readFile(targetPath, 'utf-8')).header
        // Depth-first: a model's own references render before the model itself
        await renderReferences(targetHeader?.references ?? {})
        await step(`Failed to load referenced model ${targetRef}`, () => renderModel(targetPath, store))
      }
    }
    await renderReferences(inHeader?.references ?? {})
    const { root: inputRoot } = await step(`Failed to load input model ${inRef}`, () =>
      renderModel(inPath, store)
    )

    // 4. Render the package's own parts into the same store, in manifest order
    const partsContext = new Context()
    const renderPart = async (part: TxPartRef, label: string): Promise<unknown> =>
      await step(`Failed to render ${label} (${part.module} export ${part.exportName})`, async () => {
        const mod = await importTxModule(entry.path, part.module)
        const factory = requireExport(mod, part.module, part.exportName)
        if (typeof factory !== 'function') {
          throw new Error(`export '${part.exportName}' is not a function`)
        }
        const node = (factory as (s: ModelStore) => JsxNode)(store)
        if (node === null || typeof node !== 'object' || typeof node.render !== 'function') {
          throw new Error(`export '${part.exportName}' did not return a JSX expression node`)
        }
        return node.render(partsContext)
      })
    for (const [index, metamodel] of (manifest.parts?.metamodels ?? []).entries()) {
      await renderPart(metamodel, `parts.metamodels[${index}]`)
    }
    let decisionModelRoot: unknown
    let bindingModelRoot: unknown
    if (manifest.parts?.decisionModel !== undefined) {
      decisionModelRoot = await renderPart(manifest.parts.decisionModel, 'parts.decisionModel')
    }
    if (manifest.parts?.bindingModel !== undefined) {
      bindingModelRoot = await renderPart(manifest.parts.bindingModel, 'parts.bindingModel')
    }

    // 5. Decision-based tx: generate the default configuration and announce it
    let configModel: unknown
    let decisions: DecisionAnnouncement[] = []
    if (manifest.variability) {
      configModel = await step('Failed to generate the default configuration', () => {
        const generator = new DefaultConfigGenerator(store, { bindingModel: bindingModelRoot })
        return generator.transform(inputRoot)
      })
      decisions = collectDecisions(store, configModel, decisionModelRoot)
      if (!json) {
        for (const announcement of decisions) {
          this.log(formatDecisionAnnouncement(announcement))
        }
      }
    }

    // 6. Instantiate and run the transformation class
    const txInstance = await step(`Failed to load transformation '${manifest.name}'`, async () => {
      const mod = await importTxModule(entry.path, manifest.entry)
      const ctor = requireExport(mod, manifest.entry, manifest.exportName)
      if (typeof ctor !== 'function') {
        throw new Error(`export '${manifest.exportName}' is not a constructor`)
      }
      const Transformation = ctor as TransformationCtor
      return manifest.variability ? new Transformation(store, {}, configModel) : new Transformation(store)
    })
    const result = await step(`Transformation '${manifest.name}' failed`, () =>
      txInstance.transform(inputRoot)
    )

    // 7. Write the output
    if (m2mTarget !== undefined) {
      await this.writeM2mResult(manifest, entry.path, inRef, m2mTarget, store, txInstance, result, {
        buffer,
        step,
        json,
        decisions
      })
    } else {
      await this.writeM2tResult(manifest, inRef, outDirFlag as string, store, result, {
        buffer,
        step,
        json,
        decisions
      })
    }
  }

  private async writeM2mResult(
    manifest: TxManifest,
    packageDir: string,
    inRef: string,
    target: { ref: string; path: string },
    store: ModelStore,
    txInstance: TransformationInstance,
    result: unknown,
    io: {
      buffer: EngineOutputBuffer
      step: <T>(label: string, fn: () => T | Promise<T>, exitCode?: number) => Promise<T>
      json: boolean
      decisions: DecisionAnnouncement[]
    }
  ): Promise<void> {
    // The transformation's own serialization of the target tree (kept by
    // abstractM2M during transform) is preferred: the store's raw
    // exportToJSX also emits inverse links and stringified booleans, which
    // do not survive the import gate. exportToJSX remains the fallback for
    // classes that do not extend abstractM2M.
    const contextJsx = txInstance.context?.output?.jsx
    const jsx = (
      typeof contextJsx === 'string' && contextJsx.trim() !== ''
        ? contextJsx
        : await io.step('Failed to serialize the result model', () =>
            store.exportToJSX(result as StoreElement)
          )
    ).trim()

    const componentsSpec = manifest.target.components as string
    if (!/^<[A-Z][A-Za-z0-9_$]*/.test(jsx)) {
      this.jsonAwareFail(
        io.json,
        `Transformation '${manifest.name}' produced no serializable JSX output (expected a component tag at the root).`,
        EXIT_CODES.FAILURE
      )
    }
    const tags = uniqueJsxTags(jsx)
    const componentsMod = await io.step(
      `Failed to import target components module '${componentsSpec}'`,
      () => importTxModule(packageDir, componentsSpec)
    )
    for (const tag of tags) {
      if (typeof moduleExport(componentsMod, tag) !== 'function') {
        this.jsonAwareFail(
          io.json,
          `Transformation output uses component '${tag}', but '${componentsSpec}' does not export it. The manifest's target.components module must cover every emitted tag.`,
          EXIT_CODES.FAILURE
        )
      }
    }

    const now = new Date().toISOString()
    const header: SynthHeader = {
      kind: 'model',
      metamodel: manifest.target.metamodel,
      references: {},
      generatedBy: {
        tx: manifest.name,
        txVersion: manifest.version,
        config: 'defaults',
        date: now
      },
      createdAt: now,
      modifiedAt: now,
      author: (await resolveGitAuthor()) ?? 'unknown',
      version: '0.1.0',
      description: `Generated by ${manifest.name} from ${inRef}`,
      tags: [],
      license: null,
      custom: {}
    }

    await mkdir(dirname(target.path), { recursive: true })
    await writeFile(target.path, buildModelModule(jsx, tags, componentsSpec, header), 'utf-8')

    // Import-gate invariant: the CLI never leaves behind a model that
    // `model import` would reject. Render the written file into a
    // throwaway store; delete it on failure.
    try {
      await io.buffer.run(() => renderModel(target.path))
    } catch (err) {
      await rm(target.path, { force: true })
      io.buffer.flushToStderr()
      this.jsonAwareFail(
        io.json,
        `Generated model failed the import gate and was removed (${target.ref}): ${errorMessage(err)}`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    if (io.json) {
      this.log(
        JSON.stringify({
          tx: manifest.name,
          in: inRef,
          out: target.ref,
          kind: manifest.kind,
          ...(manifest.variability ? { decisions: io.decisions } : {}),
          written: [target.path]
        })
      )
    } else {
      this.log(`Wrote ${target.ref} (${target.path})`)
    }
  }

  private async writeM2tResult(
    manifest: TxManifest,
    inRef: string,
    outDirFlag: string,
    store: ModelStore,
    result: unknown,
    io: {
      buffer: EngineOutputBuffer
      step: <T>(label: string, fn: () => T | Promise<T>, exitCode?: number) => Promise<T>
      json: boolean
      decisions: DecisionAnnouncement[]
    }
  ): Promise<void> {
    // --workspace/--ns switching may have changed cwd; resolve the flag
    // against the directory the user invoked the CLI from
    const outDir = isAbsolute(outDirFlag) ? outDirFlag : join(this.savedPwd, outDirFlag)
    const genResult = await io.step('Text generation failed', () =>
      generate(store, result as Parameters<typeof generate>[1], { mode: 'mock' })
    )

    await mkdir(outDir, { recursive: true })
    const written: string[] = []
    const failures: string[] = []
    for (const item of genResult.results) {
      if (item.itemType !== 'Doc') {
        continue
      }
      if (!isSuccess(item.outcome)) {
        failures.push(`${item.itemPath}: ${item.outcome.errors.map((e) => e.message).join('; ')}`)
        continue
      }
      const dest = resolve(outDir, item.itemPath)
      // Doc names come from the transformation; never let one escape --out-dir
      if (dest !== outDir && !dest.startsWith(resolve(outDir) + sep)) {
        failures.push(`${item.itemPath}: resolves outside the output directory`)
        continue
      }
      await mkdir(dirname(dest), { recursive: true })
      await writeFile(dest, item.outcome.value, 'utf-8')
      written.push(dest)
      if (!io.json) {
        this.log(`Wrote ${dest}`)
      }
    }
    if (failures.length > 0) {
      io.buffer.flushToStderr()
      this.jsonAwareFail(
        io.json,
        `Text generation reported failures:\n  ${failures.join('\n  ')}`,
        EXIT_CODES.FAILURE
      )
    }

    if (io.json) {
      this.log(
        JSON.stringify({
          tx: manifest.name,
          in: inRef,
          outDir,
          kind: manifest.kind,
          ...(manifest.variability ? { decisions: io.decisions } : {}),
          written
        })
      )
    }
  }
}
