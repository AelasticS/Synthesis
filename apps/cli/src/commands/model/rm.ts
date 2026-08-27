import { existsSync } from 'node:fs'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import {
  DanglingDependentsError,
  removalJson,
  removalLines,
  removeModelWithDependents
} from '../../models/remove.js'
import type { ModelRemoval } from '../../models/remove.js'
import { errorMessage } from '../../support/errors.js'
import { parseRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelRm extends BaseCommand {
  static override description = 'Delete a model from the workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons',
    '<%= config.bin %> <%= command.id %> com.example/persons --cascade'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to delete.',
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
    const { args, flags } = await this.parse(ModelRm)
    const json = Boolean(flags.json)

    let ref: string
    try {
      const parsed = parseRef(args.ref)
      ref = `${parsed.namespace}/${parsed.name}`
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    const modelsDir = getModelsPath(this.workspaceConfig)
    const filePath = refToModelPath(modelsDir, ref)
    if (!existsSync(filePath)) {
      this.jsonAwareFail(json, `Model not found: ${ref}`, EXIT_CODES.NOT_FOUND)
    }

    // Deletion mirror of the import gate: the CLI never leaves dangling
    // references. Either nothing depends on the target, or the whole
    // reverse-dependency closure goes with it (--cascade).
    let removal: ModelRemoval
    try {
      removal = await removeModelWithDependents(modelsDir, ref, flags.cascade)
    } catch (err) {
      if (err instanceof DanglingDependentsError) {
        this.jsonAwareFail(json, err.message, EXIT_CODES.VALIDATION_FAILURE)
      }
      throw err
    }

    if (flags.json) {
      this.log(JSON.stringify(removalJson(ref, filePath, removal)))
    } else {
      for (const line of removalLines(removal)) {
        this.log(line)
      }
    }
  }
}
