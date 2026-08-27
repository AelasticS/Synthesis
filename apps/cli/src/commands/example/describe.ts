import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { examplesRegistry } from '@synthesis/examples'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ExampleDescribe extends BaseCommand {
  static override description = 'Show full details of a single example.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-rel-small',
    '<%= config.bin %> <%= command.id %> eer-to-rel-to-text --json'
  ]

  static override args = {
    id: Args.string({
      description: 'Example identifier (use `synth example ls` to see available ids).',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ExampleDescribe)
    const r = examplesRegistry.get(args.id)

    if (!r) {
      this.jsonAwareFail(
        Boolean(flags.json),
        `No example with id "${args.id}". Run \`synth example ls\` to see available ids.`,
        EXIT_CODES.NOT_FOUND
      )
    }

    if (flags.json) {
      this.log(
        JSON.stringify({
          id: r.id,
          name: r.name,
          description: r.description
        })
      )
      return
    }

    this.log(`id:          ${r.id}`)
    this.log(`name:        ${r.name}`)
    this.log(`description: ${r.description}`)
  }
}
