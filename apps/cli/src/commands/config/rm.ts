import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader } from '../../models/header.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import ModelRm from '../model/rm.js'

export default class ConfigRm extends BaseCommand {
  static override description = `Delete a configuration model from the workspace.

Configuration models live in the models tree, so removal has 'model rm' semantics (dependency check, --cascade); this command additionally refuses refs that are not configuration models.`

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/persons-cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration model ref to delete.',
      required: true
    })
  }

  static override flags = {
    cascade: Flags.boolean({
      description: 'Also delete every model that transitively references this one.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ConfigRm)
    const json = Boolean(flags.json)

    let ref: string
    try {
      ref = normalizeRef(args.ref)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }
    const modelPath = refToModelPath(getModelsPath(this.workspaceConfig), ref)
    if (!existsSync(modelPath)) {
      this.jsonAwareFail(json, `Configuration model not found: ${ref} (looked for ${modelPath})`, EXIT_CODES.NOT_FOUND)
    }
    const { header } = parseSynthHeader(await readFile(modelPath, 'utf-8'))
    if (header === null || header.kind !== 'configuration-model') {
      this.jsonAwareFail(
        json,
        `${ref} is not a configuration model${header === null ? ' (no $synth header)' : ` (header kind '${header.kind}')`}; use 'synth model rm' for general models.`,
        EXIT_CODES.FAILURE
      )
    }

    // Same semantics as model rm (dependency check, --cascade): delegate
    await ModelRm.run(this.argv, this.config)
  }
}
