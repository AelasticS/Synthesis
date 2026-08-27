import { unlink } from 'node:fs/promises'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { pipelineFileExists, pipelinePath } from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class PipelineRm extends BaseCommand {
  static override description = `Delete a saved pipeline.

A pipeline is a saved invocation, not a model: nothing references it, so deletion needs no dependency check and no --cascade. The models and transformations it named stay untouched.`

  static override examples = ['<%= config.bin %> <%= command.id %> gen-sql']

  static override args = {
    name: Args.string({
      description: 'Name of the saved pipeline to delete.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(PipelineRm)
    const json = Boolean(flags.json)

    const pipelinesDir = getPipelinesPath(this.workspaceConfig)
    if (!pipelineFileExists(pipelinesDir, args.name)) {
      this.jsonAwareFail(
        json,
        `Pipeline not found: ${args.name} (looked for ${pipelinePath(pipelinesDir, args.name)})`,
        EXIT_CODES.NOT_FOUND
      )
    }
    const path = pipelinePath(pipelinesDir, args.name)
    await unlink(path)

    if (json) {
      this.log(JSON.stringify({ deleted: args.name, path }))
      return
    }
    this.log(`Deleted pipeline ${args.name}`)
  }
}
