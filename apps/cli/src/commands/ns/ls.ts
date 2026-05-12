import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'

export default class NsLs extends BaseCommand {
  static override description = 'List all namespaces in the workspace.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    const { flags } = await this.parse(NsLs)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      if (flags.json) {
        this.log(JSON.stringify({ namespaces: [], error: 'Workspace not initialized' }))
      } else {
        this.log('Workspace not initialized. Run `synth init` first.')
      }
      return
    }

    const entries = await readdir(modelsPath, { withFileTypes: true })
    const namespaces = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    if (flags.json) {
      this.log(JSON.stringify({ namespaces }))
      return
    }

    if (namespaces.length === 0) {
      this.log('No namespaces found. Use `synth ns mk <name>` to create one.')
      return
    }

    const current = this.workspaceConfig.currentNamespace
    for (const ns of namespaces) {
      if (ns === current) {
        this.log(`* ${ns}`)
      } else {
        this.log(`  ${ns}`)
      }
    }
  }
}
