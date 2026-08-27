import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

import { Args, Flags } from '@oclif/core'
import { isSuccess } from '@aelastics/result'
import { generate, ModelStore } from '@synthesis/engine'
import { Context } from '@synthesis/jsx-runtime'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { serializeSynthHeader } from '../../models/header.js'
import type { SynthHeader } from '../../models/header.js'
import {
  ModelClosureError,
  renderModel,
  renderReferenceClosure,
  writeGatedModelFile
} from '../../models/loader.js'
import { makeGeneratedHeader } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { normalizeRef } from '../../support/refs.js'
import {
  ConfigModelResolveError,
  DefaultConfigError,
  generateAndPersistDefaultConfig,
  materializeDefaultChoices,
  resolveConfigurationModel,
  resolveWritableRef
} from '../../tx/config-model.js'
import type { WritableTarget } from '../../tx/config-model.js'
import { formatDecisionAnnouncement, validateConfigStructure } from '../../tx/decisions.js'
import type { DecisionAnnouncement } from '../../tx/decisions.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import {
  CLOSURE_EXIT_CODES,
  renderTxParts,
  resolveInstalledTx,
  resolveSourceModel,
  SourceModelError,
  TxResolveError
} from '../../tx/load.js'
import type { ResolvedSourceModel, TxParts } from '../../tx/load.js'
import type { TxManifest } from '../../tx/manifest.js'
import { importTxModule, moduleExport, requireExport } from '../../tx/modules.js'
import { buildModelModuleSource, resolveDocDest, uniqueJsxTags } from '../../tx/output.js'

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
  return buildModelModuleSource(
    [
      "import { createExprNode } from '@synthesis/jsx-runtime'",
      `import { ${tags.join(', ')} } from '${componentsSpec}'`
    ],
    serializeSynthHeader(header),
    rooted
  )
}

export default class TxRun extends BaseCommand {
  static override description = `Run an installed transformation on a workspace model.

An M2M result is written back into the workspace as a model file; an M2T result generates files under --out-dir. Without --out, an M2M result goes to '<namespace>/<name>-<tx>' derived from --in (tx name sanitized to ref-safe characters); an existing target is only replaced with --overwrite (exit 1 otherwise). A decision-based transformation runs on the configuration model named with --config, or on its generated default configuration (--save-config persists that as a workspace model), and announces every effective decision. Exit codes: 2 for a source-metamodel mismatch, an invalid configuration, or a result that fails the import gate, 3 for an unknown transformation or missing model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --out com.example/persons-rel',
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --config com.example/persons-cfg',
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
    config: Flags.string({
      description: 'Configuration model ref to run with (decision-based transformations only).'
    }),
    'save-config': Flags.string({
      description: 'Persist the generated default configuration as a workspace model at this ref.',
      exclusive: ['config']
    }),
    overwrite: Flags.boolean({
      description: 'Replace the target model (and --save-config target) if it already exists.',
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
    let packageDir: string
    let manifest: TxManifest
    try {
      ;({ packageDir, manifest } = await resolveInstalledTx(this.workspaceConfig, args.tx))
    } catch (err) {
      const exit = err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
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

    // Configuration flags only make sense for a decision-based transformation
    if (!manifest.variability) {
      if (flags.config !== undefined) {
        this.jsonAwareFail(
          json,
          `--config is only valid for decision-based transformations; '${manifest.name}' declares no decision/binding model parts.`,
          EXIT_CODES.FAILURE
        )
      }
      if (flags['save-config'] !== undefined) {
        this.jsonAwareFail(
          json,
          `--save-config is only valid for decision-based transformations; '${manifest.name}' declares no decision/binding model parts.`,
          EXIT_CODES.FAILURE
        )
      }
    }

    // 2. Resolve the input model and gate on its declared metamodel
    const modelsDir = getModelsPath(this.workspaceConfig)
    let source: ResolvedSourceModel
    try {
      source = await resolveSourceModel(modelsDir, flags.in, manifest)
    } catch (err) {
      const exit = err instanceof SourceModelError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    const inRef = source.ref
    const inPath = source.path
    const inHeader = source.header

    // m2m target resolves before any engine work so clashes fail fast
    let m2mTarget: WritableTarget | undefined
    if (manifest.kind === 'm2m') {
      if (manifest.target.components === undefined) {
        this.jsonAwareFail(
          json,
          `Transformation '${manifest.name}' is m2m but its manifest declares no 'target.components' module; the result cannot be written as a workspace model.`,
          EXIT_CODES.FAILURE
        )
      }
      try {
        m2mTarget = resolveWritableRef(
          modelsDir,
          flags.out ?? `${inRef}-${sanitizeTxName(args.tx)}`,
          flags.overwrite,
          'Output model'
        )
      } catch (err) {
        this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
      }
    }

    // Explicit configuration: nominal checks run on the header alone,
    // before any engine work (design §7).
    let configTarget: { ref: string; path: string; header: SynthHeader } | undefined
    if (flags.config !== undefined) {
      try {
        configTarget = await resolveConfigurationModel(modelsDir, flags.config)
      } catch (err) {
        if (err instanceof ConfigModelResolveError) {
          this.jsonAwareFail(json, err.message, err.exit)
        }
        this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
      }
      const configHeader = configTarget.header
      const declaredSource = configHeader.references.sourceModel
      let declaredSourceRef: string | undefined
      try {
        declaredSourceRef = declaredSource === undefined ? undefined : normalizeRef(declaredSource)
      } catch {
        declaredSourceRef = declaredSource
      }
      if (declaredSourceRef !== inRef) {
        this.jsonAwareFail(
          json,
          `Configuration model ${configTarget.ref} was created for source model '${declaredSourceRef ?? '(none declared)'}' but this run transforms '${inRef}'. Generate a configuration for ${inRef} with 'synth config init'.`,
          EXIT_CODES.VALIDATION_FAILURE
        )
      }
      if (configHeader.generatedBy !== null && configHeader.generatedBy.tx !== manifest.name) {
        this.warn(
          `Configuration model ${configTarget.ref} was generated by transformation '${configHeader.generatedBy.tx}', not '${manifest.name}'; its choices may not match this transformation's decision model.`
        )
      }
    }

    // --save-config target resolves before any engine work, like --out —
    // and must never claim the input's or the result's ref: writing the
    // configuration there would destroy that model.
    let saveConfigTarget: WritableTarget | undefined
    if (flags['save-config'] !== undefined) {
      try {
        saveConfigTarget = resolveWritableRef(modelsDir, flags['save-config'], flags.overwrite, 'Configuration model')
      } catch (err) {
        this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
      }
      if (saveConfigTarget.ref === inRef) {
        this.jsonAwareFail(
          json,
          `--save-config target ${saveConfigTarget.ref} is the same ref as --in; saving the configuration there would overwrite the input model. Choose a different ref.`,
          EXIT_CODES.FAILURE
        )
      }
      if (m2mTarget !== undefined && saveConfigTarget.ref === m2mTarget.ref) {
        this.jsonAwareFail(
          json,
          `--save-config target ${saveConfigTarget.ref} is the same ref as the ${flags.out !== undefined ? '--out target' : `default --out target derived from --in`}; the transformation result would overwrite the saved configuration. Choose a different ref.`,
          EXIT_CODES.FAILURE
        )
      }
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
      await buffer.run(() => renderReferenceClosure(modelsDir, inHeader?.references ?? {}, store, inRef, [inRef]))
    } catch (err) {
      buffer.flushToStderr()
      const exit = err instanceof ModelClosureError ? CLOSURE_EXIT_CODES[err.kind] : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    const { root: inputRoot } = await step(`Failed to load input model ${inRef}`, () =>
      renderModel(inPath, store)
    )

    // 4. Render the package's own parts into the same store, in manifest order
    let parts: TxParts
    try {
      parts = await buffer.run(() => renderTxParts(packageDir, manifest, store, new Context()))
    } catch (err) {
      buffer.flushToStderr()
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    // 5. Decision-based tx: load the explicit configuration (its references
    // resolve only now, with parts and input model in the store) or
    // generate the default one; announce every effective decision.
    let configModel: unknown
    let decisions: DecisionAnnouncement[] = []
    if (manifest.variability) {
      if (configTarget !== undefined) {
        const config = configTarget
        try {
          await buffer.run(async () => {
            // The configuration's own header closure renders first (helper
            // models a hand-written configuration references); the input
            // model and the configuration itself are already in the store
            // or about to render — excluded like renderModelClosure's root.
            await renderReferenceClosure(modelsDir, config.header.references, store, config.ref, [inRef, config.ref])
            ;({ root: configModel } = await renderModel(config.path, store))
          })
        } catch (err) {
          buffer.flushToStderr()
          if (err instanceof ModelClosureError) {
            this.jsonAwareFail(json, errorMessage(err), CLOSURE_EXIT_CODES[err.kind])
          }
          this.jsonAwareFail(
            json,
            `Configuration model ${config.ref} failed to load against '${manifest.name}' and ${inRef}: ${errorMessage(err)}`,
            EXIT_CODES.VALIDATION_FAILURE
          )
        }
        const structure = validateConfigStructure(store, configModel, parts.decisionModel, parts.bindingModel, inputRoot)
        for (const warning of structure.warnings) {
          this.warn(warning)
        }
        if (structure.errors.length > 0) {
          this.jsonAwareFail(
            json,
            `Configuration model ${config.ref} does not fit transformation '${manifest.name}' on ${inRef}:\n  ${structure.errors.join('\n  ')}`,
            EXIT_CODES.VALIDATION_FAILURE
          )
        }
        decisions = structure.announcements
        // Every announced '(default)' must exist as a real Choice in the
        // model the transformation receives — the engine applies nothing
        // for a slot without one.
        if (structure.uncoveredDefaults.length > 0) {
          await step('Failed to apply the default choices for uncovered issues', () =>
            materializeDefaultChoices(store, configModel, structure.uncoveredDefaults)
          )
        }
        if (!json) {
          for (const announcement of decisions) {
            this.log(formatDecisionAnnouncement(announcement))
          }
        }
      } else {
        let defaults
        try {
          defaults = await generateAndPersistDefaultConfig({
            buffer,
            store,
            inputRoot,
            parts,
            manifest,
            packageDir,
            sourceRef: inRef,
            modelsDir,
            target: saveConfigTarget,
            announce: (line) => {
              if (!json) {
                this.log(line)
              }
            }
          })
        } catch (err) {
          buffer.flushToStderr()
          const exit = err instanceof DefaultConfigError ? err.exit : EXIT_CODES.FAILURE
          this.jsonAwareFail(json, errorMessage(err), exit)
        }
        configModel = defaults.configModel
        decisions = defaults.decisions
        for (const warning of defaults.warnings) {
          this.warn(warning)
        }
        if (saveConfigTarget !== undefined && !json) {
          this.log(`Wrote ${saveConfigTarget.ref} (${saveConfigTarget.path})`)
        }
      }
    }

    // 6. Instantiate and run the transformation class
    const txInstance = await step(`Failed to load transformation '${manifest.name}'`, async () => {
      const mod = await importTxModule(packageDir, manifest.entry)
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
          ...(configTarget !== undefined ? { config: configTarget.ref } : {}),
          ...(saveConfigTarget !== undefined ? { savedConfig: saveConfigTarget.ref } : {}),
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
        () => importTxModule(packageDir, componentsSpec)
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
        generatedBy: {
          tx: manifest.name,
          txVersion: manifest.version,
          config: configTarget?.ref ?? 'defaults'
        },
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
