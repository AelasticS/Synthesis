import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import { getModelsPath } from '../config/index.js'
import { executeRun } from '../tx/execute.js'

export default class Run extends BaseCommand {
  static override description = `Run one transformation or a chain of transformations on a workspace model.

With one transformation this behaves exactly like 'tx run'. With several, the steps form a chain: step N's output model feeds step N+1 in memory (one shared model store), the chain is type-checked from the manifests before execution (step N's target metamodel must equal step N+1's source metamodel), and only the last step may be m2t (text is terminal; it requires --out-dir). An m2m chain writes only the final result (--out, default '<namespace>/<name>-<last-tx>' derived from --in); pass --keep-intermediates to also persist every intermediate result as a workspace model at '<namespace>/<name>-<step-tx>'. Configuration consent is explicit everywhere: --config binds to step 1 only, and every other decision-based step (and step 1 without --config) requires --default-configs — without it the run aborts before any engine work. --save-config is single-step only; for chains, run stepwise with 'tx run' and 'config init'. Exit codes: 2 for a missing configuration consent, a chain or source metamodel mismatch, an invalid configuration, or a result that fails the import gate, 3 for an unknown transformation or missing model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --config com.example/persons-cfg',
    '<%= config.bin %> <%= command.id %> eer-to-relational rel-to-sql-ddl --in com.example/persons --default-configs --out-dir ./generated',
    '<%= config.bin %> <%= command.id %> eer-to-relational rel-to-sql-ddl --in com.example/persons --config com.example/persons-cfg --default-configs --out-dir ./generated --keep-intermediates'
  ]

  // Variadic: every positional argument is a transformation name, in
  // execution order. `strict = false` lets oclif pass them all through.
  static override strict = false

  static override args = {
    tx: Args.string({
      description: 'Installed transformation(s) to run, in order.',
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
    'keep-intermediates': Flags.boolean({
      description: "Also write every intermediate step result as a workspace model ('<namespace>/<name>-<step-tx>').",
      default: false
    }),
    overwrite: Flags.boolean({
      description: 'Replace existing target models (final, intermediates, and --save-config target).',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { argv, flags } = await this.parse(Run)
    const json = Boolean(flags.json)
    const txNames = argv.map(String)
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
