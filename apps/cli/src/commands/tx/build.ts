import { StubCommand } from '../../base/stub-command.js'

export default class TxBuild extends StubCommand {
  static override description = 'Build the transformation in the current directory.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    await this.printStub({
      command: 'tx build',
      args: {},
      flags: {},
      wouldDo: [
        'compile src/ to dist/',
        'validate synth.json against schema',
        'confirm entry export',
        'verify variability issue ids match @VarPoint',
        'copy synth.json into dist/'
      ]
    })
  }
}
