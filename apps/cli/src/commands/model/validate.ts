import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader } from '../../models/header.js'
import { deriveMetamodel } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import { GateRenderError, renderForGate, TxResolveError } from '../../tx/load.js'
import { checkModelConstraints, type TypeProvider } from '@aelastics/synthesis/metamodel'

export default class ModelValidate extends BaseCommand {
  static override description = `Check the model against its metamodel.

Configuration models reference their transformation's decision/binding models; pass --tx <name> so the validation render pre-loads the installed transformation's parts (and the model's header references).`

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons',
    '<%= config.bin %> <%= command.id %> com.example/persons --against eer-metamodel',
    '<%= config.bin %> <%= command.id %> com.example/persons-cfg --tx eer-to-relational'
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
    }),
    tx: Flags.string({
      description:
        'Installed transformation whose parts provide the render context (required for configuration models).'
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

    const modelsDir = getModelsPath(this.workspaceConfig)
    const modelPath = refToModelPath(modelsDir, ref)
    if (!existsSync(modelPath)) {
      this.error(`Model not found: ${ref} (looked for ${modelPath})`, {
        exit: EXIT_CODES.NOT_FOUND
      })
    }

    const text = await readFile(modelPath, 'utf-8')

    // Real structural validation: transpile, import, and render into a
    // throwaway store; any failure is the model's failure. With --tx, the
    // installed transformation's parts (and the header's reference closure)
    // render first, providing the context configuration models need.
    const buffer = new EngineOutputBuffer(!flags.verbose)
    let rendered: Awaited<ReturnType<typeof renderForGate>> | undefined
    try {
      rendered = await buffer.run(() => renderForGate(this.workspaceConfig, modelPath, flags.tx, modelsDir))
    } catch (err) {
      buffer.flushToStderr()
      if (err instanceof TxResolveError) {
        this.error(errorMessage(err), { exit: err.exit })
      }
      if (err instanceof GateRenderError) {
        this.error(`Validation failed: ${err.message}${err.hint}`, {
          exit: EXIT_CODES.VALIDATION_FAILURE
        })
      }
      this.error(`Validation failed: ${errorMessage(err)}`, {
        exit: EXIT_CODES.VALIDATION_FAILURE
      })
    }
    this.log('[ok] file transpiles and imports')
    this.log(flags.tx === undefined ? '[ok] default export renders' : `[ok] default export renders (with '${flags.tx}' context)`)

    // The declared-constraints traversal: run the metamodel's
    // addValidator predicates over the finished model. Rendering never
    // runs them (a model is legitimately incomplete mid-construction);
    // this is the validation point that does.
    if (rendered !== undefined) {
      const violations = checkModelConstraints(
        rendered.store as unknown as TypeProvider,
        rendered.root as { name?: unknown; elements?: unknown[] }
      )
      if (violations.length > 0) {
        for (const v of violations) {
          this.log(`[fail] ${v.type} '${v.element}': ${v.message}`)
        }
        this.error(`${violations.length} declared constraint violation(s)`, {
          exit: EXIT_CODES.VALIDATION_FAILURE
        })
      }
      this.log('[ok] declared constraints hold')
    }

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
      } else if (header.kind !== 'configuration-model') {
        // The header is the declared metamodel; a differing derivation is a
        // heads-up, not a failure. Only an explicit --against mismatch fails.
        // The import heuristic speaks for every kind except configuration
        // models, whose imports are component modules, not metamodels.
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
