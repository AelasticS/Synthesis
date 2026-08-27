import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import { getModelsPath, getPipelinesPath } from '../config/index.js'
import {
  isValidPipelineName,
  loadPipeline,
  PipelineError,
  pipelineFileExists,
  readPipelineFile,
  savePipeline
} from '../pipelines/store.js'
import type { PipelineDefinition } from '../pipelines/store.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { normalizeRef } from '../support/refs.js'
import { executeRun } from '../tx/execute.js'

export default class Run extends BaseCommand {
  static override description = `Run one transformation, a chain of transformations, or a saved pipeline on a workspace model.

With one transformation this behaves exactly like 'tx run'. With several, the steps form a chain: step N's output model feeds step N+1 in memory (one shared model store), the chain is type-checked from the manifests before execution (step N's target metamodel must equal step N+1's source metamodel), and only the last step may be m2t (text is terminal; it requires --out-dir). An m2m chain writes only the final result (--out, default '<namespace>/<name>-<last-tx>' derived from --in); pass --keep-intermediates to also persist every intermediate result as a workspace model at '<namespace>/<name>-<step-tx>'. Configuration consent is explicit everywhere: --config binds to step 1 only, and every other decision-based step (and step 1 without --config) requires --default-configs — without it the run aborts before any engine work. --save-config is single-step only; for chains, run stepwise with 'tx run' and 'config init'. After a successful run, --save-as <name> persists the invocation (steps + bindings) as a pipeline at pipelines/<name>.json in the workspace. A single positional name that matches a saved pipeline replays it: the execution request is rebuilt from the saved fields, invocation flags override saved values, and the full normal pre-flight applies — a pipeline is convenience, never a bypass. Pipelines resolve before transformations ('tx run' never resolves pipelines); a name matching both runs the pipeline with a warning. Exit codes: 2 for a missing configuration consent, a chain or source metamodel mismatch, an invalid configuration or pipeline file, or a result that fails the import gate, 3 for an unknown transformation, pipeline, or model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --config com.example/persons-cfg',
    '<%= config.bin %> <%= command.id %> eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir ./generated --save-as gen-sql',
    '<%= config.bin %> <%= command.id %> gen-sql --in com.example/persons2'
  ]

  // Variadic: every positional argument is a transformation name, in
  // execution order (or ONE saved pipeline name). `strict = false` lets
  // oclif pass them all through.
  static override strict = false

  static override args = {
    tx: Args.string({
      description: 'Installed transformation(s) to run in order, or the name of one saved pipeline.',
      required: true
    })
  }

  static override flags = {
    in: Flags.string({
      description: 'Source model ref the first step transforms (required unless a saved pipeline provides it).'
    }),
    out: Flags.string({
      description:
        "Destination ref for the final result model (last step m2m only; default: '<namespace>/<name>-<last-tx>' derived from --in)."
    }),
    'out-dir': Flags.string({
      description: 'Output directory for generated files (last step m2t only).'
    }),
    config: Flags.string({
      description: 'Configuration model ref for step 1 (decision-based only; later steps take --default-configs).'
    }),
    // NOT exclusive with --config: in a chain, --config steers step 1 while
    // --default-configs covers the later decision-based steps.
    'default-configs': Flags.boolean({
      description: 'Explicitly accept generated default configurations for every decision-based step not covered by --config.',
      default: false
    }),
    'save-config': Flags.string({
      description:
        'Persist the generated default configuration as a workspace model at this ref (single step with --default-configs only).',
      exclusive: ['config']
    }),
    'save-as': Flags.string({
      description:
        "After a successful run, save this invocation (steps + bindings) as a pipeline at pipelines/<name>.json; replay it with 'run <name>'."
    }),
    'keep-intermediates': Flags.boolean({
      description: "Also write every intermediate step result as a workspace model ('<namespace>/<name>-<step-tx>').",
      default: false
    }),
    overwrite: Flags.boolean({
      description: 'Replace existing targets (final and intermediate models, --save-config target, --save-as pipeline).',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { argv, flags } = await this.parse(Run)
    const json = Boolean(flags.json)
    const names = argv.map(String)
    const pipelinesDir = getPipelinesPath(this.workspaceConfig)

    // 1. Pipeline resolution: the single positional name resolves as a
    // saved pipeline FIRST, then as a transformation. tx run never
    // resolves pipelines.
    let pipeline: PipelineDefinition | undefined
    if (pipelineFileExists(pipelinesDir, names[0])) {
      if (names.length > 1) {
        this.jsonAwareFail(
          json,
          `'${names[0]}' is a saved pipeline; a pipeline replays alone and cannot be combined with further transformation names (got: ${names.join(' ')}).`,
          EXIT_CODES.FAILURE
        )
      }
      if (this.workspaceConfig.transformations[names[0]] !== undefined) {
        this.warn(
          `'${names[0]}' names both a saved pipeline and an installed transformation; the pipeline wins here. Run the transformation itself with 'synth tx run ${names[0]}'.`
        )
      }
      try {
        pipeline = await loadPipeline(pipelinesDir, names[0])
      } catch (err) {
        const exit = err instanceof PipelineError ? err.exit : EXIT_CODES.FAILURE
        this.jsonAwareFail(json, errorMessage(err), exit)
      }
    } else if (
      names.length === 1 &&
      flags.in === undefined &&
      this.workspaceConfig.transformations[names[0]] === undefined
    ) {
      // Neither a pipeline nor an installed transformation: a missing
      // resource, reported before the missing --in would confuse the story.
      this.jsonAwareFail(
        json,
        `'${names[0]}' is neither a saved pipeline nor an installed transformation. See 'synth pipeline ls' and 'synth tx ls'.`,
        EXIT_CODES.NOT_FOUND
      )
    }

    // 2. Effective request: invocation flags override saved values (the
    // boolean flags can only be switched ON, so OR implements the override).
    const txNames = pipeline?.steps ?? names
    const inRef = flags.in ?? pipeline?.in
    if (inRef === undefined) {
      this.jsonAwareFail(json, `Missing required flag --in: the source model ref the first step transforms.`, EXIT_CODES.FAILURE)
    }
    const out = flags.out ?? pipeline?.out
    const outDir = flags['out-dir'] ?? pipeline?.outDir
    const config = flags.config ?? pipeline?.config
    const defaultConfigs = flags['default-configs'] || pipeline?.defaultConfigs === true
    const keepIntermediates = flags['keep-intermediates'] || pipeline?.keepIntermediates === true

    // 3. --save-as pre-flight: like every writable target, the pipeline
    // target must be valid and claimable BEFORE any engine work.
    const saveAs = flags['save-as']
    let preservedCreatedAt: string | undefined
    let preservedDescription: string | undefined
    if (saveAs !== undefined) {
      if (flags['save-config'] !== undefined) {
        this.jsonAwareFail(
          json,
          `--save-as and --save-config cannot be combined: one saves the invocation as a pipeline, the other saves the generated configuration as a model. Run twice, or save the configuration first and bind it with --config.`,
          EXIT_CODES.FAILURE
        )
      }
      if (!isValidPipelineName(saveAs)) {
        this.jsonAwareFail(
          json,
          `Invalid pipeline name '${saveAs}': names must contain only letters, digits, hyphen or underscore.`,
          EXIT_CODES.FAILURE
        )
      }
      if (this.workspaceConfig.transformations[saveAs] !== undefined) {
        this.jsonAwareFail(
          json,
          `Pipeline name '${saveAs}' would shadow the installed transformation of the same name ('run ${saveAs}' would stop running it). Choose a different name.`,
          EXIT_CODES.FAILURE
        )
      }
      if (pipelineFileExists(pipelinesDir, saveAs)) {
        if (!flags.overwrite) {
          this.jsonAwareFail(json, `Pipeline already exists: ${saveAs}. Use --overwrite to replace it.`, EXIT_CODES.FAILURE)
        }
        // Overwrite updates the invocation; authored metadata survives.
        const existing = await readPipelineFile(pipelinesDir, saveAs)
        preservedCreatedAt = existing.pipeline?.createdAt
        preservedDescription = existing.pipeline?.description
      }
    }

    // 4. Execute — the shared core runs the full pre-flight either way; a
    // replayed pipeline is checked exactly like a fresh invocation.
    try {
      await executeRun({
        workspaceConfig: this.workspaceConfig,
        modelsDir: getModelsPath(this.workspaceConfig),
        invokedFrom: this.savedPwd,
        txNames,
        inRef,
        out,
        outDir,
        config,
        saveConfig: flags['save-config'],
        defaultConfigs,
        keepIntermediates,
        overwrite: flags.overwrite,
        verbose: Boolean(flags.verbose),
        quiet: Boolean(flags.quiet),
        json,
        log: (line) => this.log(line),
        warn: (line) => this.warn(line)
      })
    } catch (err) {
      this.failFromExecuteError(json, err)
    }

    // 5. Only a SUCCESSFUL run is worth replaying: persist the invocation.
    // Refs are stored canonically; outDir is stored as invoked. Optional
    // bindings are stored only when set, so a replay re-derives the same
    // defaults (e.g. the --out ref derived from --in) instead of freezing them.
    if (saveAs !== undefined) {
      const now = new Date().toISOString()
      const definition: PipelineDefinition = {
        name: saveAs,
        steps: txNames,
        in: normalizeRef(inRef),
        ...(out !== undefined ? { out: normalizeRef(out) } : {}),
        ...(outDir !== undefined ? { outDir } : {}),
        ...(config !== undefined ? { config: normalizeRef(config) } : {}),
        ...(defaultConfigs ? { defaultConfigs: true } : {}),
        ...(keepIntermediates ? { keepIntermediates: true } : {}),
        description: preservedDescription ?? '',
        createdAt: preservedCreatedAt !== undefined && preservedCreatedAt !== '' ? preservedCreatedAt : now,
        modifiedAt: now
      }
      const path = await savePipeline(pipelinesDir, definition)
      if (!json && !flags.quiet) {
        this.log(`Saved pipeline '${saveAs}' (${path}); replay it with: synth run ${saveAs}`)
      }
    }
  }
}
