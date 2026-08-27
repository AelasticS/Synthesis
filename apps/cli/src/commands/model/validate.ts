import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { renderModel } from '../../models/loader.js'
import { parseSynthHeader } from '../../models/header.js'
import { deriveMetamodel } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelValidate extends BaseCommand {
  static override description = 'Check the model against its metamodel.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons',
    '<%= config.bin %> <%= command.id %> com.example/persons --against @synthesis/standard-metamodels/eer'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to validate.',
      required: true
    })
  }

  static override flags = {
    against: Flags.string({
      description: 'Metamodel the header must declare (defaults to the derived import).'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelValidate)

    let ref: string
    try {
      ref = normalizeRef(args.ref)
    } catch (err) {
      this.error(`Invalid model ref: ${errorMessage(err)}`, { exit: EXIT_CODES.FAILURE })
    }

    const modelPath = refToModelPath(getModelsPath(this.workspaceConfig), ref)
    if (!existsSync(modelPath)) {
      this.error(`Model not found: ${ref} (looked for ${modelPath})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }

    // Real structural validation: transpile, import, and render into a
    // throwaway store; any failure is the model's failure
    try {
      await renderModel(modelPath)
    } catch (err) {
      this.error(`Validation failed: ${errorMessage(err)}`, {
        exit: EXIT_CODES.VALIDATION_FAILURE
      })
    }
    this.log('[ok] file transpiles and imports')
    this.log('[ok] default export renders')

    const text = await readFile(modelPath, 'utf-8')
    const { header, error } = parseSynthHeader(text)
    if (header === null) {
      // Missing header is a warning, not a failure: import stamps it, but
      // hand-placed files may lack one
      if (error !== undefined) {
        this.log(`[warn] unparseable $synth header: ${error}`)
      } else {
        this.log(`[warn] no $synth header ('synth model import' stamps one)`)
      }
    } else {
      this.log('[ok] $synth header present')
      if (flags.against !== undefined) {
        if (header.metamodel === flags.against) {
          this.log(`[ok] header.metamodel matches --against (${flags.against})`)
        } else {
          this.error(
            `header.metamodel '${header.metamodel}' does not match --against '${flags.against}'`,
            { exit: EXIT_CODES.VALIDATION_FAILURE }
          )
        }
      } else {
        // The header is the declared metamodel; a differing derivation is a
        // heads-up, not a failure. Only an explicit --against mismatch fails.
        const derived = deriveMetamodel(text)
        if (derived !== null) {
          if (header.metamodel === derived) {
            this.log(`[ok] header.metamodel matches the metamodel import (${derived})`)
          } else {
            this.log(
              `[warn] header.metamodel '${header.metamodel}' does not match the metamodel import '${derived}'`
            )
          }
        }
      }
    }

    this.log(`Model ${ref} is valid`)
  }
}
