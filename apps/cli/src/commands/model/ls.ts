import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'

export default class ModelLs extends BaseCommand {
  static override description = 'List all models in the current namespace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --ns com.example.orders'
  ]

  public async execute(): Promise<void> {
    const { flags } = await this.parse(ModelLs)

    // Check if namespace is set
    if (!this.workspaceConfig.currentNamespace) {
      if (flags.json) {
        this.log(JSON.stringify({ error: 'No namespace set. Use --ns or set a current namespace.' }))
      } else {
        this.error('No namespace set. Use --ns or set a current namespace.')
      }
      return
    }

    // Current directory is already the namespace path (set by BaseCommand)
    const cwd = process.cwd()

    if (!existsSync(cwd)) {
      if (flags.json) {
        this.log(JSON.stringify({ error: `Namespace directory does not exist: ${cwd}` }))
      } else {
        this.error(`Namespace directory does not exist: ${cwd}`)
      }
      return
    }

    const entries = await readdir(cwd, { withFileTypes: true })
    const jsonFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name.replace(/\.json$/, ''))

    if (flags.json) {
      this.log(JSON.stringify({ models: jsonFiles, namespace: this.workspaceConfig.currentNamespace }))
    } else {
      if (jsonFiles.length === 0) {
        this.log('No models found in current namespace.')
      } else {
        for (const name of jsonFiles) {
          this.log(name)
        }
      }
    }
  }
}
