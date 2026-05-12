import { StubCommand } from '../../base/stub-command.js'

export default class TxPack extends StubCommand {
  static override description = 'Produce a distributable tarball.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    await this.printStub({
      command: 'tx pack',
      args: {},
      flags: {},
      wouldDo: [
        'produce <name>-<version>.tgz containing dist/, synth.json, package.json, README.md'
      ]
    })
  }
}
