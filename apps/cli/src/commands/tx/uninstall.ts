import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getTransformationsPath, saveConfig } from '../../config/index.js'

export default class TxUninstall extends BaseCommand {
  static override description = 'Remove an installed transformation.'

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
