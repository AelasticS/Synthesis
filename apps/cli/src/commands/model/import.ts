import { existsSync } from 'node:fs'
import { basename, isAbsolute, join } from 'node:path'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { importModelFile, ModelImportError } from '../../models/import-core.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

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

    // The shared machinery does the rest: validation render (the gate),
    // header stamping, dependency check, copy into the namespace tree.
    let destPath: string
    try {
      ;({ destPath } = await importModelFile({
        workspaceConfig: this.workspaceConfig,
        sourcePath,
        ref,
        tx: flags.tx,
        author: flags.author,
        description: flags.description,
        tags: flags.tags
          ?.split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        force: flags.force,
        verbose: Boolean(flags.verbose)
      }))
    } catch (err) {
      if (err instanceof ModelImportError) {
        this.jsonAwareFail(json, err.message, err.exit)
      }
      throw err
    }

    if (flags.json) {
      this.log(JSON.stringify({ imported: ref, source: sourcePath, destination: destPath }))
    } else {
      this.log(`Imported ${ref}`)
    }
  }
}
