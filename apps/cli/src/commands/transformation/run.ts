import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath, getPipelinesPath } from '../../config/index.js'
import {
  newPipelineNameProblem,
  pipelineFileExists,
  readPipelineFile,
  savePipeline
} from '../../pipelines/store.js'
import type { PipelineDefinition } from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { isInteractiveSession } from '../../support/interactive.js'
import { executeRun } from '../../tx/execute.js'
import type { RunSurfaceFlags } from '../../tx/execute.js'

export default class TransformationRun extends BaseCommand {
  static override aliases = ['tx:run']

  static override description = `Run one transformation, or a chain of transformations, on a workspace model.

With one transformation: an m2m result is written back into the workspace as a model file (--out; default '<namespace>/<name>-<tx>' derived from --in), an m2t result generates files under --out-dir; an existing target is only replaced with --overwrite. With several transformations the steps form a chain: step N's output model feeds step N+1 in memory (one shared model store), the chain is type-checked from the manifests before execution (step N's target metamodel must equal step N+1's source metamodel), and only the last step may be m2t (text is terminal; it requires --out-dir). Pass --keep-intermediates to also persist every intermediate result as a workspace model at '<namespace>/<name>-<step-tx>'. Configuration consent is explicit everywhere: --config binds to step 1 only, and every other configuration-based step (and step 1 without --config) requires --default-configs; without it the run aborts before any engine work. --save-config persists the generated default configuration (single step, only together with --default-configs); for chains, run stepwise with 'transformation run' and 'config init'. After a successful run, --save-as <name> saves the steps as a pipeline at pipelines/<name>.json (the process only, no data bindings), replayable with 'synth pipeline run <name> --in <ref>'. In a terminal session, missing values are asked for interactively: no transformation opens a picker over the installed transformations, a missing --in over the models matching the source metamodel, an unconsented configuration-based step offers --config/--default-configs explicitly, and a missing --out-dir is prompted for. Piped, scripted, --json, --quiet, and CI invocations never prompt. Exit codes: 2 for a missing configuration consent, a chain or source metamodel mismatch, an invalid configuration, or a result that fails the import gate, 3 for an unknown transformation or model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --config com.example/persons-cfg',
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --default-configs --out com.example/persons-rel',
    '<%= config.bin %> <%= command.id %> eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir ./generated --save-as gen-sql'
  ]

  // Variadic: every positional argument is a transformation name, in
  // execution order. `strict = false` lets oclif pass them all through.
  static override strict = false

  static override args = {
    tx: Args.string({
      description: 'Installed transformation(s) to run in order.',
      required: true
    })
  }

  static override flags = {
    in: Flags.string({
      description: 'Source model ref the first step transforms.',
      required: true
    }),
    out: Flags.string({
      description:
        "Destination ref for the final result model (last step m2m only; default: '<namespace>/<name>-<last-tx>' derived from --in)."
    }),
    'out-dir': Flags.string({
      description: 'Output directory for generated files (last step m2t only).'
    }),
    config: Flags.string({
      description: 'Configuration model ref for step 1 (configuration-based only; later steps take --default-configs).'
    }),
    // NOT exclusive with --config: in a chain, --config steers step 1 while
    // --default-configs covers the later configuration-based steps. Single-step
    // exclusivity is enforced by the execution core (one message, one exit
    // code for every surface), not by oclif.
    'default-configs': Flags.boolean({
      description:
        'Explicitly accept generated default configurations for every configuration-based step not covered by --config.',
      default: false
    }),
    'save-config': Flags.string({
      description:
        'Persist the generated default configuration as a workspace model at this ref (single step with --default-configs only).',
      exclusive: ['config']
    }),
    trace: Flags.string({
      description:
        "Persist the run's trace model as a workspace model at this ref (single step only). The trace records, per executed rule, the source element, the produced targets, and every resolved configuration option; when the run used generated defaults, the effective configuration is persisted next to it at '<ref>-config'."
    }),
    'save-as': Flags.string({
      description:
        "After a successful run, save the steps as a pipeline at pipelines/<name>.json; run it with 'pipeline run <name> --in <ref>'."
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
    // The relaxed twin of the spec (derived generically in the base class)
    // shows what IS present before deciding between the interactive flow
    // and the strict re-parse.
    const relaxed = await this.parseRelaxed<RunSurfaceFlags>()
    if (!isInteractiveSession(relaxed.flags)) {
      // Non-interactive: the strict parse reproduces today's errors exactly.
      const { argv, flags } = await this.parse(TransformationRun)
      await this.runParsed(argv.map(String), flags)
      return
    }

    const flags = relaxed.flags
    const { completeRunRequest } = await import('../../interactive/flows.js')
    const completed = await this.runInteractiveFlow(Boolean(flags.verbose), (deps) =>
      completeRunRequest(deps, {
        txNames: relaxed.argv.map(String),
        inRef: flags.in,
        config: flags.config,
        defaultConfigs: flags['default-configs'],
        outDir: flags['out-dir'],
        saveConfig: flags['save-config']
      })
    )
    await this.runParsed(completed.txNames, {
      ...flags,
      in: completed.inRef,
      config: completed.config,
      'default-configs': completed.defaultConfigs,
      'out-dir': completed.outDir
    })
  }

  private async runParsed(txNames: string[], flags: RunSurfaceFlags & { in: string }): Promise<void> {
    const json = Boolean(flags.json)
    const pipelinesDir = getPipelinesPath(this.workspaceConfig)

    // --save-as pre-flight: like every writable target, the pipeline
    // target must be valid and claimable BEFORE any engine work. The
    // checks are the same ones `pipeline mk` applies (the run itself
    // validates the steps by executing them).
    const saveAs = flags['save-as']
    let preservedCreatedAt: string | undefined
    let preservedDescription: string | undefined
    if (saveAs !== undefined) {
      if (flags['save-config'] !== undefined) {
        this.jsonAwareFail(
          json,
          `--save-as and --save-config cannot be combined: one saves the steps as a pipeline, the other saves the generated configuration as a model. Run twice, or save the configuration first and bind it with --config.`,
          EXIT_CODES.FAILURE
        )
      }
      const nameProblem = newPipelineNameProblem(saveAs, Object.keys(this.workspaceConfig.transformations))
      if (nameProblem !== undefined) {
        this.jsonAwareFail(json, nameProblem, EXIT_CODES.FAILURE)
      }
      if (pipelineFileExists(pipelinesDir, saveAs)) {
        if (!flags.overwrite) {
          this.jsonAwareFail(json, `Pipeline already exists: ${saveAs}. Use --overwrite to replace it.`, EXIT_CODES.FAILURE)
        }
        // Overwrite updates the steps; authored metadata survives.
        const existing = await readPipelineFile(pipelinesDir, saveAs)
        preservedCreatedAt = existing.pipeline?.createdAt
        preservedDescription = existing.pipeline?.description
      }
    }

    try {
      await executeRun({
        workspaceConfig: this.workspaceConfig,
        modelsDir: getModelsPath(this.workspaceConfig),
        invokedFrom: this.savedPwd,
        txNames,
        inRef: flags.in,
        out: flags.out,
        outDir: flags['out-dir'],
        config: flags.config,
        saveConfig: flags['save-config'],
        trace: flags.trace,
        defaultConfigs: flags['default-configs'],
        keepIntermediates: flags['keep-intermediates'],
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

    // Only a SUCCESSFUL run is worth saving. The pipeline stores the
    // PROCESS only (the steps); every replay names its own data (--in,
    // output, consent) explicitly; stored bindings would silently steer
    // later runs.
    if (saveAs !== undefined) {
      const now = new Date().toISOString()
      const definition: PipelineDefinition = {
        name: saveAs,
        steps: txNames,
        description: preservedDescription ?? '',
        createdAt: preservedCreatedAt !== undefined && preservedCreatedAt !== '' ? preservedCreatedAt : now,
        modifiedAt: now
      }
      const path = await savePipeline(pipelinesDir, definition)
      if (!json && !flags.quiet) {
        this.log(`Saved pipeline '${saveAs}' (${path}); run it with: synth pipeline run ${saveAs} --in <ref>`)
      }
    }
  }
}
