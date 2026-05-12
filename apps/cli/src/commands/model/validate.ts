import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelValidate extends BaseCommand {
  static override description = 'Check the model against its metamodel.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/order-1',
    '<%= config.bin %> <%= command.id %> com.example/order-1 --against @aelastics/order-metamodel'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to validate.',
      required: true
    })
  }

  static override flags = {
    against: Flags.string({
      description: 'Metamodel to validate against (defaults to model header).'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelValidate)

    // Parse the ref (namespace/name format)
    const refParts = args.ref.split('/')
    if (refParts.length < 2) {
      this.error(`Invalid model ref: ${args.ref}. Expected format: namespace/name`, {
        exit: EXIT_CODES.FAILURE
      })
    }

    const namespace = refParts.slice(0, -1).join('/')
    const modelName = refParts[refParts.length - 1]

    // Resolve the model file path
    const modelsDir = getModelsPath(this.workspaceConfig)
    const modelPath = join(modelsDir, namespace, `${modelName}.json`)

    // Check if the model file exists
    if (!existsSync(modelPath)) {
      this.error(`Model not found: ${args.ref} (looked for ${modelPath})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }

    // Try to read and parse the JSON
    let content: string
    try {
      content = await readFile(modelPath, 'utf-8')
    } catch (err) {
      this.error(`Failed to read model file: ${modelPath}`, {
        exit: EXIT_CODES.FAILURE
      })
    }

    // Validate JSON syntax
    let parsedModel: unknown
    try {
      parsedModel = JSON.parse(content)
    } catch (err) {
      const parseError = err as SyntaxError
      this.error(`Invalid JSON in model ${args.ref}: ${parseError.message}`, {
        exit: EXIT_CODES.VALIDATION_FAILURE
      })
    }

    // Store the --against flag for future metamodel validation
    const metamodel = flags.against ?? null
    if (metamodel) {
      this.log(`[info] Metamodel validation against ${metamodel} not yet implemented`)
    }

    // Report success
    this.log(`Model ${args.ref} is valid JSON`)
    if (typeof parsedModel === 'object' && parsedModel !== null) {
      const keys = Object.keys(parsedModel)
      this.log(`  Top-level keys: ${keys.length > 0 ? keys.join(', ') : '(empty object)'}`)
    }
  }
}
