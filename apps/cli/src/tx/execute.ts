/**
 * The transformation execution core shared by `transformation run` (one
 * step or an ad-hoc chain) and `pipeline run` (a saved chain). Both
 * commands are thin CLI shells over `executeRun`; every check, message,
 * and exit code lives here exactly once so the two surfaces cannot drift.
 *
 * Configuration policy (uniform, applies to every execution path):
 * decisions are never applied without explicit user consent. A
 * configuration-based step runs either on a named configuration model
 * (`--config`, step 1 only) or on generated defaults the user asked for
 * with `--default-configs`; with neither, the run aborts before any
 * engine work. `--save-config` persists what `--default-configs`
 * generated and is only valid together with it.
 *
 * Chain semantics: step N's output model feeds step N+1 in memory (one
 * ModelStore, `transform(root)` hand-off); the chain is type-checked from
 * the manifests before execution; only the last step may be m2t;
 * `--keep-intermediates` additionally persists every non-final result as
 * a workspace model through the same gated writer as a final m2m result.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

import { isSuccess } from '@aelastics/result'
import { generate, ModelStore } from '@synthesis/engine'
import { Context } from '@synthesis/jsx-runtime'

import type { WorkspaceConfig } from '../config/index.js'
import { serializeSynthHeader } from '../models/header.js'
import type { SynthHeader } from '../models/header.js'
import {
  ModelClosureError,
  renderModel,
  renderReferenceClosure,
  writeGatedModelFile
} from '../models/loader.js'
import { makeGeneratedHeader } from '../models/stamp.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { normalizeRef } from '../support/refs.js'
import {
  ConfigModelResolveError,
  DefaultConfigError,
  generateAndPersistDefaultConfig,
  materializeDefaultChoices,
  resolveConfigurationModel,
  resolveWritableRef
} from './config-model.js'
import type { ResolvedConfigModel, WritableTarget } from './config-model.js'
import { chainStructureProblems, resolveChainSteps } from './chain.js'
import { formatDecisionAnnouncement, validateConfigStructure } from './decisions.js'
import type { DecisionAnnouncement } from './decisions.js'
import { EngineOutputBuffer } from './engine-output.js'
import { ExecuteError } from './execute-error.js'
import { CLOSURE_EXIT_CODES, renderTxParts, resolveSourceModel, SourceModelError } from './load.js'
import type { ResolvedSourceModel, TxParts } from './load.js'
import type { TxManifest } from './manifest.js'
import { importTxModule, moduleExport, requireExport } from './modules.js'
import { buildModelModuleSource, resolveDocDest, uniqueJsxTags } from './output.js'

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

export { ExecuteError }

// Ref name segments allow only [A-Za-z0-9_-]; anything else in the tx name
// (e.g. '@scope/name') collapses to '-' for the default output ref.
export function sanitizeTxName(name: string): string {
  const sanitized = name.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
  return sanitized === '' ? 'out' : sanitized
}

/**
 * Wrap serialized JSX into a complete workspace model module: the same
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

/**
 * The CLI flag values (flag-name-keyed) both run surfaces, `transformation
 * run` and `pipeline run`, parse into and feed to `executeRun`. One shared
 * shape so the two commands cannot drift. `in` is optional because
 * `pipeline run` re-checks it with its own message; `save-as` exists only
 * on `transformation run` and stays undefined for pipelines.
 */
export interface RunSurfaceFlags {
  in?: string
  out?: string
  'out-dir'?: string
  config?: string
  'save-config'?: string
  'save-as'?: string
  'default-configs': boolean
  'keep-intermediates': boolean
  overwrite: boolean
  json?: boolean
  quiet?: boolean
  verbose?: boolean
}

/**
 * Indexes of the chain steps that would run on GENERATED DEFAULT
 * configurations: every configuration-based step not covered by `--config`
 * (which binds to step 1 only). The single owner of the coverage
 * judgment: the execution core's consent gate and the interactive
 * consent picker both read it, so they cannot disagree about which
 * steps still need the `--default-configs` consent.
 */
export function uncoveredDecisionSteps(
  steps: ReadonlyArray<{ manifest: TxManifest }>,
  config: string | undefined
): number[] {
  const uncovered: number[] = []
  for (const [index, step] of steps.entries()) {
    if (step.manifest.variability && !(index === 0 && config !== undefined)) {
      uncovered.push(index)
    }
  }
  return uncovered
}

export interface ExecuteRequest {
  workspaceConfig: WorkspaceConfig
  /** Workspace models directory. */
  modelsDir: string
  /** Directory the CLI was invoked from; --out-dir resolves against it. */
  invokedFrom: string
  /** Transformation names, in execution order (one = single step). */
  txNames: string[]
  inRef: string
  out?: string
  outDir?: string
  config?: string
  saveConfig?: string
  defaultConfigs: boolean
  keepIntermediates: boolean
  overwrite: boolean
  verbose: boolean
  quiet: boolean
  json: boolean
  /** Unconditional output: 'Wrote ...' lines and the final --json object. */
  log: (line: string) => void
  warn: (line: string) => void
}

/**
 * How a step's configuration is sourced, resolved ONCE in pre-flight:
 *   'explicit':  step 1 running on the model named with --config;
 *   'defaults':  configuration-based step running on generated defaults
 *                (valid only with the --default-configs consent);
 *   'none':      the transformation declares no decisions.
 * The consent gate, the execution branch, the --save-config write, and the
 * provenance all read this field instead of re-deriving the coverage.
 */
type StepConfigSource = 'explicit' | 'defaults' | 'none'

interface Step {
  /** Name as given on the command line (resolves the installed entry). */
  txName: string
  packageDir: string
  manifest: TxManifest
  configSource: StepConfigSource
}

interface StepReport {
  tx: string
  kind: TxManifest['kind']
  decisions?: DecisionAnnouncement[]
}

export async function executeRun(request: ExecuteRequest): Promise<void> {
  const { workspaceConfig, modelsDir, json } = request
  const info = (line: string): void => {
    if (!json && !request.quiet) {
      request.log(line)
    }
  }
  // Explicitly annotated as never-returning so control-flow analysis treats
  // every `fail(...)` call as terminal (like a `throw` statement).
  const fail: (exit: number, message: string, cause?: unknown) => never = (exit, message, cause) => {
    throw new ExecuteError(exit, message, cause === undefined ? undefined : { cause })
  }

  // 1. Resolve every transformation and its manifest (shared with the
  // static authoring path), and derive each step's configuration source
  // from the shared coverage judgment (--config covers step 1 only)
  const resolvedSteps = await resolveChainSteps(workspaceConfig, request.txNames)
  const uncoveredIndexes = new Set(uncoveredDecisionSteps(resolvedSteps, request.config))
  const steps: Step[] = resolvedSteps.map((step, index) => ({
    ...step,
    configSource: step.manifest.variability ? (uncoveredIndexes.has(index) ? 'defaults' : 'explicit') : 'none'
  }))
  const stepCount = steps.length
  const multi = stepCount > 1
  const first = steps[0]
  const last = steps[stepCount - 1]
  const stepLabel = (index: number): string => `step ${index + 1} (${steps[index].manifest.name})`

  // 2. Chain structural checks, from manifests alone (shared with
  // `pipeline mk`): text is terminal, and step N's target metamodel must
  // be step N+1's source metamodel.
  for (const problem of chainStructureProblems(steps)) {
    fail(problem.exit, problem.message)
  }

  // 3. Output flags must match the LAST step's kind before any work runs
  if (last.manifest.kind === 'm2m' && request.outDir !== undefined) {
    fail(
      EXIT_CODES.FAILURE,
      `--out-dir is only valid when the ${multi ? 'last step' : 'transformation'} is m2t; '${last.manifest.name}' is m2m. Use --out <ref>.`
    )
  }
  if (last.manifest.kind === 'm2t' && request.out !== undefined) {
    fail(
      EXIT_CODES.FAILURE,
      `--out is only valid when the ${multi ? 'last step' : 'transformation'} is m2m; '${last.manifest.name}' is m2t. Use --out-dir <dir>.`
    )
  }
  if (last.manifest.kind === 'm2t' && request.outDir === undefined) {
    fail(EXIT_CODES.FAILURE, `--out-dir is required for m2t transformation '${last.manifest.name}'.`)
  }
  if (request.keepIntermediates && !multi) {
    fail(
      EXIT_CODES.FAILURE,
      `--keep-intermediates is only valid for a multi-step chain; a single transformation has no intermediate results.`
    )
  }

  // 4. Configuration flags: --config and --default-configs are mutually
  // exclusive for a single step (the exclusivity lives HERE, in the core,
  // so both command surfaces enforce it identically); --config binds to
  // step 1 ONLY; --default-configs needs at least one configuration-based step;
  // --save-config persists what --default-configs generated (single-step
  // only, never in chains).
  if (!multi && request.config !== undefined && request.defaultConfigs) {
    fail(
      EXIT_CODES.FAILURE,
      `--config and --default-configs are mutually exclusive for a single transformation: --config runs on the named configuration, --default-configs on generated defaults.`
    )
  }
  if (request.config !== undefined && !first.manifest.variability) {
    fail(
      EXIT_CODES.FAILURE,
      multi
        ? `--config binds to step 1 of the chain, and '${first.manifest.name}' is not configuration-based (it declares no decision/binding model parts).`
        : `--config is only valid for configuration-based transformations; '${first.manifest.name}' declares no decision/binding model parts.`
    )
  }
  // --default-configs must have at least one configuration-based step left to
  // consent to (i.e. one that would run on generated defaults).
  const uncoveredSteps = steps.filter((step) => step.configSource === 'defaults')
  if (request.defaultConfigs && uncoveredSteps.length === 0) {
    fail(
      EXIT_CODES.FAILURE,
      multi
        ? request.config !== undefined
          ? `--default-configs has nothing to apply: step 1 runs on --config and no later step is configuration-based.`
          : `--default-configs was given but no step of the chain is configuration-based; there are no decisions to default.`
        : `--default-configs is only valid for configuration-based transformations; '${first.manifest.name}' declares no decision/binding model parts.`
    )
  }
  if (request.saveConfig !== undefined) {
    if (multi) {
      fail(
        EXIT_CODES.FAILURE,
        `--save-config is not supported for multi-step runs; the configured path is stepwise: run each step with 'transformation run' and create configurations with 'synth config init'.`
      )
    }
    if (!first.manifest.variability) {
      fail(
        EXIT_CODES.FAILURE,
        `--save-config is only valid for configuration-based transformations; '${first.manifest.name}' declares no decision/binding model parts.`
      )
    }
    if (!request.defaultConfigs) {
      fail(
        EXIT_CODES.FAILURE,
        `--save-config persists the configuration generated by --default-configs and is only valid together with it. To run with an existing configuration use --config; to create one to edit first, use 'synth config init'.`
      )
    }
  }
  // 5. Resolve the input model and gate on step 1's declared source metamodel
  let source: ResolvedSourceModel
  try {
    source = await resolveSourceModel(modelsDir, request.inRef, first.manifest)
  } catch (err) {
    fail(err instanceof SourceModelError ? err.exit : EXIT_CODES.FAILURE, errorMessage(err), err)
  }
  const inRef = source.ref

  // 6. Consent gate: every configuration-based step must be covered by --config
  // (step 1 only) or --default-configs, BEFORE any engine work. The
  // message depends on WHICH step is uncovered: step 1's input model
  // exists in the workspace, so an explicit configuration is possible and
  // is taught; only a later step's input is produced mid-run.
  if (!request.defaultConfigs) {
    const uncovered = steps.findIndex((step) => step.configSource === 'defaults')
    if (uncovered === 0) {
      fail(
        EXIT_CODES.VALIDATION_FAILURE,
        `${multi ? stepLabel(0) : `Transformation '${first.manifest.name}'`} is configuration-based. Provide --config <ref> (create one with: synth config init ${first.manifest.name} --for ${inRef}) or accept generated defaults explicitly with --default-configs.`
      )
    }
    if (uncovered > 0) {
      fail(
        EXIT_CODES.VALIDATION_FAILURE,
        `${stepLabel(uncovered)} is configuration-based; a chain cannot take an explicit configuration for a model that is produced mid-run. Either run stepwise: transformation run + config init against the intermediate, or accept generated defaults explicitly: --default-configs.`
      )
    }
  }

  // 7. Writable targets resolve before any engine work so clashes fail fast:
  // the final m2m target and (with --keep-intermediates) every intermediate.
  let m2mTarget: WritableTarget | undefined
  if (last.manifest.kind === 'm2m') {
    if (last.manifest.target.components === undefined) {
      fail(
        EXIT_CODES.FAILURE,
        `Transformation '${last.manifest.name}' is m2m but its manifest declares no 'target.components' module; the result cannot be written as a workspace model.`
      )
    }
    try {
      m2mTarget = resolveWritableRef(
        modelsDir,
        request.out ?? `${inRef}-${sanitizeTxName(last.txName)}`,
        request.overwrite,
        'Output model'
      )
    } catch (err) {
      fail(EXIT_CODES.FAILURE, errorMessage(err), err)
    }
  }
  const intermediateTargets: (WritableTarget | undefined)[] = []
  for (let i = 0; i < stepCount - 1; i++) {
    if (!request.keepIntermediates) {
      intermediateTargets.push(undefined)
      continue
    }
    if (steps[i].manifest.target.components === undefined) {
      fail(
        EXIT_CODES.FAILURE,
        `--keep-intermediates requires every intermediate result to be writable as a workspace model, but ${stepLabel(i)} declares no 'target.components' module in its manifest.`
      )
    }
    try {
      intermediateTargets.push(
        resolveWritableRef(modelsDir, `${inRef}-${sanitizeTxName(steps[i].txName)}`, request.overwrite, 'Intermediate model')
      )
    } catch (err) {
      fail(EXIT_CODES.FAILURE, errorMessage(err), err)
    }
  }

  // 8. Explicit configuration (step 1): nominal checks run on the header
  // alone, before any engine work (design §7).
  let configTarget: ResolvedConfigModel | undefined
  if (request.config !== undefined) {
    try {
      configTarget = await resolveConfigurationModel(modelsDir, request.config)
    } catch (err) {
      fail(err instanceof ConfigModelResolveError ? err.exit : EXIT_CODES.FAILURE, errorMessage(err), err)
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
      fail(
        EXIT_CODES.VALIDATION_FAILURE,
        `Configuration model ${configTarget.ref} was created for source model '${declaredSourceRef ?? '(none declared)'}' but this run transforms '${inRef}'. Generate a configuration for ${inRef} with 'synth config init'.`
      )
    }
    if (configHeader.generatedBy !== null && configHeader.generatedBy.tx !== first.manifest.name) {
      request.warn(
        `Configuration model ${configTarget.ref} was generated by transformation '${configHeader.generatedBy.tx}', not '${first.manifest.name}'; its choices may not match this transformation's decision model.`
      )
    }
  }

  // 9. --save-config target resolves before any engine work, like --out.
  let saveConfigTarget: WritableTarget | undefined
  if (request.saveConfig !== undefined) {
    try {
      saveConfigTarget = resolveWritableRef(modelsDir, request.saveConfig, request.overwrite, 'Configuration model')
    } catch (err) {
      fail(EXIT_CODES.FAILURE, errorMessage(err), err)
    }
  }

  // 10. Every ref the run will write (kept intermediates, the final --out
  // target, the --save-config target) and the --in ref must be pairwise
  // distinct: a duplicate would make the run overwrite its own input or
  // one of its own outputs. Checked here, before any engine work.
  const claimedRefs = new Map<string, string>()
  const claimRef = (ref: string, what: string): void => {
    const holder = claimedRefs.get(ref)
    if (holder !== undefined) {
      fail(
        EXIT_CODES.FAILURE,
        `${what} ${ref} is the same ref as ${holder}; ${
          holder === '--in' ? 'the run would overwrite the input model' : 'one run cannot write the same ref twice'
        }. Choose a different ref.`
      )
    }
    claimedRefs.set(ref, what)
  }
  claimRef(inRef, '--in')
  for (let i = 0; i < intermediateTargets.length; i++) {
    const target = intermediateTargets[i]
    if (target !== undefined) {
      claimRef(target.ref, `the intermediate model of ${stepLabel(i)}`)
    }
  }
  if (m2mTarget !== undefined) {
    claimRef(m2mTarget.ref, request.out !== undefined ? 'the --out target' : 'the default --out target derived from --in')
  }
  if (saveConfigTarget !== undefined) {
    claimRef(saveConfigTarget.ref, '--save-config target')
  }

  if (multi) {
    info(`Running ${stepCount} steps on ${inRef}: ${steps.map((step) => step.txName).join(' -> ')}`)
  } else {
    info(`Running ${first.manifest.name}@${first.manifest.version} (${first.manifest.kind}) on ${inRef}`)
  }

  const buffer = new EngineOutputBuffer(!request.verbose)
  const step = async <T>(label: string, fn: () => T | Promise<T>): Promise<T> => {
    try {
      return await buffer.run(fn)
    } catch (err) {
      buffer.flushToStderr()
      fail(EXIT_CODES.FAILURE, `${label}: ${errorMessage(err)}`, err)
    }
  }

  // 11. Load the input model's reference closure, then the model, into ONE
  // store shared by every step of the run.
  const store = new ModelStore()
  try {
    await buffer.run(() => renderReferenceClosure(modelsDir, source.header?.references ?? {}, store, inRef, [inRef]))
  } catch (err) {
    buffer.flushToStderr()
    fail(err instanceof ModelClosureError ? CLOSURE_EXIT_CODES[err.kind] : EXIT_CODES.FAILURE, errorMessage(err), err)
  }
  const { root: inputRoot } = await step(`Failed to load input model ${inRef}`, () => renderModel(source.path, store))

  const written: string[] = []
  const intermediates: string[] = []
  const reports: StepReport[] = []

  /**
   * Write an m2m result as a workspace model with provenance header via the
   * gated temp-file path, used for the final m2m result and for every
   * --keep-intermediates intermediate. The CLI never leaves behind a model
   * `model import` would reject, and never destroys an existing target on
   * failure.
   */
  const writeM2mResult = async (
    current: Step,
    txInstance: TransformationInstance,
    result: unknown,
    target: WritableTarget,
    configProvenance: string,
    /** The step's ACTUAL input: a workspace ref or a mid-chain marker. */
    stepSourceRef: string
  ): Promise<void> => {
    const { manifest } = current
    // The transformation's own serialization of the target tree (kept by
    // abstractM2M during transform) is preferred: the store's raw
    // exportToJSX also emits inverse links and stringified booleans, which
    // do not survive the import gate. exportToJSX remains the fallback for
    // classes that do not extend abstractM2M.
    const contextJsx = txInstance.context?.output?.jsx
    const jsx = (
      typeof contextJsx === 'string' && contextJsx.trim() !== ''
        ? contextJsx
        : await step('Failed to serialize the result model', () => store.exportToJSX(result as StoreElement))
    ).trim()

    const componentsSpec = manifest.target.components as string
    if (!/^<[A-Z][A-Za-z0-9_$]*/.test(jsx)) {
      fail(
        EXIT_CODES.FAILURE,
        `Transformation '${manifest.name}' produced no serializable JSX output (expected a component tag at the root).`
      )
    }
    const tags = uniqueJsxTags(jsx)
    const componentsMod = await step(`Failed to import target components module '${componentsSpec}'`, () =>
      importTxModule(current.packageDir, componentsSpec)
    )
    for (const tag of tags) {
      if (typeof moduleExport(componentsMod, tag) !== 'function') {
        fail(
          EXIT_CODES.FAILURE,
          `Transformation output uses component '${tag}', but '${componentsSpec}' does not export it. The manifest's target.components module must cover every emitted tag.`
        )
      }
    }

    const header = await makeGeneratedHeader({
      metamodel: manifest.target.metamodel,
      generatedBy: {
        tx: manifest.name,
        txVersion: manifest.version,
        config: configProvenance
      },
      description: `Generated by ${manifest.name} from ${stepSourceRef}`
    })

    await mkdir(dirname(target.path), { recursive: true })
    try {
      await writeGatedModelFile(
        target.path,
        buildModelModule(jsx, tags, componentsSpec, header),
        async (candidatePath) => await buffer.run(() => renderModel(candidatePath))
      )
    } catch (err) {
      buffer.flushToStderr()
      fail(
        EXIT_CODES.VALIDATION_FAILURE,
        `Generated model failed the import gate (${target.ref} was left unchanged): ${errorMessage(err)}`,
        err
      )
    }
    written.push(target.path)
    if (!json) {
      request.log(`Wrote ${target.ref} (${target.path})`)
    }
  }

  // --workspace/--ns switching may have changed cwd; resolve the flag
  // against the directory the user invoked the CLI from
  const outDirJoined =
    request.outDir === undefined
      ? undefined
      : isAbsolute(request.outDir)
        ? request.outDir
        : join(request.invokedFrom, request.outDir)

  /** Run the last step's m2t generation and write the files under --out-dir. */
  const writeM2tResult = async (result: unknown, outDir: string): Promise<void> => {
    const outRoot = resolve(outDir)
    const genResult = await step('Text generation failed', () =>
      generate(store, result as Parameters<typeof generate>[1], { mode: 'mock' })
    )

    await mkdir(outRoot, { recursive: true })
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
        request.log(`Wrote ${resolved.dest}`)
      }
    }
    if (failures.length > 0) {
      buffer.flushToStderr()
      fail(EXIT_CODES.FAILURE, `Text generation reported failures:\n  ${failures.join('\n  ')}`)
    }
  }

  // 12. Execute the steps: per step render that step's manifest parts,
  // resolve its configuration (per the pre-flight configSource), transform,
  // and hand the result to the next step in memory. `stepSourceRef` tracks
  // each step's ACTUAL input for provenance and default-config generation:
  // the kept-intermediate ref when it exists, else a derivation marker.
  let stepInput: unknown = inputRoot
  let stepSourceRef = inRef
  for (let i = 0; i < stepCount; i++) {
    const current = steps[i]
    const { manifest, packageDir } = current
    const prefix = multi ? `[step ${i + 1}/${stepCount} ${current.txName}] ` : ''
    if (multi) {
      info(`${prefix}Running ${manifest.name}@${manifest.version} (${manifest.kind})`)
    }

    // Render the step's own parts into the shared store, in manifest order
    let parts: TxParts
    try {
      parts = await buffer.run(() => renderTxParts(packageDir, manifest, store, new Context()))
    } catch (err) {
      buffer.flushToStderr()
      fail(EXIT_CODES.FAILURE, errorMessage(err), err)
    }

    // Configuration-based step: load the explicit configuration (step 1 only;
    // its references resolve only now, with parts and input model in the
    // store) or generate the default one; announce every effective decision.
    let configModel: unknown
    let decisions: DecisionAnnouncement[] = []
    if (current.configSource !== 'none') {
      if (current.configSource === 'explicit' && configTarget !== undefined) {
        const config = configTarget
        try {
          await buffer.run(async () => {
            // The configuration's own header closure renders first (helper
            // models a hand-written configuration references); the input
            // model and the configuration itself are already in the store
            // or about to render, excluded like renderModelClosure's root.
            await renderReferenceClosure(modelsDir, config.header.references, store, config.ref, [inRef, config.ref])
            ;({ root: configModel } = await renderModel(config.path, store))
          })
        } catch (err) {
          buffer.flushToStderr()
          if (err instanceof ModelClosureError) {
            fail(CLOSURE_EXIT_CODES[err.kind], errorMessage(err), err)
          }
          fail(
            EXIT_CODES.VALIDATION_FAILURE,
            `Configuration model ${config.ref} failed to load against '${manifest.name}' and ${inRef}: ${errorMessage(err)}`,
            err
          )
        }
        const structure = validateConfigStructure(store, configModel, parts.decisionModel, parts.bindingModel, stepInput)
        for (const warning of structure.warnings) {
          request.warn(warning)
        }
        if (structure.errors.length > 0) {
          fail(
            EXIT_CODES.VALIDATION_FAILURE,
            `Configuration model ${config.ref} does not fit transformation '${manifest.name}' on ${inRef}:\n  ${structure.errors.join('\n  ')}`
          )
        }
        decisions = structure.announcements
        // Every announced '(default)' must exist as a real Choice in the
        // model the transformation receives; the engine applies nothing
        // for a slot without one.
        if (structure.uncoveredDefaults.length > 0) {
          await step('Failed to apply the default choices for uncovered issues', () =>
            materializeDefaultChoices(store, configModel, structure.uncoveredDefaults)
          )
        }
        if (!json) {
          for (const announcement of decisions) {
            request.log(`${prefix}${formatDecisionAnnouncement(announcement)}`)
          }
        }
      } else {
        let defaults
        try {
          defaults = await generateAndPersistDefaultConfig({
            buffer,
            store,
            inputRoot: stepInput,
            parts,
            manifest,
            packageDir,
            sourceRef: stepSourceRef,
            modelsDir,
            // Pre-flight rejects --save-config on multi-step runs, so a
            // defined target here always belongs to the only step.
            target: saveConfigTarget,
            announce: (line) => {
              if (!json) {
                request.log(`${prefix}${line}`)
              }
            }
          })
        } catch (err) {
          buffer.flushToStderr()
          fail(err instanceof DefaultConfigError ? err.exit : EXIT_CODES.FAILURE, errorMessage(err), err)
        }
        configModel = defaults.configModel
        decisions = defaults.decisions
        for (const warning of defaults.warnings) {
          request.warn(warning)
        }
        if (saveConfigTarget !== undefined && !json) {
          request.log(`Wrote ${saveConfigTarget.ref} (${saveConfigTarget.path})`)
        }
      }
    }

    // Instantiate and run the transformation class
    const txInstance = await step(`Failed to load transformation '${manifest.name}'`, async () => {
      const mod = await importTxModule(packageDir, manifest.entry)
      const ctor = requireExport(mod, manifest.entry, manifest.exportName)
      if (typeof ctor !== 'function') {
        throw new Error(`export '${manifest.exportName}' is not a constructor`)
      }
      const Transformation = ctor as TransformationCtor
      return manifest.variability ? new Transformation(store, {}, configModel) : new Transformation(store)
    })
    const result = await step(`Transformation '${manifest.name}' failed`, () => txInstance.transform(stepInput))

    reports.push({
      tx: manifest.name,
      kind: manifest.kind,
      ...(manifest.variability ? { decisions } : {})
    })

    const configProvenance =
      current.configSource === 'explicit' && configTarget !== undefined ? configTarget.ref : 'defaults'
    if (i < stepCount - 1) {
      // Non-final step: the in-memory result is the next step's input;
      // --keep-intermediates additionally persists it as a workspace model.
      const intermediateTarget = intermediateTargets[i]
      if (intermediateTarget !== undefined) {
        await writeM2mResult(current, txInstance, result, intermediateTarget, configProvenance, stepSourceRef)
        intermediates.push(intermediateTarget.ref)
      }
      stepInput = result
      // The next step's actual input is the kept intermediate when there is
      // one; otherwise the result exists only in memory and provenance
      // records how it was derived.
      stepSourceRef =
        intermediateTarget !== undefined ? intermediateTarget.ref : `${stepSourceRef} via ${manifest.name}`
    } else if (m2mTarget !== undefined) {
      await writeM2mResult(current, txInstance, result, m2mTarget, configProvenance, stepSourceRef)
    } else {
      await writeM2tResult(result, outDirJoined as string)
    }
  }

  // 13. The one place both output modes report success from
  if (json) {
    const target = m2mTarget !== undefined ? { out: m2mTarget.ref } : { outDir: outDirJoined }
    request.log(
      JSON.stringify(
        multi
          ? {
              steps: reports,
              in: inRef,
              ...target,
              ...(intermediates.length > 0 ? { intermediates } : {}),
              written
            }
          : {
              tx: first.manifest.name,
              in: inRef,
              ...target,
              kind: first.manifest.kind,
              ...(first.manifest.variability ? { decisions: reports[0].decisions ?? [] } : {}),
              ...(configTarget !== undefined ? { config: configTarget.ref } : {}),
              ...(saveConfigTarget !== undefined ? { savedConfig: saveConfigTarget.ref } : {}),
              written
            }
      )
    )
  }
}
