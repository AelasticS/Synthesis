import { Args } from '@oclif/core'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { getConfigsPath } from '../../config/index.js'

export default class ConfigEdit extends BaseCommand {
  static override description = 'Open the configuration in $EDITOR.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/library.cfg']

  static override args = {
    ref: Args.string({
      description: 'Configuration ref to edit.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(ConfigEdit)
    const configsPath = getConfigsPath(this.workspaceConfig)

    // Resolve the config file path
    const configFile = args.ref.endsWith('.json') ? args.ref : `${args.ref}.json`
    const configPath = join(configsPath, configFile)

    if (!existsSync(configPath)) {
      this.error(`Configuration not found: ${args.ref}`)
    }

    const editor = process.env.EDITOR || 'vi'

    return new Promise((resolve, reject) => {
      const child = spawn(editor, [configPath], {
        stdio: 'inherit'
      })

      child.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Editor exited with code ${code}`))
        }
      })

      child.on('error', err => {
        reject(new Error(`Failed to spawn editor: ${err.message}`))
      })
    })
  }
}
