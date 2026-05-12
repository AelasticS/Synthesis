import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ModelExport extends StubCommand {
  static override description = 'Write a model from the workspace to a file on disk.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/order-1',
    '<%= config.bin %> <%= command.id %> com.example/order-1 --to ./out/order.json'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to export.',
      required: true
    })
  }

  static override flags = {
    to: Flags.string({
      description: 'Destination file path.'
    })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ModelExport)

    const destination = flags.to ?? `./<name>.json`

    await this.printStub({
      command: 'model export',
      args: { ref: args.ref },
      flags: { to: flags.to },
      wouldDo: [`read model ${args.ref}`, `write to ${destination}`]
    })
  }
}
