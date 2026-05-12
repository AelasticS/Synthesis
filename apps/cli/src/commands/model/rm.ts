import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ModelRm extends StubCommand {
  static override description = 'Delete a model from the workspace.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/order-1']

  static override args = {
    ref: Args.string({
      description: 'Model ref to delete.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ModelRm)

    await this.printStub({
      command: 'model rm',
      args: { ref: args.ref },
      flags: {},
      wouldDo: [`delete model file for ${args.ref}`]
    })
  }
}
