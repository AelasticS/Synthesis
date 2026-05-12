import { Args } from '@oclif/core'
import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { getConfigsPath } from '../../config/index.js'

export default class ConfigRm extends BaseCommand {
  static override description = 'Delete a configuration.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/library.cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration ref to delete.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ConfigRm)
    const configsPath = getConfigsPath(this.workspaceConfig)

    // Resolve the config file path
    const configFile = args.ref.endsWith('.json') ? args.ref : `${args.ref}.json`
    const configPath = join(configsPath, configFile)

    if (!existsSync(configPath)) {
      this.error(`Configuration not found: ${args.ref}`)
    }

    await unlink(configPath)
    this.log(`Deleted configuration: ${args.ref}`)
  }
}
