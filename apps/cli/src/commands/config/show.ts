import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ConfigShow extends StubCommand {
  static override description = 'Print the current value of every binding in a configuration.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/library.cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration ref to show.',
      required: true
    })
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(ConfigShow)

    await this.printStub({
      command: 'config show',
      args: { ref: args.ref },
      flags: {},
      wouldDo: [`load configuration ${args.ref}`, 'print bindings']
    })
  }
}
