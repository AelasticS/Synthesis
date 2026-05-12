import { Args, Flags } from '@oclif/core'
import { readdir, rmdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'
import { getNamespacePath, getModelsPath, saveConfig } from '../../config/index.js'

export default class NsRm extends BaseCommand {
  static override description = 'Remove a namespace (must be empty unless --force).'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example.orders',
    '<%= config.bin %> <%= command.id %> com.example.orders --force'
  ]

  static override args = {
    namespace: Args.string({
      description: 'Name of the namespace to remove.',
      required: true
    })
  }

  static override flags = {
    force: Flags.boolean({
      description: 'Remove even if the namespace contains models.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(NsRm)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      this.error('Workspace not initialized. Run `synth init` first.')
    }

    const nsPath = getNamespacePath(this.workspaceConfig, args.namespace)

    if (!existsSync(nsPath)) {
      if (flags.json) {
        this.log(JSON.stringify({ removed: false, namespace: args.namespace, error: 'not found' }))
      } else {
        this.log(`Namespace '${args.namespace}' does not exist.`)
      }
      return
    }

    // Check if namespace is empty
    const entries = await readdir(nsPath)
    if (entries.length > 0 && !flags.force) {
      if (flags.json) {
        this.log(
          JSON.stringify({
            removed: false,
            namespace: args.namespace,
            error: 'not empty',
            hint: 'use --force to remove non-empty namespace'
          })
        )
      } else {
        this.error(
          `Namespace '${args.namespace}' is not empty. Use --force to remove it anyway.`
        )
      }
      return
    }

    // Remove the namespace
    if (entries.length > 0) {
      await rm(nsPath, { recursive: true })
    } else {
      await rmdir(nsPath)
    }

    // If this was the current namespace, clear it
    if (this.workspaceConfig.currentNamespace === args.namespace) {
      this.workspaceConfig.currentNamespace = undefined
      await saveConfig(this.workspaceConfig)
    }

    if (flags.json) {
      this.log(JSON.stringify({ removed: true, namespace: args.namespace }))
    } else {
      this.log(`Removed namespace: ${args.namespace}`)
    }
  }
}
