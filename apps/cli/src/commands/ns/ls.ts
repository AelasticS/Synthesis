import { StubCommand } from '../../base/stub-command.js'

export default class NsLs extends StubCommand {
  static override description = 'List all namespaces in the workspace.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    await this.printStub({
      command: 'ns ls',
      args: {},
      flags: {},
      wouldDo: [
        'enumerate folders under <workspace>/models/',
        'print one namespace per line'
      ]
    })
  }
}
