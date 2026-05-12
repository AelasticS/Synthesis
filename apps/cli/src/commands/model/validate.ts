import { Args, Flags } from '@oclif/core'

import { StubCommand } from '../../base/stub-command.js'

export default class ModelValidate extends StubCommand {
  static override description = 'Check the model against its metamodel.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/order-1',
    '<%= config.bin %> <%= command.id %> com.example/order-1 --against @aelastics/order-metamodel'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to validate.',
      required: true
    })
  }

  static override flags = {
    against: Flags.string({
      description: 'Metamodel to validate against (defaults to model header).'
    })
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ModelValidate)

    const metamodel = flags.against ?? '<from model header>'

    await this.printStub({
      command: 'model validate',
      args: { ref: args.ref },
      flags: { against: flags.against },
      wouldDo: [
        `load model ${args.ref}`,
        `resolve metamodel ${metamodel}`,
        'run validator, report errors'
      ]
    })
  }
}
