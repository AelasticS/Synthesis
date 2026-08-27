import { spawn } from 'node:child_process'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath } from '../../config/index.js'
import { pipelineFileExists, pipelinePath, readPipelineFile } from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class PipelineEdit extends BaseCommand {
  static override description = `Open a saved pipeline in $EDITOR.

After the editor closes, the file is re-parsed and validated against the pipeline schema; every problem is reported as a warning ('run <name>' would refuse to replay until they are fixed).`

  static override examples = ['<%= config.bin %> <%= command.id %> gen-sql']

  static override args = {
    name: Args.string({
      description: 'Name of the saved pipeline to edit.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(PipelineEdit)

    const pipelinesDir = getPipelinesPath(this.workspaceConfig)
    if (!pipelineFileExists(pipelinesDir, args.name)) {
      this.error(`Pipeline not found: ${args.name} (looked for ${pipelinePath(pipelinesDir, args.name)})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }
    const path = pipelinePath(pipelinesDir, args.name)

    const editor = process.env.EDITOR || 'vi'
    await new Promise<void>((resolve, reject) => {
      const child = spawn(editor, [path], {
        stdio: 'inherit'
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Editor exited with code ${code}`))
        }
      })

      child.on('error', (err) => {
        reject(new Error(`Failed to spawn editor: ${err.message}`))
      })
    })

    // Re-parse + validate what the editor left behind; problems are
    // warnings (the file stays as edited), replay is what enforces them.
    const { errors } = await readPipelineFile(pipelinesDir, args.name)
    for (const problem of errors) {
      this.warn(`Pipeline '${args.name}': ${problem}`)
    }
    if (errors.length > 0) {
      this.warn(`'synth run ${args.name}' will refuse to replay until the problems above are fixed.`)
    }
  }
}
