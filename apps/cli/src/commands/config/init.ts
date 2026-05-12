import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ConfigInit extends StubCommand {
  static override description = 'Generate a default configuration for a transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --for com.example/library'
  ]

  static override args = {
    tx: Args.string({
      description: 'Transformation to create a configuration for.',
      required: true
    })
  }

  static override flags = {
    for: Flags.string({
      description: 'Model ref this configuration applies to.',
      required: true
    }),
    out: Flags.string({
      description: 'Ref to store the configuration as.'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ConfigInit)

    const outRef = flags.out ?? '<derived>'

    await this.printStub({
      command: 'config init',
      args: { tx: args.tx },
      flags: { for: flags.for, out: flags.out },
      wouldDo: [
        `load tx ${args.tx}`,
        'for each variability issue write its default',
        `store as config ref ${outRef}`
      ]
    })
  }
}
