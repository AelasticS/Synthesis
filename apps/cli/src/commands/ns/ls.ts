import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { listNamespaces } from '../../support/refs.js'

export default class NsLs extends BaseCommand {
  static override description = 'List all namespaces in the workspace.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    const { flags } = await this.parse(NsLs)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      this.jsonAwareFail(
        Boolean(flags.json),
        'Workspace not initialized. Run `synth init` first.',
        EXIT_CODES.WORKSPACE_ERROR
      )
    }

    // Nested dirs read as dotted namespaces (com/example -> com.example);
    // dot-named flat dirs are unaddressable and skipped (`doctor` reports them).
    const namespaces = await listNamespaces(modelsPath)

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
