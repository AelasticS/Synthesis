import { StubCommand } from '../../base/stub-command.js'

export default class TxLs extends StubCommand {
  static override description = 'List installed transformations with versions.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    await this.printStub({
      command: 'tx ls',
      args: {},
      flags: {},
      wouldDo: ['enumerate installed transformations with versions']
    })
  }
}
