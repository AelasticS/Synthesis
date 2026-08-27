import { existsSync, statSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getTransformationsPath, saveConfig } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { loadTxManifest, TxManifest } from '../../tx/manifest.js'

// The manifest name becomes a single directory segment under the workspace's
// transformations directory; a name with path separators or '..' could
// escape it or clobber sibling installs.
function invalidNameReason(name: string): string | undefined {
  if (name.trim() === '') {
    return 'it is empty'
  }
  if (name.includes('/') || name.includes('\\')) {
    return 'it contains a path separator'
  }
  if (name.includes('..')) {
    return `it contains '..'`
  }
  return undefined
}

export default class TransformationInstall extends BaseCommand {
  static override aliases = ['tx:install']

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
    const { args, flags } = await this.parse(TransformationInstall)
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

    // Load and validate the transformation manifest (synth.json or the
    // `synth` block in package.json). A package without a valid manifest
    // is not installable.
    let manifest: TxManifest
    try {
      manifest = await loadTxManifest(sourcePath)
    } catch (err) {
      this.error(errorMessage(err))
    }

    const { name, version } = manifest

    const nameProblem = invalidNameReason(name)
    if (nameProblem !== undefined) {
      this.error(
        `Cannot install transformation: manifest name '${name}' is not usable as an install directory name (${nameProblem}).`
      )
    }

    // Create transformations directory if needed
    const txBasePath = getTransformationsPath(this.workspaceConfig)
    if (!existsSync(txBasePath)) {
      await mkdir(txBasePath, { recursive: true })
    }

    // Copy to transformations/<name>
    const destPath = join(txBasePath, name)

    if (existsSync(destPath)) {
      this.error(`Transformation '${name}' is already installed at '${destPath}'. Use 'synth transformation uninstall' first.`)
    }

    await cp(sourcePath, destPath, { recursive: true })

    // Update config. Kind and variability are manifest facts, re-read from
    // the manifest whenever needed — the config records only install state.
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
            kind: manifest.kind,
            variability: manifest.variability,
            path: destPath
          },
          null,
          2
        )
      )
      return
    }

    this.log(`Installed transformation '${name}@${version}' (${manifest.kind}) to ${destPath}`)
  }
}
