import { existsSync, readdirSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { getTransformationsPath } from '../../config/index.js'

interface TransformationInfo {
  name: string
  version: string
  path: string
  source: 'config' | 'directory'
}

export default class TransformationLs extends BaseCommand {
  static override aliases = ['tx:ls']

  static override description = 'List installed transformations with versions.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async execute(): Promise<void> {
    const { flags } = await this.parse(TransformationLs)
    const transformations = await this.getInstalledTransformations()

    if (flags.json) {
      this.log(JSON.stringify({ transformations }, null, 2))
      return
    }

    if (transformations.length === 0) {
      this.log('No transformations installed.')
      return
    }

    this.log('Installed transformations:')
    this.log('')
    for (const tx of transformations) {
      this.log(`  ${tx.name}@${tx.version}`)
      this.log(`    path: ${tx.path}`)
    }
  }

  private async getInstalledTransformations(): Promise<TransformationInfo[]> {
    const transformations: TransformationInfo[] = []
    const seen = new Set<string>()

    // First, read from config.transformations
    for (const [name, entry] of Object.entries(this.workspaceConfig.transformations)) {
      transformations.push({
        name,
        version: entry.version,
        path: entry.path,
        source: 'config'
      })
      seen.add(name)
    }

    // Then, scan the transformations directory for any not in config
    const txPath = getTransformationsPath(this.workspaceConfig)
    if (existsSync(txPath)) {
      const entries = readdirSync(txPath)
      for (const entry of entries) {
        if (seen.has(entry)) continue

        const entryPath = join(txPath, entry)
        const stat = statSync(entryPath)
        if (!stat.isDirectory()) continue

        // Try to read package.json for version
        const pkgJsonPath = join(entryPath, 'package.json')
        let version = 'unknown'
        if (existsSync(pkgJsonPath)) {
          try {
            const pkgContent = await readFile(pkgJsonPath, 'utf-8')
            const pkg = JSON.parse(pkgContent) as { version?: string }
            version = pkg.version ?? 'unknown'
          } catch {
            // Ignore parse errors
          }
        }

        transformations.push({
          name: entry,
          version,
          path: entryPath,
          source: 'directory'
        })
      }
    }

    return transformations
  }
}
