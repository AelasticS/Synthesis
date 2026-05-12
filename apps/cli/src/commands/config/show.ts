import { Args } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { getConfigsPath } from '../../config/index.js'

export default class ConfigShow extends BaseCommand {
  static override description = 'Print the current value of every binding in a configuration.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/library.cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration ref to show.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ConfigShow)
    const configsPath = getConfigsPath(this.workspaceConfig)

    // Resolve the config file path
    const configFile = args.ref.endsWith('.json') ? args.ref : `${args.ref}.json`
    const configPath = join(configsPath, configFile)

    if (!existsSync(configPath)) {
      this.error(`Configuration not found: ${args.ref}`)
    }

    const content = await readFile(configPath, 'utf-8')

    try {
      const parsed = JSON.parse(content)
      this.log(JSON.stringify(parsed, null, 2))
    } catch {
      // If not valid JSON, just print raw content
      this.log(content)
    }
  }
}
