import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { Flags } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import {
  getWorkspacePath,
  getModelsPath,
  getTransformationsPath,
  getGlobalConfigPath
} from '../config/index.js'
import { parseSynthHeader } from '../models/header.js'
import type { SynthHeader } from '../models/header.js'
import { stampModelText } from '../models/stamp.js'
import { errorMessage } from '../support/errors.js'
import { findMissingReferences, namespaceExists, scanModelsTree } from '../support/refs.js'
import { EXIT_CODES } from '../support/exit-codes.js'

interface CheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
}

export default class Doctor extends BaseCommand {
  static override description = 'Check workspace integrity: missing files, broken references.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --fix'
  ]

  static override flags = {
    ...BaseCommand.baseFlags,
    fix: Flags.boolean({
      description: 'Re-derive and write missing or unparseable model headers.'
    })
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

    // Check 5: Workspace config.json
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

    const { models, skipped } = await scanModelsTree(modelsPath)

    // Check 6: every entry under models/ is addressable by a ref. Legacy
    // layouts (dot-named flat directories, .tsx files at the models root)
    // are skipped by every command, so surface them instead of silently
    // ignoring old workspaces.
    if (skipped.length === 0) {
      checks.push({
        name: 'Models tree',
        status: 'ok',
        message: 'All entries under models/ are addressable'
      })
    } else {
      for (const entry of skipped) {
        checks.push({
          name: 'Unaddressable entry',
          status: 'warning',
          message: `${entry.path} is ignored: ${entry.reason}`
        })
      }
    }

    // Check 7: every model file's $synth header parses (static fast path).
    // Header/content drift (header.metamodel vs what the module actually
    // instantiates) is NOT checked here: detecting it needs a transpile and
    // render per model, which is too slow for doctor. `model validate <ref>`
    // performs that check for a single model.
    const headers = new Map<string, SynthHeader>()
    let headerProblems = 0
    for (const model of models) {
      let text: string
      try {
        text = await readFile(model.path, 'utf-8')
      } catch {
        checks.push({
          name: `Model header (${model.ref})`,
          status: 'error',
          message: `Cannot read ${model.path}`
        })
        headerProblems++
        continue
      }
      const parsed = parseSynthHeader(text)
      if (parsed.header !== null) {
        headers.set(model.ref, parsed.header)
        continue
      }
      const problem =
        parsed.error !== undefined
          ? `Unparseable $synth header: ${parsed.error}`
          : 'Missing $synth header'
      if (flags.fix) {
        try {
          const { text: stamped, header } = await stampModelText(text)
          await writeFile(model.path, stamped, 'utf-8')
          headers.set(model.ref, header)
          checks.push({
            name: `Model header (${model.ref})`,
            status: 'ok',
            message: `${problem}; re-derived and written (--fix)`
          })
        } catch (err) {
          checks.push({
            name: `Model header (${model.ref})`,
            status: 'error',
            message: `${problem}; --fix failed: ${errorMessage(err)}`
          })
          headerProblems++
        }
      } else {
        checks.push({
          name: `Model header (${model.ref})`,
          status: 'warning',
          message: `${problem} (doctor --fix re-derives it)`
        })
        headerProblems++
      }
    }
    if (headerProblems === 0) {
      checks.push({
        name: 'Model headers',
        status: 'ok',
        message: `${models.length} model file(s) checked`
      })
    }

    // Check 8: every ref in a header's references map exists in the workspace
    let referenceProblems = 0
    for (const [ref, header] of headers) {
      for (const { key, target } of findMissingReferences(modelsPath, header.references)) {
        checks.push({
          name: `Model reference (${ref})`,
          status: 'error',
          message: `Reference '${key}' -> '${target}' does not exist in the workspace`
        })
        referenceProblems++
      }
    }
    if (referenceProblems === 0) {
      checks.push({
        name: 'Model references',
        status: 'ok',
        message: 'All header references resolve'
      })
    }

    // Check 9: the configured current namespace has a directory
    const currentNamespace = this.workspaceConfig.currentNamespace
    if (currentNamespace) {
      let currentNamespaceExists = false
      try {
        // Nested layout only (same rule as `cd`)
        currentNamespaceExists = namespaceExists(modelsPath, currentNamespace)
      } catch {
        currentNamespaceExists = false
      }
      if (currentNamespaceExists) {
        checks.push({
          name: 'Current namespace',
          status: 'ok',
          message: `'${currentNamespace}' exists`
        })
      } else {
        checks.push({
          name: 'Current namespace',
          status: 'error',
          message: `'${currentNamespace}' has no directory under ${modelsPath}`
        })
      }
    }

    // Output results; both modes exit WORKSPACE_ERROR when any check errored
    const errorCount = checks.filter((c) => c.status === 'error').length
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
      if (errorCount > 0) {
        this.exit(EXIT_CODES.WORKSPACE_ERROR)
      }
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
      const warnings = checks.filter((c) => c.status === 'warning').length
      const okCount = checks.filter((c) => c.status === 'ok').length

      this.log('')
      this.log(`Summary: ${okCount} ok, ${warnings} warnings, ${errorCount} errors`)

      if (errorCount > 0) {
        this.log('')
        this.log('Run "synth init" to initialize the workspace.')
        this.exit(EXIT_CODES.WORKSPACE_ERROR)
      }
    }
  }
}
