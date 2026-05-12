import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getTransformationsPath } from '../../config/index.js'

interface TransformationMetadata {
  name: string
  version: string
  description?: string
  sourceMetamodel?: string
  targetMetamodel?: string
  author?: string
  license?: string
  path: string
}

export default class TxShow extends BaseCommand {
  static override description = "Print the transformation's source metamodel, target metamodel, and variability points."

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name of the transformation to show.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(TxShow)
    const txName = args.name

    const metadata = await this.getTransformationMetadata(txName)

    if (!metadata) {
      this.error(`Transformation '${txName}' not found.`)
    }

    if (flags.json) {
      this.log(JSON.stringify(metadata, null, 2))
      return
    }

    this.log(`Transformation: ${metadata.name}`)
    this.log(`  version: ${metadata.version}`)
    if (metadata.description) {
      this.log(`  description: ${metadata.description}`)
    }
    if (metadata.sourceMetamodel) {
      this.log(`  source metamodel: ${metadata.sourceMetamodel}`)
    }
    if (metadata.targetMetamodel) {
      this.log(`  target metamodel: ${metadata.targetMetamodel}`)
    }
    if (metadata.author) {
      this.log(`  author: ${metadata.author}`)
    }
    if (metadata.license) {
      this.log(`  license: ${metadata.license}`)
    }
    this.log(`  path: ${metadata.path}`)
  }

  private async getTransformationMetadata(name: string): Promise<TransformationMetadata | null> {
    // First, check if it's in config.transformations
    const configEntry = this.workspaceConfig.transformations[name]
    let txPath: string

    if (configEntry) {
      txPath = configEntry.path
    } else {
      // Check in transformations directory
      txPath = join(getTransformationsPath(this.workspaceConfig), name)
    }

    if (!existsSync(txPath)) {
      return null
    }

    // Read package.json
    const pkgJsonPath = join(txPath, 'package.json')
    if (!existsSync(pkgJsonPath)) {
      // Return minimal metadata if no package.json
      return {
        name,
        version: configEntry?.version ?? 'unknown',
        path: txPath
      }
    }

    try {
      const pkgContent = await readFile(pkgJsonPath, 'utf-8')
      const pkg = JSON.parse(pkgContent) as {
        name?: string
        version?: string
        description?: string
        author?: string | { name: string }
        license?: string
        synth?: {
          sourceMetamodel?: string
          targetMetamodel?: string
        }
      }

      return {
        name: pkg.name ?? name,
        version: pkg.version ?? 'unknown',
        description: pkg.description,
        sourceMetamodel: pkg.synth?.sourceMetamodel,
        targetMetamodel: pkg.synth?.targetMetamodel,
        author: typeof pkg.author === 'string' ? pkg.author : pkg.author?.name,
        license: pkg.license,
        path: txPath
      }
    } catch {
      // Return minimal metadata on parse error
      return {
        name,
        version: configEntry?.version ?? 'unknown',
        path: txPath
      }
    }
  }
}
