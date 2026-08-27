import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { Args, Flags } from '@oclif/core'
import { ModelStore } from '@synthesis/engine'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { renderModel } from '../../models/loader.js'
import { parseSynthHeader } from '../../models/header.js'
import { deriveMetamodel } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import { renderModelWithTxContext, resolveInstalledTx, TxResolveError } from '../../tx/load.js'

export default class ModelValidate extends BaseCommand {
  static override description = `Check the model against its metamodel.

Configuration models reference their transformation's decision/binding models; pass --tx <name> so the validation render pre-loads the installed transformation's parts (and the model's header references).`

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons',
    '<%= config.bin %> <%= command.id %> com.example/persons --against @synthesis/standard-metamodels/eer',
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

    let txPackageDir: string | undefined
    if (flags.tx !== undefined) {
      try {
        ;({ packageDir: txPackageDir } = await resolveInstalledTx(this.workspaceConfig, flags.tx))
      } catch (err) {
        const exit = err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE
        this.error(errorMessage(err), { exit })
      }
    }

    const text = await readFile(modelPath, 'utf-8')

    // Real structural validation: transpile, import, and render into a
    // throwaway store; any failure is the model's failure. With --tx, the
    // installed transformation's parts (and the header's reference closure)
    // render first — the context configuration models need.
    const buffer = new EngineOutputBuffer(!flags.verbose)
    try {
      await buffer.run(() =>
        txPackageDir === undefined
          ? renderModel(modelPath)
          : renderModelWithTxContext(modelPath, txPackageDir, new ModelStore(), modelsDir)
      )
    } catch (err) {
      buffer.flushToStderr()
      const kind = parseSynthHeader(text).header?.kind
      const txHint =
        txPackageDir === undefined && kind === 'configuration-model'
          ? ` Hint: configuration models render only with their transformation's context — pass --tx <name> (e.g. the transformation named in the header's generatedBy).`
          : ''
      this.error(`Validation failed: ${errorMessage(err)}${txHint}`, {
        exit: EXIT_CODES.VALIDATION_FAILURE
      })
    }
    this.log('[ok] file transpiles and imports')
    this.log(txPackageDir === undefined ? '[ok] default export renders' : `[ok] default export renders (with '${flags.tx}' context)`)

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
      } else if (header.kind === 'model') {
        // The header is the declared metamodel; a differing derivation is a
        // heads-up, not a failure. Only an explicit --against mismatch fails.
        // The import heuristic only speaks for plain models — special kinds
        // (configuration models) import component modules, not metamodels.
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
