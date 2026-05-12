import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { Flags } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import {
  getWorkspacePath,
  getModelsPath,
  getTransformationsPath,
  getConfigsPath,
  getGlobalConfigPath
} from '../config/index.js'
import { EXIT_CODES } from '../support/exit-codes.js'

interface CheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
}

export default class Doctor extends BaseCommand {
  static override description = 'Check workspace integrity: missing files, broken references.'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    ...BaseCommand.baseFlags
  }

  public async execute(): Promise<void> {
    const { flags } = await this.parse(Doctor)

    const checks: CheckResult[] = []

    // Check 1: Global config file
    const configPath = getGlobalConfigPath()
    if (existsSync(configPath)) {
      checks.push({
        name: 'Global config',
        status: 'ok',
        message: `Found at ${configPath}`
      })
    } else {
      checks.push({
        name: 'Global config',
        status: 'warning',
        message: `Not found at ${configPath} (using defaults)`
      })
    }

    // Check 2: Workspace root directory
    const workspacePath = getWorkspacePath(this.workspaceConfig)
    if (existsSync(workspacePath)) {
      checks.push({
        name: 'Workspace root',
        status: 'ok',
        message: `Found at ${workspacePath}`
      })
    } else {
      checks.push({
        name: 'Workspace root',
        status: 'error',
        message: `Not found at ${workspacePath}. Run "synth init" to create it.`
      })
    }

    // Check 3: models/ directory
    const modelsPath = getModelsPath(this.workspaceConfig)
    if (existsSync(modelsPath)) {
      checks.push({
        name: 'Models directory',
        status: 'ok',
        message: `Found at ${modelsPath}`
      })
    } else {
      checks.push({
        name: 'Models directory',
        status: 'error',
        message: `Not found at ${modelsPath}`
      })
    }

    // Check 4: transformations/ directory
    const transformationsPath = getTransformationsPath(this.workspaceConfig)
    if (existsSync(transformationsPath)) {
      checks.push({
        name: 'Transformations directory',
        status: 'ok',
        message: `Found at ${transformationsPath}`
      })
    } else {
      checks.push({
        name: 'Transformations directory',
        status: 'error',
        message: `Not found at ${transformationsPath}`
      })
    }

    // Check 5: configs/ directory
    const configsPath = getConfigsPath(this.workspaceConfig)
    if (existsSync(configsPath)) {
      checks.push({
        name: 'Configs directory',
        status: 'ok',
        message: `Found at ${configsPath}`
      })
    } else {
      checks.push({
        name: 'Configs directory',
        status: 'error',
        message: `Not found at ${configsPath}`
      })
    }

    // Check 6: Workspace config.json
    const workspaceConfigPath = join(workspacePath, 'config.json')
    if (existsSync(workspaceConfigPath)) {
      checks.push({
        name: 'Workspace config.json',
        status: 'ok',
        message: `Found at ${workspaceConfigPath}`
      })
    } else {
      checks.push({
        name: 'Workspace config.json',
        status: 'warning',
        message: `Not found at ${workspaceConfigPath}`
      })
    }

    // Output results
    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            workspace: workspacePath,
            checks
          },
          null,
          2
        )
      )
    } else {
      this.log('Workspace Health Check')
      this.log('======================')
      this.log(`Workspace: ${workspacePath}`)
      this.log('')

      for (const check of checks) {
        const icon =
          check.status === 'ok' ? '[ok]' : check.status === 'warning' ? '[warn]' : '[error]'
        this.log(`${icon} ${check.name}: ${check.message}`)
      }

      // Summary
      const errors = checks.filter((c) => c.status === 'error').length
      const warnings = checks.filter((c) => c.status === 'warning').length
      const okCount = checks.filter((c) => c.status === 'ok').length

      this.log('')
      this.log(`Summary: ${okCount} ok, ${warnings} warnings, ${errors} errors`)

      if (errors > 0) {
        this.log('')
        this.log('Run "synth init" to initialize the workspace.')
        this.exit(EXIT_CODES.WORKSPACE_ERROR)
      }
    }
  }
}
