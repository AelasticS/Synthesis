import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ConfigRm extends StubCommand {
  static override description = 'Delete a configuration.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/library.cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration ref to delete.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ConfigRm)

    await this.printStub({
      command: 'config rm',
      args: { ref: args.ref },
      flags: {},
      wouldDo: [`delete configuration ${args.ref}`]
    })
  }
}
