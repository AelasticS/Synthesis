import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class NsRm extends StubCommand {
  static override description = 'Remove a namespace (must be empty unless --force).'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example.orders',
    '<%= config.bin %> <%= command.id %> com.example.orders --force'
  ]

  static override args = {
    namespace: Args.string({
      description: 'Name of the namespace to remove.',
      required: true
    })
  }

  static override flags = {
    force: Flags.boolean({
      description: 'Remove even if the namespace contains models.',
      default: false
    })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(NsRm)

    await this.printStub({
      command: 'ns rm',
      args: { namespace: args.namespace },
      flags: { force: flags.force },
      wouldDo: [
        `verify namespace empty or --force given`,
        `delete directory <workspace>/models/${args.namespace}`
      ]
    })
  }
}
