import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { loadPipeline, pipelinePath } from '../../pipelines/store.js'
import type { PipelineDefinition } from '../../pipelines/store.js'

export default class PipelineShow extends BaseCommand {
  static override aliases = ['pl:show']

  static override description = 'Show every field of a saved pipeline.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> gen-sql',
    '<%= config.bin %> <%= command.id %> gen-sql --json'
  ]

  static override args = {
    name: Args.string({
      description: 'Name of the saved pipeline to show.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(PipelineShow)
    const json = Boolean(flags.json)
    this.requireInitializedWorkspace(json)

    const pipelinesDir = getPipelinesPath(this.workspaceConfig)
    let pipeline: PipelineDefinition
    try {
      pipeline = await loadPipeline(pipelinesDir, args.name)
    } catch (err) {
      this.failFromExecuteError(json, err)
    }
    const path = pipelinePath(pipelinesDir, pipeline.name)

    if (json) {
      this.log(JSON.stringify({ ...pipeline, path }))
      return
    }

    this.log(`Name:         ${pipeline.name}`)
    this.log(`Path:         ${path}`)
    this.log(`Steps:        ${pipeline.steps.join(' -> ')}`)
    this.log(`Description:  ${pipeline.description === '' ? '(none)' : pipeline.description}`)
    this.log(`Created:      ${pipeline.createdAt === '' ? '(unknown)' : pipeline.createdAt}`)
    this.log(`Modified:     ${pipeline.modifiedAt === '' ? '(unknown)' : pipeline.modifiedAt}`)
    this.log('')
    this.log(`Run it with: synth pipeline run ${pipeline.name} --in <ref>`)
  }
}
