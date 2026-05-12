import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getNamespacePath } from '../../config/index.js'
import { parseRef } from '../../types/refs.js'

export default class ModelShow extends BaseCommand {
  static override description = 'Read and display a model file.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/order-1']

  static override args = {
    ref: Args.string({
      description: 'Model ref (namespace/name).',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelShow)

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

    const content = await readFile(filePath, 'utf-8')

    if (flags.json) {
      // Parse and re-stringify to ensure valid JSON output
      try {
        const parsed = JSON.parse(content)
        this.log(JSON.stringify({ ref: args.ref, model: parsed }))
      } catch {
        this.log(JSON.stringify({ error: `Invalid JSON in model file: ${filePath}` }))
      }
    } else {
      // Pretty print the JSON
      try {
        const parsed = JSON.parse(content)
        this.log(JSON.stringify(parsed, null, 2))
      } catch {
        // If not valid JSON, just print raw content
        this.log(content)
      }
    }
  }
}
