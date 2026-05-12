import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ModelImport extends StubCommand {
  static override description = 'Copy a JSON file from disk into the workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> ./examples/order.json',
    '<%= config.bin %> <%= command.id %> ./examples/order.json --as com.example/order-1'
  ]

  static override args = {
    file: Args.string({
      description: 'Path to the JSON file to import.',
      required: true
    })
  }

  static override flags = {
    as: Flags.string({
      description: 'Ref to assign to the imported model.'
    })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ModelImport)

    const refTarget = flags.as ?? '<derived from file>'

    await this.printStub({
      command: 'model import',
      args: { file: args.file },
      flags: { as: flags.as },
      wouldDo: [`read ${args.file}`, `copy into <workspace>/models/${refTarget}`]
    })
  }
}
