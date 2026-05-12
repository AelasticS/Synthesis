import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ConfigEdit extends StubCommand {
  static override description = 'Open the configuration in $EDITOR.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/library.cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration ref to edit.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ConfigEdit)

    await this.printStub({
      command: 'config edit',
      args: { ref: args.ref },
      flags: {},
      wouldDo: [`spawn $EDITOR on configuration ${args.ref}`]
    })
  }
}
