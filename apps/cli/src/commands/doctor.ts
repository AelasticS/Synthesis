import { StubCommand } from '../base/stub-command.js'

export default class Doctor extends StubCommand {
  static override description = 'Check workspace integrity: missing files, broken references.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    await this.printStub({
      command: 'doctor',
      args: {},
      flags: {},
      wouldDo: ['check workspace integrity', 'report missing files and broken refs']
    })
  }
}
