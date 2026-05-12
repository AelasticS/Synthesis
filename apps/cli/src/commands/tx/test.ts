import { StubCommand } from '../../base/stub-command.js'

export default class TxTest extends StubCommand {
  static override description = 'Run test fixtures against the built transformation.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    await this.printStub({
      command: 'tx test',
      args: {},
      flags: {},
      wouldDo: ['run test/ fixtures against built transformation']
    })
  }
}
