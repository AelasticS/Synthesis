import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getTransformationsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { loadTxManifestWithMeta, TxKind, TxManifestParts } from '../../tx/manifest.js'

interface TransformationMetadata {
  name: string
  version: string
  description?: string
  kind: TxKind
  entry: string
  exportName: string
  sourceMetamodel: string
  targetMetamodel: string
  targetComponents?: string
  variability: boolean
  parts?: TxManifestParts
  author?: string
  license?: string
  path: string
}

/** What an installed entry can still report when its manifest is broken. */
interface DegradedMetadata {
  name: string
  version: string
  path: string
  manifestError: string
}

export default class TransformationShow extends BaseCommand {
  static override aliases = ['tx:show']

  static override description = "Print the transformation's kind, source/target metamodels, and variability points."

  static override examples = ['<%= config.bin %> <%= command.id %> eer-to-relational']

  static override args = {
    name: Args.string({
      description: 'Name of the transformation to show.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(TransformationShow)
    const txName = args.name

    const metadata = await this.getTransformationMetadata(txName)

    if (flags.json) {
      this.log(JSON.stringify(metadata, null, 2))
      return
    }

    if ('manifestError' in metadata) {
      this.log(`Transformation: ${metadata.name}`)
      this.log(`  version: ${metadata.version}`)
      this.log(`  path: ${metadata.path}`)
      this.warn(`manifest could not be loaded: ${metadata.manifestError}`)
      return
    }

    this.log(`Transformation: ${metadata.name}`)
    this.log(`  version: ${metadata.version}`)
    if (metadata.description) {
      this.log(`  description: ${metadata.description}`)
    }
    this.log(`  kind: ${metadata.kind}`)
    this.log(`  source metamodel: ${metadata.sourceMetamodel}`)
    this.log(`  target metamodel: ${metadata.targetMetamodel}`)
    if (metadata.targetComponents) {
      this.log(`  target components: ${metadata.targetComponents}`)
    }
    this.log(`  variability: ${metadata.variability ? 'yes' : 'no'}`)
    this.log(`  entry: ${metadata.entry} (export: ${metadata.exportName})`)
    this.printParts(metadata.parts)
    if (metadata.author) {
      this.log(`  author: ${metadata.author}`)
    }
    if (metadata.license) {
      this.log(`  license: ${metadata.license}`)
    }
    this.log(`  path: ${metadata.path}`)
  }

  private printParts(parts: TxManifestParts | undefined): void {
    if (!parts || (!parts.metamodels?.length && !parts.decisionModel && !parts.bindingModel)) {
      return
    }
    this.log('  parts:')
    for (const metamodel of parts.metamodels ?? []) {
      this.log(`    metamodel: ${metamodel.module} (export: ${metamodel.exportName})`)
    }
    if (parts.decisionModel) {
      this.log(`    decision model: ${parts.decisionModel.module} (export: ${parts.decisionModel.exportName})`)
    }
    if (parts.bindingModel) {
      this.log(`    binding model: ${parts.bindingModel.module} (export: ${parts.bindingModel.exportName})`)
    }
  }

  private async getTransformationMetadata(
    name: string
  ): Promise<TransformationMetadata | DegradedMetadata> {
    // First, check if it's in config.transformations
    const configEntry = this.workspaceConfig.transformations[name]
    const txPath = configEntry ? configEntry.path : join(getTransformationsPath(this.workspaceConfig), name)

    if (!existsSync(txPath)) {
      this.error(`Transformation '${name}' not found.`)
    }

    let loaded: Awaited<ReturnType<typeof loadTxManifestWithMeta>>
    try {
      loaded = await loadTxManifestWithMeta(txPath)
    } catch (err) {
      // An installed entry still has name/version/path in the workspace
      // config; show those and surface the manifest problem as a warning
      // instead of hiding the install behind a hard error.
      if (configEntry !== undefined) {
        return { name, version: configEntry.version, path: txPath, manifestError: errorMessage(err) }
      }
      this.error(errorMessage(err))
    }
    const { manifest, meta } = loaded

    return {
      name: manifest.name,
      version: manifest.version,
      description: meta.description,
      kind: manifest.kind,
      entry: manifest.entry,
      exportName: manifest.exportName,
      sourceMetamodel: manifest.source.metamodel,
      targetMetamodel: manifest.target.metamodel,
      targetComponents: manifest.target.components,
      variability: manifest.variability,
      parts: manifest.parts,
      author: meta.author,
      license: meta.license,
      path: txPath
    }
  }
}
