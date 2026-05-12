import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class TxUninstall extends StubCommand {
  static override description = 'Remove an installed transformation.'

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name of the transformation to uninstall.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(TxUninstall)

    await this.printStub({
      command: 'tx uninstall',
      args: { name: args.name },
      flags: {},
      wouldDo: [`delete <workspace>/tx/${args.name}/`]
    })
  }
}
