import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getNamespacePath } from '../../config/index.js'
import { parseRef } from '../../types/refs.js'

export default class ModelExport extends BaseCommand {
  static override description = 'Write a model from the workspace to a file on disk.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/order-1',
    '<%= config.bin %> <%= command.id %> com.example/order-1 --to ./out/order.json'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to export.',
      required: true
    })
  }

  static override flags = {
    to: Flags.string({
      description: 'Destination file path.'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelExport)

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
    const sourcePath = join(nsPath, `${name}.json`)

    if (!existsSync(sourcePath)) {
      if (flags.json) {
        this.log(JSON.stringify({ error: `Model not found: ${args.ref}` }))
      } else {
        this.error(`Model not found: ${args.ref}`)
      }
      return
    }

    // Determine destination path
    const destPath = flags.to
      ? (flags.to.startsWith('/') ? flags.to : join(this.savedPwd, flags.to))
      : join(this.savedPwd, `${name}.json`)

    // Read source file
    const content = await readFile(sourcePath, 'utf-8')

    // Write to destination
    await writeFile(destPath, content, 'utf-8')

    if (flags.json) {
      this.log(JSON.stringify({ exported: args.ref, source: sourcePath, destination: destPath }))
    } else {
      this.log(`Exported ${args.ref} to ${destPath}`)
    }
  }
}
