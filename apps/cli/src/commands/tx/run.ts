import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
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
import {
  ModelClosureError,
  renderFactory,
  renderModel,
  renderModelClosure,
  writeGatedModelFile
} from '../../models/loader.js'
import type { ModelClosureErrorKind } from '../../models/loader.js'
import { makeGeneratedHeader } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { loadTxManifest } from '../../tx/manifest.js'
import type { TxManifest, TxPartRef } from '../../tx/manifest.js'
import { importTxModule, moduleExport, requireExport } from '../../tx/modules.js'
import { resolveDocDest, uniqueJsxTags } from '../../tx/output.js'

type StoreElement = Parameters<ModelStore['getTypeOf']>[0]

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

// A broken reference closure maps to the same exit codes the equivalent
// direct failure would produce: missing model -> NOT_FOUND, malformed
// header -> VALIDATION_FAILURE, everything else -> FAILURE.
const CLOSURE_EXIT_CODES: Record<ModelClosureErrorKind, number> = {
  'invalid-ref': EXIT_CODES.FAILURE,
  'missing-ref': EXIT_CODES.NOT_FOUND,
  'header-parse-failure': EXIT_CODES.VALIDATION_FAILURE,
  'render-failure': EXIT_CODES.FAILURE
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
    // A config entry whose package directory has vanished is a missing
    // resource, not a generic failure: name what is gone and how to fix it.
    if (!existsSync(entry.path) || !existsSync(join(entry.path, 'package.json'))) {
      this.jsonAwareFail(
        json,
        `Transformation '${args.tx}' is registered in the workspace config but its installed package is missing (expected ${entry.path} with a package.json). Reinstall it with 'synth tx install'.`,
        EXIT_CODES.NOT_FOUND
      )
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
      inRef = normalizeRef(flags.in)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }
    const modelsDir = getModelsPath(this.workspaceConfig)
    const inPath = refToModelPath(modelsDir, inRef)
    if (!existsSync(inPath)) {
      this.jsonAwareFail(json, `Input model not found: ${inRef} (looked for ${inPath})`, EXIT_CODES.NOT_FOUND)
    }
    const inParsed = parseSynthHeader(await readFile(inPath, 'utf-8'))
    // A malformed header is a broken declaration, not a missing one: the
    // metamodel gate cannot be silently skipped.
    if (inParsed.error !== undefined) {
      this.jsonAwareFail(
        json,
        `Input model ${inRef} has a malformed $synth header: ${inParsed.error}`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }
    const inHeader = inParsed.header
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
        outRef = normalizeRef(flags.out ?? `${inRef}-${sanitizeTxName(args.tx)}`)
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
    const step = async <T>(label: string, fn: () => T | Promise<T>): Promise<T> => {
      try {
        return await buffer.run(fn)
      } catch (err) {
        buffer.flushToStderr()
        this.jsonAwareFail(json, `${label}: ${errorMessage(err)}`, EXIT_CODES.FAILURE)
      }
    }

    // 3. Load the input model's reference closure, then the model, into ONE store
    const store = new ModelStore()
    try {
      await buffer.run(() => renderModelClosure(modelsDir, inRef, store))
    } catch (err) {
      buffer.flushToStderr()
      const exit = err instanceof ModelClosureError ? CLOSURE_EXIT_CODES[err.kind] : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    const { root: inputRoot } = await step(`Failed to load input model ${inRef}`, () =>
      renderModel(inPath, store)
    )

    // 4. Render the package's own parts into the same store, in manifest order
    const partsContext = new Context()
    const renderPart = async (part: TxPartRef, label: string): Promise<unknown> =>
      await step(`Failed to render ${label} (${part.module} export ${part.exportName})`, async () => {
        const mod = await importTxModule(entry.path, part.module)
        const factory = requireExport(mod, part.module, part.exportName)
        return renderFactory(factory, store, partsContext, `export '${part.exportName}'`)
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

    // The one place both output modes report success from
    const emitResult = (target: Record<string, unknown>, written: string[]): void => {
      this.log(
        JSON.stringify({
          tx: manifest.name,
          in: inRef,
          ...target,
          kind: manifest.kind,
          ...(manifest.variability ? { decisions } : {}),
          written
        })
      )
    }

    const writeM2mResult = async (target: { ref: string; path: string }): Promise<void> => {
      // The transformation's own serialization of the target tree (kept by
      // abstractM2M during transform) is preferred: the store's raw
      // exportToJSX also emits inverse links and stringified booleans, which
      // do not survive the import gate. exportToJSX remains the fallback for
      // classes that do not extend abstractM2M.
      const contextJsx = txInstance.context?.output?.jsx
      const jsx = (
        typeof contextJsx === 'string' && contextJsx.trim() !== ''
          ? contextJsx
          : await step('Failed to serialize the result model', () =>
              store.exportToJSX(result as StoreElement)
            )
      ).trim()

      const componentsSpec = manifest.target.components as string
      if (!/^<[A-Z][A-Za-z0-9_$]*/.test(jsx)) {
        this.jsonAwareFail(
          json,
          `Transformation '${manifest.name}' produced no serializable JSX output (expected a component tag at the root).`,
          EXIT_CODES.FAILURE
        )
      }
      const tags = uniqueJsxTags(jsx)
      const componentsMod = await step(
        `Failed to import target components module '${componentsSpec}'`,
        () => importTxModule(entry.path, componentsSpec)
      )
      for (const tag of tags) {
        if (typeof moduleExport(componentsMod, tag) !== 'function') {
          this.jsonAwareFail(
            json,
            `Transformation output uses component '${tag}', but '${componentsSpec}' does not export it. The manifest's target.components module must cover every emitted tag.`,
            EXIT_CODES.FAILURE
          )
        }
      }

      const header = await makeGeneratedHeader({
        metamodel: manifest.target.metamodel,
        generatedBy: { tx: manifest.name, txVersion: manifest.version, config: 'defaults' },
        description: `Generated by ${manifest.name} from ${inRef}`
      })

      // Import-gate invariant: the CLI never leaves behind a model that
      // `model import` would reject — and never destroys an existing target
      // on failure. The module is written to a temp file, gated by
      // rendering it into a throwaway store, and only then renamed over
      // the target.
      await mkdir(dirname(target.path), { recursive: true })
      try {
        await writeGatedModelFile(
          target.path,
          buildModelModule(jsx, tags, componentsSpec, header),
          async (candidatePath) => await buffer.run(() => renderModel(candidatePath))
        )
      } catch (err) {
        buffer.flushToStderr()
        this.jsonAwareFail(
          json,
          `Generated model failed the import gate (${target.ref} was left unchanged): ${errorMessage(err)}`,
          EXIT_CODES.VALIDATION_FAILURE
        )
      }

      if (json) {
        emitResult({ out: target.ref }, [target.path])
      } else {
        this.log(`Wrote ${target.ref} (${target.path})`)
      }
    }

    const writeM2tResult = async (outDirValue: string): Promise<void> => {
      // --workspace/--ns switching may have changed cwd; resolve the flag
      // against the directory the user invoked the CLI from
      const outDir = isAbsolute(outDirValue) ? outDirValue : join(this.savedPwd, outDirValue)
      const outRoot = resolve(outDir)
      const genResult = await step('Text generation failed', () =>
        generate(store, result as Parameters<typeof generate>[1], { mode: 'mock' })
      )

      await mkdir(outRoot, { recursive: true })
      const written: string[] = []
      const failures: string[] = []
      // dest -> the Doc that claimed it; two Docs must never silently
      // overwrite each other
      const claimed = new Map<string, string>()
      for (const item of genResult.results) {
        if (item.itemType !== 'Doc') {
          continue
        }
        if (!isSuccess(item.outcome)) {
          failures.push(`${item.itemPath}: ${item.outcome.errors.map((e) => e.message).join('; ')}`)
          continue
        }
        const resolved = resolveDocDest(outRoot, item.itemPath)
        if ('error' in resolved) {
          failures.push(`${item.itemPath}: ${resolved.error}`)
          continue
        }
        const previous = claimed.get(resolved.dest)
        if (previous !== undefined) {
          failures.push(
            `${item.itemPath}: destination ${resolved.dest} is already generated by '${previous}' (two documents map to one file)`
          )
          continue
        }
        claimed.set(resolved.dest, item.itemPath)
        try {
          await mkdir(dirname(resolved.dest), { recursive: true })
          await writeFile(resolved.dest, item.outcome.value, 'utf-8')
        } catch (err) {
          failures.push(`${item.itemPath}: ${errorMessage(err)}`)
          continue
        }
        written.push(resolved.dest)
        if (!json) {
          this.log(`Wrote ${resolved.dest}`)
        }
      }
      if (failures.length > 0) {
        buffer.flushToStderr()
        this.jsonAwareFail(
          json,
          `Text generation reported failures:\n  ${failures.join('\n  ')}`,
          EXIT_CODES.FAILURE
        )
      }

      if (json) {
        emitResult({ outDir }, written)
      }
    }

    // 7. Write the output
    if (m2mTarget !== undefined) {
      await writeM2mResult(m2mTarget)
    } else {
      await writeM2tResult(outDirFlag as string)
    }
  }
}
