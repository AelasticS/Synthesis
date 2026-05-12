import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import { getModelsPath } from '../config/index.js'
import { EXIT_CODES } from '../support/exit-codes.js'

export default class M2T extends BaseCommand {
  static override description = 'Run a model-to-text transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/library --template eer-java --out ./src-gen'
  ]

  static override args = {
    model: Args.string({
      description: 'Model ref to transform.',
      required: true
    })
  }

  static override flags = {
    template: Flags.string({
      description: 'Path or installed name of the M2T template.',
      required: true
    }),
    out: Flags.string({
      description: 'Output directory on disk.',
      required: true
    }),
    'dry-run': Flags.boolean({
      description: 'Print the files that would be written, without writing them.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(M2T)

    // Parse the model ref (namespace/name format)
    const modelRef = args.model
    const refParts = modelRef.split('/')
    if (refParts.length < 2) {
      this.error(`Invalid model ref: ${modelRef}. Expected format: namespace/name`, {
        exit: EXIT_CODES.FAILURE
      })
    }

    const namespace = refParts.slice(0, -1).join('/')
    const modelName = refParts[refParts.length - 1]

    // Verify the model file exists
    const modelsDir = getModelsPath(this.workspaceConfig)
    const modelPath = join(modelsDir, namespace, `${modelName}.json`)

    if (!existsSync(modelPath)) {
      this.error(`Model not found: ${modelRef} (looked for ${modelPath})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }

    // Resolve the output directory (relative to savedPwd, the original working directory)
    const outDir = resolve(this.savedPwd, flags.out)

    // Check if output directory can be created (verify parent exists or can be created)
    const parentDir = dirname(outDir)
    if (!existsSync(parentDir)) {
      // Try to determine if the full path is creatable
      // For now, we'll attempt to create the directory structure
      try {
        if (!flags['dry-run']) {
          await mkdir(outDir, { recursive: true })
          this.log(`Created output directory: ${outDir}`)
        }
      } catch (err) {
        this.error(`Cannot create output directory: ${outDir}`, {
          exit: EXIT_CODES.FAILURE
        })
      }
    } else if (!existsSync(outDir) && !flags['dry-run']) {
      try {
        await mkdir(outDir, { recursive: true })
        this.log(`Created output directory: ${outDir}`)
      } catch (err) {
        this.error(`Cannot create output directory: ${outDir}`, {
          exit: EXIT_CODES.FAILURE
        })
      }
    }

    const action = flags['dry-run'] ? 'list files (dry run)' : `write files to ${outDir}`

    // Log what would happen (stub behavior)
    this.log(`[stub] synth m2t - Model-to-Text transformation`)
    this.log(`  Model: ${modelRef}`)
    this.log(`    File: ${modelPath}`)
    this.log(`  Template: ${flags.template}`)
    this.log(`  Output directory: ${outDir}`)
    this.log(`  Dry run: ${flags['dry-run']}`)
    this.log('')
    this.log('Would execute:')
    this.log(`  1. Load model from ${modelPath}`)
    this.log(`  2. Resolve template ${flags.template}`)
    this.log(`  3. Render template against model`)
    this.log(`  4. ${action}`)
    this.log('')
    this.log('[info] Actual M2T transformation execution not yet implemented')
  }
}
