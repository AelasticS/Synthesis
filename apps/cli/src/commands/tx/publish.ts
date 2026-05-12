import { StubCommand } from '../../base/stub-command.js'

export default class TxPublish extends StubCommand {
  static override description = 'Publish the transformation to npm.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.printStub({
      command: 'tx publish',
      args: {},
      flags: {},
      wouldDo: ['delegate to npm publish']
    })
  }
}
