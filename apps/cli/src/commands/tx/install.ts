import { existsSync, statSync } from 'node:fs'
import { cp, mkdir, readFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getTransformationsPath, saveConfig } from '../../config/index.js'

export default class TxInstall extends BaseCommand {
  static override description = 'Install a transformation from npm, git, or local path.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> @aelastics/eer-to-relational',
    '<%= config.bin %> <%= command.id %> git+https://github.com/user/tx.git',
    '<%= config.bin %> <%= command.id %> ./my-transformation',
    '<%= config.bin %> <%= command.id %> ./eer-to-relational-1.0.0.tgz'
  ]

  static override args = {
    package: Args.string({
      description: 'Package spec: npm name, git URL, local directory, or tarball.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(TxInstall)
    const packageSpec = args.package

    // For now, only support local directory install
    const sourcePath = resolve(packageSpec)

    if (!existsSync(sourcePath)) {
      this.error(`Path not found: ${sourcePath}`)
    }

    const stat = statSync(sourcePath)
    if (!stat.isDirectory()) {
      this.error(`Currently only local directory install is supported. '${packageSpec}' is not a directory.`)
    }

    // Read package.json to get name and version
    const pkgJsonPath = join(sourcePath, 'package.json')
    if (!existsSync(pkgJsonPath)) {
      this.error(`No package.json found in '${sourcePath}'. Cannot determine transformation name.`)
    }

    let name: string
    let version: string

    try {
      const pkgContent = await readFile(pkgJsonPath, 'utf-8')
      const pkg = JSON.parse(pkgContent) as { name?: string; version?: string }
      name = pkg.name ?? basename(sourcePath)
      version = pkg.version ?? '0.0.0'
    } catch {
      this.error(`Failed to parse package.json in '${sourcePath}'.`)
    }

    // Create transformations directory if needed
    const txBasePath = getTransformationsPath(this.workspaceConfig)
    if (!existsSync(txBasePath)) {
      await mkdir(txBasePath, { recursive: true })
    }

    // Copy to transformations/<name>
    const destPath = join(txBasePath, name)

    if (existsSync(destPath)) {
      this.error(`Transformation '${name}' is already installed at '${destPath}'. Use 'tx uninstall' first.`)
    }

    await cp(sourcePath, destPath, { recursive: true })

    // Update config
    this.workspaceConfig.transformations[name] = {
      version,
      path: destPath,
      installedAt: new Date().toISOString()
    }

    await saveConfig(this.workspaceConfig)

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            installed: true,
            name,
            version,
            path: destPath
          },
          null,
          2
        )
      )
      return
    }

    this.log(`Installed transformation '${name}@${version}' to ${destPath}`)
  }
}
