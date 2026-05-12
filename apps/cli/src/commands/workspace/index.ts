import { Flags } from '@oclif/core'
import { readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import {
  expandPath,
  saveConfig,
  getModelsPath,
  getTransformationsPath,
  WORKSPACE_DIRS
} from '../../config/index.js'

export default class Workspace extends BaseCommand {
  static override description = 'Print or switch the active workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --set ~/other-workspace'
  ]

  static override flags = {
    set: Flags.string({
      description: 'Switch the active workspace to this path.'
    })
  }

  public async execute(): Promise<void> {
    const { flags } = await this.parse(Workspace)

    if (flags.set) {
      await this.setWorkspace(flags.set)
    } else {
      await this.showWorkspace()
    }
  }

  private async setWorkspace(newPath: string): Promise<void> {
    const expandedPath = expandPath(newPath)

    // Check if path exists and is a workspace
    if (!existsSync(join(expandedPath, 'config.json'))) {
      this.error(`Not a valid workspace: ${expandedPath}\nRun 'synth init --path ${newPath}' to create one.`)
    }

    // Update config
    this.workspaceConfig.workspace = newPath
    await saveConfig(this.workspaceConfig)

    this.log(`Workspace switched to: ${expandedPath}`)
  }

  private async showWorkspace(): Promise<void> {
    const workspacePath = this.getWorkspacePath()

    if (!this.isWorkspaceInitialized()) {
      this.log(`No workspace initialized.`)
      this.log(`Run 'synth init' to create one.`)
      return
    }

    this.log(`Workspace: ${workspacePath}`)
    this.log('')

    // Count namespaces
    const modelsPath = getModelsPath(this.workspaceConfig)
    if (existsSync(modelsPath)) {
      const namespaces = await readdir(modelsPath, { withFileTypes: true })
      const nsDirs = namespaces.filter(d => d.isDirectory())
      this.log(`Namespaces: ${nsDirs.length}`)
      for (const ns of nsDirs.slice(0, 5)) {
        this.log(`  - ${ns.name}`)
      }
      if (nsDirs.length > 5) {
        this.log(`  ... and ${nsDirs.length - 5} more`)
      }
    }

    // Count transformations
    const txPath = getTransformationsPath(this.workspaceConfig)
    if (existsSync(txPath)) {
      const txDirs = await readdir(txPath, { withFileTypes: true })
      const txCount = txDirs.filter(d => d.isDirectory()).length
      this.log(`Transformations: ${txCount}`)
    }

    // Show current namespace
    if (this.workspaceConfig.currentNamespace) {
      this.log('')
      this.log(`Current namespace: ${this.workspaceConfig.currentNamespace}`)
    }
  }
}
