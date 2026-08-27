import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { renderModel } from '../../models/loader.js'
import { stampModelText } from '../../models/stamp.js'
import { errorMessage } from '../../support/errors.js'
import { findMissingReferences, normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelImport extends BaseCommand {
  static override description = 'Validate a .tsx model file and copy it into the workspace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> ./persons.tsx',
    '<%= config.bin %> <%= command.id %> ./persons.tsx --as com.example/persons',
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

    // Validation gate: the model must transpile, import, and render into a
    // throwaway store before anything is copied into the workspace.
    let moduleHeader: unknown
    try {
      const rendered = await renderModel(sourcePath)
      moduleHeader = rendered.header
    } catch (err) {
      const message = errorMessage(err)
      // A dangling $refByName means the model references an element that
      // neither the file itself nor the store provides
      const dangling = /Not existing object referenced with name "([^"]+)"/.exec(message)
      if (dangling) {
        this.jsonAwareFail(
          json,
          `Import rejected: missing dependency '${dangling[1]}' — ${message}`,
          EXIT_CODES.VALIDATION_FAILURE
        )
      }
      this.jsonAwareFail(json, `Import rejected: ${message}`, EXIT_CODES.VALIDATION_FAILURE)
    }

    const text = await readFile(sourcePath, 'utf-8')
    const { text: stamped, header } = await stampModelText(text, moduleHeader, {
      author: flags.author,
      description: flags.description,
      tags: flags.tags
        ?.split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    })

    // Every workspace ref the header depends on must already be imported
    const modelsDir = getModelsPath(this.workspaceConfig)
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
