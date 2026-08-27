import { Args, Flags } from '@oclif/core'
import { readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath, saveConfig } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { namespaceToDir } from '../../support/refs.js'

// Data-loss guard: any file at any depth (hidden files and non-.tsx
// included) counts as content; empty (sub)directories do not. Early-exits
// on the first file found. An unreadable directory counts as content so
// nothing is deleted when emptiness cannot be verified.
async function hasAnyFile(dir: string): Promise<boolean> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return true
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (await hasAnyFile(join(dir, entry.name))) {
        return true
      }
    } else {
      return true
    }
  }
  return false
}

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
      description: 'Remove even if the namespace contains files.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(NsRm)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      this.error('Workspace not initialized. Run `synth init` first.')
    }

    let nsPath: string
    try {
      // com.example -> <models>/com/example
      nsPath = namespaceToDir(modelsPath, args.namespace)
    } catch (err) {
      this.error(errorMessage(err))
    }

    if (!existsSync(nsPath)) {
      if (flags.json) {
        this.log(JSON.stringify({ removed: false, namespace: args.namespace, error: 'not found' }))
      } else {
        this.log(`Namespace '${args.namespace}' does not exist.`)
      }
      return
    }

    // Refuse when the directory contains any file at any depth (models,
    // notes, hidden files, ...); only a tree of empty directories is
    // removable without --force
    if (!flags.force && (await hasAnyFile(nsPath))) {
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

    // Remove the namespace (with any sub-namespaces)
    await rm(nsPath, { recursive: true })

    // If this or one of its sub-namespaces was the current namespace, clear it
    const current = this.workspaceConfig.currentNamespace
    if (current !== undefined && (current === args.namespace || current.startsWith(`${args.namespace}.`))) {
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
