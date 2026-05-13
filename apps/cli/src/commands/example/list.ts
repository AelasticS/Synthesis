import { BaseCommand } from '../../base/base-command.js'
import { examplesRegistry } from '@synthesis/examples'

export default class ExampleList extends BaseCommand {
  static override description = 'List all available bundled examples.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json'
  ]

  public async execute(): Promise<void> {
    const { flags } = await this.parse(ExampleList)
    const runnables = examplesRegistry.list()

    if (flags.json) {
      this.log(
        JSON.stringify({
          examples: runnables.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description
          }))
        })
      )
      return
    }

    if (runnables.length === 0) {
      this.log('No examples registered.')
      return
    }

    const idWidth = Math.max(...runnables.map((r) => r.id.length))
    for (const r of runnables) {
      this.log(`  ${r.id.padEnd(idWidth)}  ${r.name}`)
    }
  }
}
