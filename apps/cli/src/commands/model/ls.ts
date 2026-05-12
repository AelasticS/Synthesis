import { Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ModelLs extends StubCommand {
  static override description = 'List all models, optionally filtered by namespace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --ns com.example.orders'
  ]

  static override flags = {
    ns: Flags.string({
      description: 'Filter models by namespace.'
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ModelLs)

    const filterStep = flags.ns ? `filter by namespace ${flags.ns}` : 'show all namespaces'

    await this.printStub({
      command: 'model ls',
      args: {},
      flags: { ns: flags.ns },
      wouldDo: ['enumerate model files', filterStep]
    })
  }
}
