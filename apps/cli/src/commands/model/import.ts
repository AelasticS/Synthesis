import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { stampModelText } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { findMissingReferences, normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import { GateRenderError, renderForGate, TxResolveError } from '../../tx/load.js'

export default class ModelImport extends BaseCommand {
  static override description = `Validate a .tsx model file and copy it into the workspace.

Configuration models reference their transformation's decision/binding models and the source model they configure; pass --tx <name> so the validation render pre-loads the installed transformation's parts (and the file's header references) — without it such a file cannot render.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> ./persons.tsx',
    '<%= config.bin %> <%= command.id %> ./persons.tsx --as com.example/persons',
    '<%= config.bin %> <%= command.id %> ./persons-cfg.tsx --as com.example/persons-cfg --tx eer-to-relational',
    '<%= config.bin %> <%= command.id %> ./persons.tsx --tags eer,demo --force'
  ]

  static override args = {
    file: Args.string({
      description: 'Path to the .tsx model file to import.',
      required: true
    })
  }

  static override flags = {
    as: Flags.string({
      description: 'Ref to assign to the imported model (namespace/name).'
    }),
    tx: Flags.string({
      description:
        'Installed transformation whose parts provide the render context (required for configuration models).'
    }),
    author: Flags.string({
      description: 'Author for the $synth header (default: existing header, then git config).'
    }),
    description: Flags.string({
      description: 'One-line description for the $synth header.'
    }),
    tags: Flags.string({
      description: 'Comma-separated tags for the $synth header.'
    }),
    force: Flags.boolean({
      description: 'Overwrite the target model if it already exists.'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelImport)
    const json = Boolean(flags.json)

    const sourcePath = isAbsolute(args.file) ? args.file : join(this.savedPwd, args.file)
    if (!existsSync(sourcePath)) {
      this.jsonAwareFail(json, `Source file not found: ${sourcePath}`, EXIT_CODES.NOT_FOUND)
    }
    if (!sourcePath.endsWith('.tsx')) {
      this.jsonAwareFail(
        json,
        `Source file must be a .tsx model module: ${sourcePath}`,
        EXIT_CODES.FAILURE
      )
    }

    // Determine the target ref
    let ref: string
    try {
      if (flags.as) {
        ref = normalizeRef(flags.as)
      } else {
        if (!this.workspaceConfig.currentNamespace) {
          this.jsonAwareFail(json, 'No namespace set. Use --as or set a current namespace.', EXIT_CODES.FAILURE)
        }
        ref = normalizeRef(`${this.workspaceConfig.currentNamespace}/${basename(sourcePath, '.tsx')}`)
      }
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    const modelsDir = getModelsPath(this.workspaceConfig)
    const text = await readFile(sourcePath, 'utf-8')

    // Validation gate: the model must transpile, import, and render into a
    // throwaway store before anything is copied into the workspace. With
    // --tx, the installed transformation's parts render into the store
    // first — the context configuration models need.
    let moduleHeader: unknown
    const buffer = new EngineOutputBuffer(!flags.verbose)
    try {
      ;({ header: moduleHeader } = await buffer.run(() =>
        renderForGate(this.workspaceConfig, sourcePath, flags.tx, modelsDir)
      ))
    } catch (err) {
      buffer.flushToStderr()
      if (err instanceof TxResolveError) {
        this.jsonAwareFail(json, errorMessage(err), err.exit)
      }
      if (err instanceof GateRenderError) {
        const prefix =
          err.missingRef !== undefined
            ? `Import rejected: missing dependency '${err.missingRef}' — `
            : 'Import rejected: '
        this.jsonAwareFail(json, `${prefix}${err.message}${err.hint}`, EXIT_CODES.VALIDATION_FAILURE)
      }
      this.jsonAwareFail(json, `Import rejected: ${errorMessage(err)}`, EXIT_CODES.VALIDATION_FAILURE)
    }

    const { text: stamped, header } = await stampModelText(text, moduleHeader, {
      author: flags.author,
      description: flags.description,
      tags: flags.tags
        ?.split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    })

    // Every workspace ref the header depends on must already be imported
    for (const { key, target } of findMissingReferences(modelsDir, header.references)) {
      this.jsonAwareFail(
        json,
        `Import rejected: missing dependency — header reference '${key}' -> '${target}' is not in the workspace. Import it first.`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    const destPath = refToModelPath(modelsDir, ref)
    if (existsSync(destPath) && !flags.force) {
      this.jsonAwareFail(json, `Model already exists: ${ref}. Use --force to overwrite.`, EXIT_CODES.FAILURE)
    }
    await mkdir(dirname(destPath), { recursive: true })
    await writeFile(destPath, stamped, 'utf-8')

    if (flags.json) {
      this.log(JSON.stringify({ imported: ref, source: sourcePath, destination: destPath }))
    } else {
      this.log(`Imported ${ref}`)
    }
  }
}
