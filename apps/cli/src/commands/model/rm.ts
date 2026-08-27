import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import {
  findTransitiveDependents,
  formatDependencyTree,
  parseRef,
  refToModelPath
} from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelRm extends BaseCommand {
  static override description = 'Delete a model from the workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons',
    '<%= config.bin %> <%= command.id %> com.example/persons --cascade'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to delete.',
      required: true
    })
  }

  static override flags = {
    cascade: Flags.boolean({
      description: 'Also delete every model that transitively references this one.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelRm)
    const json = Boolean(flags.json)

    let ref: string
    try {
      const parsed = parseRef(args.ref)
      ref = `${parsed.namespace}/${parsed.name}`
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    const modelsDir = getModelsPath(this.workspaceConfig)
    const filePath = refToModelPath(modelsDir, ref)
    if (!existsSync(filePath)) {
      this.jsonAwareFail(json, `Model not found: ${ref}`, EXIT_CODES.NOT_FOUND)
    }

    // Deletion mirror of the import gate: the CLI never leaves dangling
    // references. Either nothing depends on the target, or the whole
    // reverse-dependency closure goes with it (--cascade).
    const { closure, edges } = await findTransitiveDependents(modelsDir, [ref])
    const tree = formatDependencyTree([ref], edges)

    if (closure.length > 0 && !flags.cascade) {
      this.jsonAwareFail(
        json,
        `Cannot remove ${ref} — ${closure.length} dependent model(s) would be left dangling:\n` +
          `${tree.join('\n')}\n` +
          'Remove or update them first, or pass --cascade to delete all of the above together.',
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    const deleted = [ref, ...closure]
    for (const target of deleted) {
      await unlink(refToModelPath(modelsDir, target))
    }

    if (flags.json) {
      this.log(
        JSON.stringify(
          closure.length > 0
            ? { deleted: ref, path: filePath, cascaded: closure }
            : { deleted: ref, path: filePath }
        )
      )
    } else {
      if (closure.length > 0) {
        this.log('Cascade delete of the dependency graph:')
        for (const line of tree) {
          this.log(`  ${line}`)
        }
      }
      for (const target of deleted) {
        this.log(`Deleted ${target}`)
      }
    }
  }
}
