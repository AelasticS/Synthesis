import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getNamespacePath } from '../../config/index.js'
import { parseRef } from '../../types/refs.js'

export default class ModelImport extends BaseCommand {
  static override description = 'Copy a JSON file from disk into the workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> ./examples/order.json',
    '<%= config.bin %> <%= command.id %> ./examples/order.json --as com.example/order-1'
  ]

  static override args = {
    file: Args.string({
      description: 'Path to the JSON file to import.',
      required: true
    })
  }

  static override flags = {
    as: Flags.string({
      description: 'Ref to assign to the imported model (namespace/name).'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelImport)

    // Resolve source file path
    const sourcePath = args.file.startsWith('/')
      ? args.file
      : join(this.savedPwd, args.file)

    if (!existsSync(sourcePath)) {
      if (flags.json) {
        this.log(JSON.stringify({ error: `Source file not found: ${sourcePath}` }))
      } else {
        this.error(`Source file not found: ${sourcePath}`)
      }
      return
    }

    // Determine target ref
    let namespace: string
    let name: string

    if (flags.as) {
      const parsed = parseRef(flags.as)
      if (!parsed) {
        if (flags.json) {
          this.log(JSON.stringify({ error: `Invalid ref format: ${flags.as}. Expected namespace/name.` }))
        } else {
          this.error(`Invalid ref format: ${flags.as}. Expected namespace/name.`)
        }
        return
      }
      namespace = parsed.namespace
      name = parsed.name
    } else {
      // Use current namespace and derive name from filename
      if (!this.workspaceConfig.currentNamespace) {
        if (flags.json) {
          this.log(JSON.stringify({ error: 'No namespace set. Use --as or set a current namespace.' }))
        } else {
          this.error('No namespace set. Use --as or set a current namespace.')
        }
        return
      }
      namespace = this.workspaceConfig.currentNamespace
      name = basename(sourcePath, '.json')
    }

    // Read source file
    const content = await readFile(sourcePath, 'utf-8')

    // Validate it's valid JSON
    try {
      JSON.parse(content)
    } catch {
      if (flags.json) {
        this.log(JSON.stringify({ error: `Source file is not valid JSON: ${sourcePath}` }))
      } else {
        this.error(`Source file is not valid JSON: ${sourcePath}`)
      }
      return
    }

    // Ensure namespace directory exists
    const nsPath = getNamespacePath(this.workspaceConfig, namespace)
    if (!existsSync(nsPath)) {
      await mkdir(nsPath, { recursive: true })
    }

    // Write to destination
    const destPath = join(nsPath, `${name}.json`)
    await writeFile(destPath, content, 'utf-8')

    const ref = `${namespace}/${name}`

    if (flags.json) {
      this.log(JSON.stringify({ imported: ref, source: sourcePath, destination: destPath }))
    } else {
      this.log(`Imported ${ref}`)
    }
  }
}
