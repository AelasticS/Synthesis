import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getPipelinesPath, getTransformationsPath, saveConfig } from '../../config/index.js'
import { findPipelinesUsingTx } from '../../pipelines/store.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class TxUninstall extends BaseCommand {
  static override description = `Remove an installed transformation.

Refused while any saved pipeline lists the transformation as a step (a replay would break); update those pipelines or delete them with 'synth pipeline rm' first — there is no cascade.`

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name of the transformation to uninstall.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(TxUninstall)
    const txName = args.name
    const json = Boolean(flags.json)

    // Deletion guard, mirroring model removal: uninstalling a step of a
    // saved pipeline would leave the pipeline dangling.
    const dependents = await findPipelinesUsingTx(getPipelinesPath(this.workspaceConfig), txName)
    if (dependents.length > 0) {
      this.jsonAwareFail(
        json,
        `Cannot uninstall '${txName}' — ${dependents.length} saved pipeline(s) use it as a step: ${dependents.join(', ')}. ` +
          `Update them or delete them with 'synth pipeline rm' first.`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    // Check if it's in config
    const configEntry = this.workspaceConfig.transformations[txName]
    let txPath: string

    if (configEntry) {
      txPath = configEntry.path
    } else {
      // Check in transformations directory
      txPath = join(getTransformationsPath(this.workspaceConfig), txName)
    }

    if (!existsSync(txPath)) {
      this.error(`Transformation '${txName}' not found.`)
    }

    // Remove the directory
    await rm(txPath, { recursive: true, force: true })

    // Remove from config if present
    if (configEntry) {
      delete this.workspaceConfig.transformations[txName]
      await saveConfig(this.workspaceConfig)
    }

    if (flags.json) {
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
