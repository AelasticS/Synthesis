import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../base/stub-command.js'

export default class M2T extends StubCommand {
  static override description = 'Run a model-to-text transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/library --template eer-java --out ./src-gen'
  ]

  static override args = {
    model: Args.string({
      description: 'Model ref to transform.',
      required: true
    })
  }

  static override flags = {
    template: Flags.string({
      description: 'Path or installed name of the M2T template.',
      required: true
    }),
    out: Flags.string({
      description: 'Output directory on disk.',
      required: true
    }),
    'dry-run': Flags.boolean({
      description: 'Print the files that would be written, without writing them.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(M2T)

    const action = flags['dry-run'] ? 'list files (dry run)' : `write files to ${flags.out}`

    await this.printStub({
      command: 'm2t',
      args: { model: args.model },
      flags: { template: flags.template, out: flags.out, 'dry-run': flags['dry-run'] },
      wouldDo: [
        `resolve template ${flags.template}`,
        `render against model ${args.model}`,
        action
      ]
    })
  }
}
