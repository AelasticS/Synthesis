import { Args } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import { saveConfig, getModelsPath } from '../config/index.js'
import { errorMessage } from '../support/errors.js'
import { namespaceExists } from '../support/refs.js'

export default class Cd extends BaseCommand {
  static override description = 'Change or display the current namespace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> com.example.orders'
  ]

  static override args = {
    namespace: Args.string({
      description: 'Namespace to switch to. If omitted, shows current namespace.',
      required: false
    })
  }

  public async execute(): Promise<void> {
    const { args } = await this.parse(Cd)

    if (!args.namespace) {
      // Show current namespace
      if (this.workspaceConfig.currentNamespace) {
        this.log(this.workspaceConfig.currentNamespace)
      } else {
        this.log('No namespace set.')
      }
      return
    }

    // Verify the namespace has a directory in the nested layout
    let exists: boolean
    try {
      exists = namespaceExists(getModelsPath(this.workspaceConfig), args.namespace)
    } catch (err) {
      this.error(errorMessage(err))
    }
    if (!exists) {
      this.error(`Namespace '${args.namespace}' does not exist. Use 'synth ns mk ${args.namespace}' to create it.`)
    }

    // Update config with new namespace
    this.workspaceConfig.currentNamespace = args.namespace
    await saveConfig(this.workspaceConfig)

    this.log(`Switched to namespace: ${args.namespace}`)
  }
}
