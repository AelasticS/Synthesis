import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { openInEditor } from '../../support/editor.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { ConfigModelResolveError, resolveConfigurationModel } from '../../tx/config-model.js'
import type { ResolvedConfigModel } from '../../tx/config-model.js'

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

    let resolved: ResolvedConfigModel
    try {
      resolved = await resolveConfigurationModel(getModelsPath(this.workspaceConfig), args.ref)
    } catch (err) {
      if (err instanceof ConfigModelResolveError) {
        this.error(err.message, { exit: err.exit })
      }
      this.error(errorMessage(err), { exit: EXIT_CODES.FAILURE })
    }
    await openInEditor(resolved.path)
  }
}
