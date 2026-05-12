import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class NsMk extends StubCommand {
  static override description = 'Create an empty namespace.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example.orders']

  static override args = {
    namespace: Args.string({
      description: 'Name of the namespace to create.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(NsMk)

    await this.printStub({
      command: 'ns mk',
      args: { namespace: args.namespace },
      flags: {},
      wouldDo: [`create directory <workspace>/models/${args.namespace}`]
    })
  }
}
