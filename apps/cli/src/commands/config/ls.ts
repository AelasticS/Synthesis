import { Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ConfigLs extends StubCommand {
  static override description = 'List configurations, optionally filtered by transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --for eer-to-relational'
  ]

  static override flags = {
    for: Flags.string({
      description: 'Filter configurations by transformation name.'
    })
  }

  public async execute(): Promise<void> {
    const { flags } = await this.parse(ConfigLs)

    const filterStep = flags.for ? `filter by transformation ${flags.for}` : 'show all'

    await this.printStub({
      command: 'config ls',
      args: {},
      flags: { for: flags.for },
      wouldDo: ['enumerate configurations', filterStep]
    })
  }
}
