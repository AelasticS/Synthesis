import { Flags } from '@oclif/core'
import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'
import { getConfigsPath } from '../../config/index.js'

export default class ConfigLs extends BaseCommand {
  static override description = 'List configurations, optionally filtered by transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --for eer-to-relational'
  ]

  static override flags = {
    for: Flags.string({
      description: 'Filter configurations by transformation name.'
    })
  }

  public async execute(): Promise<void> {
    const { flags } = await this.parse(ConfigLs)
    const configsPath = getConfigsPath(this.workspaceConfig)

    if (!existsSync(configsPath)) {
      this.log('No configurations found.')
      return
    }

    const entries = await readdir(configsPath, { withFileTypes: true })
    const configFiles = entries
      .filter(entry => entry.isFile())
      .filter(entry => entry.name.endsWith('.json') || entry.name.endsWith('.cfg.json'))
      .map(entry => entry.name)

    // Filter by transformation if --for flag provided
    const filteredFiles = flags.for
      ? configFiles.filter(file => file.includes(flags.for!))
      : configFiles

    if (filteredFiles.length === 0) {
      if (flags.for) {
        this.log(`No configurations found for transformation: ${flags.for}`)
      } else {
        this.log('No configurations found.')
      }
      return
    }

    for (const file of filteredFiles) {
      this.log(file)
    }
  }
}
