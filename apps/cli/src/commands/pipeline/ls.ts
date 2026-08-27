import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { listPipelines } from '../../pipelines/store.js'

interface PipelineRow {
  name: string
  steps: string[]
  description: string
}

export default class PipelineLs extends BaseCommand {
  static override aliases = ['pl:ls']

  static override description =
    'List saved pipelines (named transformation chains stored under pipelines/ in the workspace).'

  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json']

  public async execute(): Promise<void> {
    const { flags } = await this.parse(PipelineLs)
    const json = Boolean(flags.json)
    this.requireInitializedWorkspace(json)

    const entries = await listPipelines(getPipelinesPath(this.workspaceConfig))
    const rows: PipelineRow[] = []
    for (const entry of entries) {
      if (entry.pipeline === null) {
        // Broken files stay visible (stderr) without failing the listing;
        // doctor reports the same problems.
        this.warn(`Pipeline '${entry.name}' is invalid and not listed: ${entry.errors.join('; ')}`)
        continue
      }
      rows.push({ name: entry.name, steps: entry.pipeline.steps, description: entry.pipeline.description })
    }

    if (json) {
      this.log(JSON.stringify(rows))
      return
    }

    if (rows.length === 0) {
      this.log('No pipelines saved. Create one with: synth pipeline mk <name> <transformation...>')
      return
    }

    const width = Math.max(...rows.map((row) => row.name.length))
    for (const row of rows) {
      const description = row.description === '' ? '' : `  # ${row.description}`
      this.log(`${row.name.padEnd(width)}  ${row.steps.join(' -> ')}${description}`)
    }
  }
}
