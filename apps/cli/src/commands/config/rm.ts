import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath, getPipelinesPath } from '../../config/index.js'
import {
  DanglingDependentsError,
  PipelineDependentsError,
  removalJson,
  removalLines,
  removeModelWithDependents
} from '../../models/remove.js'
import type { ModelRemoval } from '../../models/remove.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { ConfigModelResolveError, resolveConfigurationModel } from '../../tx/config-model.js'
import type { ResolvedConfigModel } from '../../tx/config-model.js'

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

    const modelsDir = getModelsPath(this.workspaceConfig)
    let resolved: ResolvedConfigModel
    try {
      resolved = await resolveConfigurationModel(modelsDir, args.ref)
    } catch (err) {
      if (err instanceof ConfigModelResolveError) {
        const hint = err.kind === 'wrong-kind' ? ` Use 'synth model rm' for general models.` : ''
        this.jsonAwareFail(json, `${err.message}${hint}`, err.exit)
      }
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    // Same semantics as model rm (dependency check, --cascade, pipeline guard)
    let removal: ModelRemoval
    try {
      removal = await removeModelWithDependents(
        modelsDir,
        resolved.ref,
        flags.cascade,
        getPipelinesPath(this.workspaceConfig)
      )
    } catch (err) {
      if (err instanceof DanglingDependentsError || err instanceof PipelineDependentsError) {
        this.jsonAwareFail(json, err.message, EXIT_CODES.VALIDATION_FAILURE)
      }
      throw err
    }

    if (json) {
      this.log(JSON.stringify(removalJson(resolved.ref, resolved.path, removal)))
    } else {
      for (const line of removalLines(removal)) {
        this.log(line)
      }
    }
  }
}
