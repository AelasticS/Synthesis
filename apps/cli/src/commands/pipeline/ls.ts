import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { listPipelines } from '../../pipelines/store.js'

interface PipelineRow {
  name: string
  steps: string[]
  in: string
}

export default class PipelineLs extends BaseCommand {
  static override description =
    "List saved pipelines (replayable 'run' invocations stored under pipelines/ in the workspace)."

  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json']

  public async execute(): Promise<void> {
    const { flags } = await this.parse(PipelineLs)
    const json = Boolean(flags.json)

    const entries = await listPipelines(getPipelinesPath(this.workspaceConfig))
    const rows: PipelineRow[] = []
    for (const entry of entries) {
      if (entry.pipeline === null) {
        // Broken files stay visible (stderr) without failing the listing;
        // doctor reports the same problems.
        this.warn(`Pipeline '${entry.name}' is invalid and not listed: ${entry.errors.join('; ')}`)
        continue
      }
      rows.push({ name: entry.name, steps: entry.pipeline.steps, in: entry.pipeline.in })
    }

    if (json) {
      this.log(JSON.stringify(rows))
      return
    }

    if (rows.length === 0) {
      this.log("No pipelines saved. Save one with: synth run <tx...> ... --save-as <name>")
      return
    }

    const width = Math.max(...rows.map((row) => row.name.length))
    for (const row of rows) {
      this.log(`${row.name.padEnd(width)}  ${row.steps.join(' -> ')}  on ${row.in}`)
    }
  }
}
