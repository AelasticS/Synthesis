import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader } from '../../models/header.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ConfigEdit extends BaseCommand {
  static override description = `Open a configuration model in $EDITOR.

After editing, 'synth model validate <ref> --tx <name>' checks that the file still renders against its transformation's context.`

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/persons-cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration model ref to edit.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ConfigEdit)

    let ref: string
    try {
      ref = normalizeRef(args.ref)
    } catch (err) {
      this.error(errorMessage(err), { exit: EXIT_CODES.FAILURE })
    }
    const modelPath = refToModelPath(getModelsPath(this.workspaceConfig), ref)
    if (!existsSync(modelPath)) {
      this.error(`Configuration model not found: ${ref} (looked for ${modelPath})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }
    const { header } = parseSynthHeader(await readFile(modelPath, 'utf-8'))
    if (header !== null && header.kind !== 'configuration-model') {
      this.error(
        `${ref} is not a configuration model (header kind '${header.kind}').`,
        { exit: EXIT_CODES.FAILURE }
      )
    }

    const editor = process.env.EDITOR || 'vi'

    return new Promise((resolve, reject) => {
      const child = spawn(editor, [modelPath], {
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
  }
}
