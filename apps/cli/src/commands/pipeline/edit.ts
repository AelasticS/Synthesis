import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { pipelineFileExists, pipelinePath, readPipelineFile } from '../../pipelines/store.js'
import { openInEditor } from '../../support/editor.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { chainStructureProblems, resolveChainSteps } from '../../tx/chain.js'

export default class PipelineEdit extends BaseCommand {
  static override aliases = ['pl:edit']

  static override description = `Open a saved pipeline in $EDITOR.

After the editor closes, the file is validated like 'pipeline mk' validates a new pipeline: schema (process-only fields), every step installed, chain type compatibility. Every problem is reported as a warning ('pipeline run <name>' would refuse until they are fixed).`

  static override examples = ['<%= config.bin %> <%= command.id %> gen-sql']

  static override args = {
    name: Args.string({
      description: 'Name of the saved pipeline to edit.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(PipelineEdit)
    this.requireInitializedWorkspace(Boolean(flags.json))

    const pipelinesDir = getPipelinesPath(this.workspaceConfig)
    if (!pipelineFileExists(pipelinesDir, args.name)) {
      this.error(`Pipeline not found: ${args.name} (looked for ${pipelinePath(pipelinesDir, args.name)})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }
    await openInEditor(pipelinePath(pipelinesDir, args.name))

    // Re-validate what the editor left behind: the same static checks as
    // `pipeline mk`. Problems are warnings (the file stays as edited);
    // `pipeline run` is what enforces them.
    const problems: string[] = []
    const { pipeline, errors } = await readPipelineFile(pipelinesDir, args.name)
    problems.push(...errors)
    if (pipeline !== null) {
      try {
        problems.push(...chainStructureProblems(await resolveChainSteps(this.workspaceConfig, pipeline.steps)).map((problem) => problem.message))
      } catch (err) {
        problems.push(errorMessage(err))
      }
    }
    for (const problem of problems) {
      this.warn(`Pipeline '${args.name}': ${problem}`)
    }
    if (problems.length > 0) {
      this.warn(`'synth pipeline run ${args.name}' will refuse to run until the problems above are fixed.`)
    }
  }
}
