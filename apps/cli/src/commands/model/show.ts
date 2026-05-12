import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ModelShow extends StubCommand {
  static override description = "Print a model's metadata and element summary."

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/order-1']

  static override args = {
    ref: Args.string({
      description: 'Model ref (namespace/name).',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ModelShow)

    await this.printStub({
      command: 'model show',
      args: { ref: args.ref },
      flags: {},
      wouldDo: [`load model ${args.ref}`, 'print metadata + element summary']
    })
  }
}
