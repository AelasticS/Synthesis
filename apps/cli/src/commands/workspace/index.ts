import { Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class Workspace extends StubCommand {
  static override description = 'Print or switch the active workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --set ~/other-workspace'
  ]

  static override flags = {
    set: Flags.string({
      description: 'Switch the active workspace to this path.'
    })
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Workspace)

    if (flags.set) {
      await this.printStub({
        command: 'workspace',
        args: {},
        flags: { set: flags.set },
        wouldDo: [
          `validate path ${flags.set} exists and is a workspace`,
          `update user config to point at ${flags.set}`
        ]
      })
    } else {
      await this.printStub({
        command: 'workspace',
        args: {},
        flags: {},
        wouldDo: [
          'read active workspace path from user config',
          'summarise namespaces, model count, installed tx'
        ]
      })
    }
  }
}
