import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../base/stub-command.js'

export default class Run extends StubCommand {
  static override description = 'Run a model-to-model transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/library',
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/library --config com.example/library.cfg --out com.example/library.rel'
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
    config: Flags.string({
      description: 'Configuration ref for variability resolution.'
    }),
    out: Flags.string({
      description: 'Destination ref for the result model.'
    }),
    overwrite: Flags.boolean({
      description: 'Replace the target model if it already exists.',
      default: false
    })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Run)

    const outRef = flags.out ?? `<computed from ${flags.in}>`
    const configRef = flags.config ?? 'defaults'

    await this.printStub({
      command: 'run',
      args: { tx: args.tx },
      flags: { in: flags.in, config: flags.config, out: flags.out, overwrite: flags.overwrite },
      wouldDo: [
        `resolve transformation ${args.tx}`,
        `load source model ${flags.in}`,
        `resolve configuration ${configRef}`,
        `execute M2M and write result to ${outRef}`
      ]
    })
  }
}
