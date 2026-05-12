import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../base/base-command.js'
import { getModelsPath } from '../config/index.js'
import { EXIT_CODES } from '../support/exit-codes.js'

export default class Run extends BaseCommand {
  static override description = 'Run a model-to-model transformation.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/library',
    '<%= config.bin %> <%= command.id %> eer-to-relational --in com.example/library --config com.example/library.cfg --out com.example/library.rel'
  ]

  static override args = {
    tx: Args.string({
      description: 'Name of the installed transformation to run.',
      required: true
    })
  }

  static override flags = {
    in: Flags.string({
      description: 'Source model ref to transform.',
      required: true
    }),
    config: Flags.string({
      description: 'Configuration ref for variability resolution.'
    }),
    out: Flags.string({
      description: 'Destination ref for the result model.'
    }),
    overwrite: Flags.boolean({
      description: 'Replace the target model if it already exists.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(Run)

    // Verify the transformation exists in config.transformations
    const txName = args.tx
    const transformations = this.workspaceConfig.transformations

    if (!transformations[txName]) {
      const availableTx = Object.keys(transformations)
      const hint =
        availableTx.length > 0
          ? `Available transformations: ${availableTx.join(', ')}`
          : 'No transformations installed. Use "synth tx install" to install one.'
      this.error(`Transformation not found: ${txName}. ${hint}`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }

    // Parse the input model ref (namespace/name format)
    const inputRef = flags.in
    const refParts = inputRef.split('/')
    if (refParts.length < 2) {
      this.error(`Invalid model ref: ${inputRef}. Expected format: namespace/name`, {
        exit: EXIT_CODES.FAILURE
      })
    }

    const namespace = refParts.slice(0, -1).join('/')
    const modelName = refParts[refParts.length - 1]

    // Verify the input model exists
    const modelsDir = getModelsPath(this.workspaceConfig)
    const modelPath = join(modelsDir, namespace, `${modelName}.json`)

    if (!existsSync(modelPath)) {
      this.error(`Input model not found: ${inputRef} (looked for ${modelPath})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }

    // Compute output ref
    const outRef = flags.out ?? `${inputRef}.transformed`
    const configRef = flags.config ?? 'defaults'

    // Log what would happen (stub behavior)
    this.log(`[stub] synth run - M2M transformation`)
    this.log(`  Transformation: ${txName}`)
    this.log(`    Path: ${transformations[txName].path}`)
    this.log(`    Version: ${transformations[txName].version}`)
    this.log(`  Input model: ${inputRef}`)
    this.log(`    File: ${modelPath}`)
    this.log(`  Configuration: ${configRef}`)
    this.log(`  Output: ${outRef}`)
    this.log(`  Overwrite: ${flags.overwrite}`)
    this.log('')
    this.log('Would execute:')
    this.log(`  1. Load source model from ${modelPath}`)
    this.log(`  2. Resolve configuration ${configRef}`)
    this.log(`  3. Execute transformation ${txName}`)
    this.log(`  4. Write result to ${outRef}`)
    this.log('')
    this.log('[info] Actual transformation execution not yet implemented')
  }
}
