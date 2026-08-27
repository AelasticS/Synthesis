import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { loadPipeline, PipelineError, pipelinePath } from '../../pipelines/store.js'
import type { PipelineDefinition } from '../../pipelines/store.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class PipelineShow extends BaseCommand {
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

    const pipelinesDir = getPipelinesPath(this.workspaceConfig)
    let pipeline: PipelineDefinition
    try {
      pipeline = await loadPipeline(pipelinesDir, args.name)
    } catch (err) {
      const exit = err instanceof PipelineError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    const path = pipelinePath(pipelinesDir, pipeline.name)

    if (json) {
      this.log(JSON.stringify({ ...pipeline, path }))
      return
    }

    this.log(`Name:         ${pipeline.name}`)
    this.log(`Path:         ${path}`)
    this.log(`Steps:        ${pipeline.steps.join(' -> ')}`)
    this.log(`In:           ${pipeline.in}`)
    if (pipeline.out !== undefined) {
      this.log(`Out:          ${pipeline.out}`)
    }
    if (pipeline.outDir !== undefined) {
      this.log(`Out dir:      ${pipeline.outDir}`)
    }
    if (pipeline.config !== undefined) {
      this.log(`Config:       ${pipeline.config}`)
    }
    this.log(`Consents:     default-configs ${pipeline.defaultConfigs === true ? 'yes' : 'no'}, keep-intermediates ${pipeline.keepIntermediates === true ? 'yes' : 'no'}`)
    this.log(`Description:  ${pipeline.description === '' ? '(none)' : pipeline.description}`)
    this.log(`Created:      ${pipeline.createdAt === '' ? '(unknown)' : pipeline.createdAt}`)
    this.log(`Modified:     ${pipeline.modifiedAt === '' ? '(unknown)' : pipeline.modifiedAt}`)
    this.log('')
    this.log(`Replay with: synth run ${pipeline.name} (invocation flags override the saved values)`)
  }
}
