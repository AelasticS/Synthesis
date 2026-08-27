import { Flags } from '@oclif/core'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { BaseCommand } from '../base/base-command.js'
import {
  expandPath,
  saveConfig,
  WORKSPACE_DIRS,
  DEFAULT_CONFIG
} from '../config/index.js'

export default class Init extends BaseCommand {
  static override description = 'Create a new Synthesis workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --path ~/my-workspace'
  ]

  static override flags = {
    path: Flags.string({
      description: 'Directory to create the workspace in.',
      default: '~/.synth'
    })
  }

  public async execute(): Promise<void> {
    const { flags } = await this.parse(Init)
    const workspacePath = expandPath(flags.path!)

    // Check if already exists
    if (existsSync(join(workspacePath, 'config.json'))) {
      this.log(`Workspace already exists at ${workspacePath}`)
      return
    }

    // Create workspace directory structure
    this.log(`Creating workspace at ${workspacePath}`)

    await mkdir(workspacePath, { recursive: true })
    await mkdir(join(workspacePath, WORKSPACE_DIRS.models), { recursive: true })
    await mkdir(join(workspacePath, WORKSPACE_DIRS.transformations), { recursive: true })

    // Save config
    const config = {
      ...DEFAULT_CONFIG,
      workspace: flags.path! // Store original path (with ~)
    }
    await saveConfig(config)

    this.log('Created:')
    this.log(`  ${workspacePath}/`)
    this.log(`  ├── config.json`)
    this.log(`  ├── ${WORKSPACE_DIRS.models}/`)
    this.log(`  └── ${WORKSPACE_DIRS.transformations}/`)
    this.log('')
    this.log('Workspace initialized successfully.')
  }
}
