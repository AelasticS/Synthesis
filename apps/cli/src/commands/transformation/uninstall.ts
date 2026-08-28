import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath, getTransformationsPath, saveConfig } from '../../config/index.js'
import { findPipelinesUsingTx } from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class TransformationUninstall extends BaseCommand {
  static override aliases = ['tx:uninstall']

  static override description = `Remove an installed transformation.

Refused while any saved pipeline lists the transformation as a step (running the pipeline would break); update those pipelines or delete them with 'synth pipeline rm' first, as there is no cascade. An invalid pipeline file still protects its steps: its step list is read best-effort, because repairing the file with 'synth pipeline edit' must stay possible.`

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name of the transformation to uninstall.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(TransformationUninstall)
    const txName = args.name
    const json = Boolean(flags.json)

    // 1. Existence first: uninstalling something that is not installed is
    // a missing resource (exit 3); no pipeline scan for a phantom.
    const configEntry = this.workspaceConfig.transformations[txName]
    const txPath = configEntry !== undefined ? configEntry.path : join(getTransformationsPath(this.workspaceConfig), txName)
    if (!existsSync(txPath)) {
      this.jsonAwareFail(
        json,
        `Transformation not found: ${txName}. See 'synth transformation ls'.`,
        EXIT_CODES.NOT_FOUND
      )
    }

    // 2. Deletion guard: uninstalling a step of a saved pipeline would
    // break the pipeline. The scan is lenient: an invalid pipeline file
    // still names its steps.
    const dependents = await findPipelinesUsingTx(getPipelinesPath(this.workspaceConfig), txName)
    if (dependents.length > 0) {
      this.jsonAwareFail(
        json,
        `Cannot uninstall '${txName}'; ${dependents.length} saved pipeline(s) use it as a step: ${dependents.join(', ')}. ` +
          `Update them or delete them with 'synth pipeline rm' first.`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    // 3. Remove the directory, then the config entry
    await rm(txPath, { recursive: true, force: true })
    if (configEntry) {
      delete this.workspaceConfig.transformations[txName]
      await saveConfig(this.workspaceConfig)
    }

    if (json) {
      this.log(
        JSON.stringify(
          {
            uninstalled: true,
            name: txName,
            path: txPath
          },
          null,
          2
        )
      )
      return
    }

    this.log(`Uninstalled transformation '${txName}' from ${txPath}`)
  }
}
