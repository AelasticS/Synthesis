import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { Args, Flags } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { parseRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelExport extends BaseCommand {
  static override description = 'Write a model from the workspace to a file on disk.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons',
    '<%= config.bin %> <%= command.id %> com.example/persons --to ./out/persons.tsx'
  ]

  static override args = {
    ref: Args.string({
      description: 'Model ref to export.',
      required: true
    })
  }

  static override flags = {
    to: Flags.string({
      description: 'Destination file path.'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelExport)
    const json = Boolean(flags.json)

    let ref: string
    let name: string
    try {
      const parsed = parseRef(args.ref)
      ref = `${parsed.namespace}/${parsed.name}`
      name = parsed.name
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    const sourcePath = refToModelPath(getModelsPath(this.workspaceConfig), ref)
    if (!existsSync(sourcePath)) {
      this.jsonAwareFail(json, `Model not found: ${ref}`, EXIT_CODES.NOT_FOUND)
    }

    const destPath = flags.to
      ? isAbsolute(flags.to)
        ? flags.to
        : join(this.savedPwd, flags.to)
      : join(this.savedPwd, `${name}.tsx`)

    // Verbatim copy: the $synth header travels with the file
    const content = await readFile(sourcePath, 'utf-8')
    await writeFile(destPath, content, 'utf-8')

    if (flags.json) {
      this.log(JSON.stringify({ exported: ref, source: sourcePath, destination: destPath }))
    } else {
      this.log(`Exported ${ref} to ${destPath}`)
    }
  }
}
