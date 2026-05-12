import { Args } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class TxInstall extends StubCommand {
  static override description = 'Install a transformation from npm, git, or local path.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> @aelastics/eer-to-relational',
    '<%= config.bin %> <%= command.id %> git+https://github.com/user/tx.git',
    '<%= config.bin %> <%= command.id %> ./my-transformation',
    '<%= config.bin %> <%= command.id %> ./eer-to-relational-1.0.0.tgz'
  ]

  static override args = {
    package: Args.string({
      description: 'Package spec: npm name, git URL, local directory, or tarball.',
      required: true
    })
  }

  public async run(): Promise<void> {
    const { args } = await this.parse(TxInstall)

    await this.printStub({
      command: 'tx install',
      args: { package: args.package },
      flags: {},
      wouldDo: [
        `resolve ${args.package} kind`,
        'fetch/clone/copy',
        'install into <workspace>/tx/<name>/',
        'prompt for missing metamodels'
      ]
    })
  }
}
