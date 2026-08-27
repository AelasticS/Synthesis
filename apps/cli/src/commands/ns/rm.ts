import { Args, Flags } from '@oclif/core'
import { readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath, saveConfig } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import {
  findTransitiveDependents,
  formatDependencyTree,
  listModels,
  namespaceToDir,
  refToModelPath
} from '../../support/refs.js'

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
    }),
    cascade: Flags.boolean({
      description:
        'Also delete every model outside the namespace that transitively references a model inside it (implies --force).',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(NsRm)
    const json = Boolean(flags.json)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      this.jsonAwareFail(json, 'Workspace not initialized. Run `synth init` first.', EXIT_CODES.WORKSPACE_ERROR)
    }

    let nsPath: string
    try {
      // com.example -> <models>/com/example
      nsPath = namespaceToDir(modelsPath, args.namespace)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    if (!existsSync(nsPath)) {
      this.jsonAwareFail(json, `Namespace '${args.namespace}' does not exist.`, EXIT_CODES.NOT_FOUND)
    }

    // Deletion mirror of the import gate, one level up: models OUTSIDE the
    // namespace that transitively reference models inside it would be left
    // dangling. The CLI never does that silently — without --cascade the
    // removal is refused; with it, the whole external closure goes too.
    const inside = await listModels(modelsPath, args.namespace)
    const insideRefs = new Set(inside.map((m) => m.ref))
    const { closure, edges } = await findTransitiveDependents(modelsPath, insideRefs)

    if (closure.length > 0 && !flags.cascade) {
      const tree = formatDependencyTree(insideRefs, edges).join('\n')
      this.jsonAwareFail(
        json,
        `Cannot remove namespace '${args.namespace}' — ${closure.length} model(s) outside it ` +
          `reference models inside it:\n${tree}\n` +
          'Remove or update them first, or pass --cascade to delete all of the above together.',
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    // Refuse when the directory contains any file at any depth (models,
    // notes, hidden files, ...); only a tree of empty directories is
    // removable without --force. --cascade implies --force.
    if (!flags.force && !flags.cascade && (await hasAnyFile(nsPath))) {
      this.jsonAwareFail(
        json,
        `Namespace '${args.namespace}' is not empty. Use --force to remove it anyway.`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    // Cascade: delete the external dependent models first, then the tree
    for (const dependent of closure) {
      await rm(refToModelPath(modelsPath, dependent), { force: true })
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
      this.log(
        JSON.stringify(
          closure.length > 0
            ? { removed: true, namespace: args.namespace, cascaded: closure }
            : { removed: true, namespace: args.namespace }
        )
      )
    } else {
      this.log(`Removed namespace: ${args.namespace}`)
      for (const dependent of closure) {
        this.log(`Deleted ${dependent} (cascade)`)
      }
    }
  }
}
