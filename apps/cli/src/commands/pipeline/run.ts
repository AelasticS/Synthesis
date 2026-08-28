import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath, getPipelinesPath } from '../../config/index.js'
import { loadPipeline } from '../../pipelines/store.js'
import type { PipelineDefinition } from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { isInteractiveSession } from '../../support/interactive.js'
import { executeRun } from '../../tx/execute.js'
import type { RunSurfaceFlags } from '../../tx/execute.js'

export default class PipelineRun extends BaseCommand {
  static override aliases = ['pl:run']

  static override description = `Run a saved pipeline on a workspace model.

A pipeline stores only the process — its transformation steps. Every run names its own data explicitly, exactly like 'transformation run' with the same steps: --in is always required, output goes to --out (last step m2m; default '<namespace>/<name>-<last-tx>' derived from --in) or --out-dir (last step m2t), and configuration consent follows the normal policy (--config binds to step 1 only; every other decision-based step requires --default-configs, otherwise the run aborts before any engine work). The full pre-flight applies — a pipeline is convenience, never a bypass. In a terminal session, missing values are asked for interactively: no name opens a picker over the saved pipelines, a missing --in over the models matching step 1's source metamodel, an unconsented decision-based step offers --config/--default-configs explicitly, and a missing --out-dir is prompted for. Piped, scripted, --json, --quiet, and CI invocations never prompt. Exit codes: 2 for a missing configuration consent, a chain or source metamodel mismatch, an invalid configuration or pipeline file, or a result that fails the import gate, 3 for an unknown pipeline, transformation, or model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> gen-sql --in com.example/persons --default-configs --out-dir ./generated',
    '<%= config.bin %> <%= command.id %> to-relational --in com.example/persons --config com.example/persons-cfg'
  ]

  static override args = {
    name: Args.string({
      description: 'Name of the saved pipeline to run.',
      required: true
    })
  }

  static override flags = {
    in: Flags.string({
      description: 'Source model ref the first step transforms (always required — a pipeline stores no data bindings).'
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
    'default-configs': Flags.boolean({
      description:
        'Explicitly accept generated default configurations for every decision-based step not covered by --config.',
      default: false
    }),
    'save-config': Flags.string({
      description:
        'Persist the generated default configuration as a workspace model at this ref (single-step pipeline with --default-configs only).',
      exclusive: ['config']
    }),
    'keep-intermediates': Flags.boolean({
      description: "Also write every intermediate step result as a workspace model ('<namespace>/<name>-<step-tx>').",
      default: false
    }),
    overwrite: Flags.boolean({
      description: 'Replace existing targets (final and intermediate models, --save-config target).',
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
      const { args, flags } = await this.parse(PipelineRun)
      await this.runParsed(args.name, flags)
      return
    }

    const flags = relaxed.flags
    this.requireInitializedWorkspace(false)
    const { completeRunRequest, pickPipelineName } = await import('../../interactive/flows.js')
    const { name, pipeline, completed } = await this.runInteractiveFlow(Boolean(flags.verbose), async (deps) => {
      const pickedName = relaxed.args.name ?? (await pickPipelineName(deps))
      // The pipeline substitutes its steps; the flow completes the data the
      // same way it does for 'transformation run' with those steps.
      const definition = await loadPipeline(deps.pipelinesDir, pickedName)
      const request = await completeRunRequest(deps, {
        txNames: definition.steps,
        inRef: flags.in,
        config: flags.config,
        defaultConfigs: flags['default-configs'],
        outDir: flags['out-dir'],
        saveConfig: flags['save-config']
      })
      return { name: pickedName, pipeline: definition, completed: request }
    })
    await this.runParsed(
      name,
      {
        ...flags,
        in: completed.inRef,
        config: completed.config,
        'default-configs': completed.defaultConfigs,
        'out-dir': completed.outDir
      },
      // Already loaded for the flow — runParsed must not load it twice.
      pipeline
    )
  }

  private async runParsed(name: string, flags: RunSurfaceFlags, preloaded?: PipelineDefinition): Promise<void> {
    const json = Boolean(flags.json)
    this.requireInitializedWorkspace(json)

    // The argument is ALWAYS a pipeline name — never a transformation
    // (run one of those with 'transformation run'). No name guessing.
    let pipeline: PipelineDefinition
    if (preloaded !== undefined) {
      pipeline = preloaded
    } else {
      try {
        pipeline = await loadPipeline(getPipelinesPath(this.workspaceConfig), name)
      } catch (err) {
        this.failFromExecuteError(json, err)
      }
    }

    if (flags.in === undefined) {
      this.jsonAwareFail(
        json,
        `Missing required flag --in: a pipeline stores only the process (its steps), so every run names the source model itself. Run it with: synth pipeline run ${pipeline.name} --in <ref>`,
        EXIT_CODES.FAILURE
      )
    }

    // The pipeline substitutes its steps; from here on the request takes
    // the IDENTICAL path as 'transformation run' with the same steps.
    try {
      await executeRun({
        workspaceConfig: this.workspaceConfig,
        modelsDir: getModelsPath(this.workspaceConfig),
        invokedFrom: this.savedPwd,
        txNames: pipeline.steps,
        inRef: flags.in,
        out: flags.out,
        outDir: flags['out-dir'],
        config: flags.config,
        saveConfig: flags['save-config'],
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
  }
}
