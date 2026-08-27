import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { parseRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelRm extends BaseCommand {
  static override description = 'Delete a model from the workspace.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/persons']

  static override args = {
    ref: Args.string({
      description: 'Model ref to delete.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelRm)
    const json = Boolean(flags.json)

    let ref: string
    try {
      const parsed = parseRef(args.ref)
      ref = `${parsed.namespace}/${parsed.name}`
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    const filePath = refToModelPath(getModelsPath(this.workspaceConfig), ref)
    if (!existsSync(filePath)) {
      this.jsonAwareFail(json, `Model not found: ${ref}`, EXIT_CODES.NOT_FOUND)
    }

    await unlink(filePath)

    if (flags.json) {
      this.log(JSON.stringify({ deleted: ref, path: filePath }))
    } else {
      this.log(`Deleted ${ref}`)
    }
  }
}
