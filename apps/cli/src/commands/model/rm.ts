import { unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getNamespacePath } from '../../config/index.js'
import { parseRef } from '../../types/refs.js'

export default class ModelRm extends BaseCommand {
  static override description = 'Delete a model from the workspace.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/order-1']

  static override args = {
    ref: Args.string({
      description: 'Model ref to delete.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelRm)

    const parsed = parseRef(args.ref)
    if (!parsed) {
      if (flags.json) {
        this.log(JSON.stringify({ error: `Invalid ref format: ${args.ref}. Expected namespace/name.` }))
      } else {
        this.error(`Invalid ref format: ${args.ref}. Expected namespace/name.`)
      }
      return
    }

    const { namespace, name } = parsed
    const nsPath = getNamespacePath(this.workspaceConfig, namespace)
    const filePath = join(nsPath, `${name}.json`)

    if (!existsSync(filePath)) {
      if (flags.json) {
        this.log(JSON.stringify({ error: `Model not found: ${args.ref}` }))
      } else {
        this.error(`Model not found: ${args.ref}`)
      }
      return
    }

    await unlink(filePath)

    if (flags.json) {
      this.log(JSON.stringify({ deleted: args.ref, path: filePath }))
    } else {
      this.log(`Deleted ${args.ref}`)
    }
  }
}
