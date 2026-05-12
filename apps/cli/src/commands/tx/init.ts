import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class TxInit extends StubCommand {
  static override description = 'Scaffold a new transformation project.'

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name for the new transformation project.',
      required: true
    })
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(TxInit)

    await this.printStub({
      command: 'tx init',
      args: { name: args.name },
      flags: {},
      wouldDo: [
        `scaffold project directory ${args.name}/`,
        'write package.json, synth.json, tsconfig.json, src/transformation.ts, test/, README.md'
      ]
    })
  }
}
