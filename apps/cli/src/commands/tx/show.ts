import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class TxShow extends StubCommand {
  static override description = "Print the transformation's source metamodel, target metamodel, and variability points."

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name of the transformation to show.',
      required: true
    })
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(TxShow)

    await this.printStub({
      command: 'tx show',
      args: { name: args.name },
      flags: {},
      wouldDo: [
        `load synth.json for ${args.name}`,
        'print source/target metamodels and variability issues'
      ]
    })
  }
}
