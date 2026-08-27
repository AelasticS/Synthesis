import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { executeRun } from '../../tx/execute.js'

export default class TxRun extends BaseCommand {
  static override description = `Run an installed transformation on a workspace model.

An M2M result is written back into the workspace as a model file; an M2T result generates files under --out-dir. Without --out, an M2M result goes to '<namespace>/<name>-<tx>' derived from --in (tx name sanitized to ref-safe characters); an existing target is only replaced with --overwrite (exit 1 otherwise). A decision-based transformation never applies decisions without explicit consent: run it either on the configuration model named with --config (create one with 'synth config init'), or on its generated default configuration by passing --default-configs — with neither, the run aborts before any engine work. Every effective decision is announced. --save-config persists the generated default configuration as a workspace model and is only valid together with --default-configs. Exit codes: 2 for a missing configuration consent, a source-metamodel mismatch, an invalid configuration, or a result that fails the import gate, 3 for an unknown transformation or missing model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --config com.example/persons-cfg',
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/persons --default-configs --out com.example/persons-rel',
    '<%= config.bin %> <%= command.id %> rel-to-sql-ddl --in com.example/persons-rel --default-configs --out-dir ./generated'
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
    // Exclusivity with --config is enforced by the execution core (one
    // message, one exit code for both `tx run` and `run`), not by oclif.
    'default-configs': Flags.boolean({
      description: 'Explicitly accept the generated default configuration for a decision-based transformation.',
      default: false
    }),
    'save-config': Flags.string({
      description:
        'Persist the generated default configuration as a workspace model at this ref (only together with --default-configs).',
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
    try {
      await executeRun({
        workspaceConfig: this.workspaceConfig,
        modelsDir: getModelsPath(this.workspaceConfig),
        invokedFrom: this.savedPwd,
        txNames: [args.tx],
        inRef: flags.in,
        out: flags.out,
        outDir: flags['out-dir'],
        config: flags.config,
        saveConfig: flags['save-config'],
        defaultConfigs: flags['default-configs'],
        keepIntermediates: false,
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
