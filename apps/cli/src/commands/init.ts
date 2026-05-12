import { Flags } from '@oclif/core'

import { StubCommand } from '../base/stub-command.js'

export default class Init extends StubCommand {
  static override description = 'Create a new Synthesis workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --path ~/my-workspace'
  ]

  static override flags = {
    path: Flags.string({
      description: 'Directory to create the workspace in.',
      default: '~/.synth'
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init)

    await this.printStub({
      command: 'init',
      args: {},
      flags: { path: flags.path },
      wouldDo: [
        `create workspace directory at ${flags.path}`,
        'write config.json',
        'scaffold metamodels/, models/, tx/, configs/ subfolders'
      ]
    })
  }
}
