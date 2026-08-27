import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Args } from '@oclif/core'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader } from '../../models/header.js'
import { errorMessage } from '../../support/errors.js'
import { parseRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ModelShow extends BaseCommand {
  static override description = 'Show a model header and file location.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example/persons']

  static override args = {
    ref: Args.string({
      description: 'Model ref (namespace/name).',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ModelShow)
    const json = Boolean(flags.json)

    let ref: string
    try {
      const parsed = parseRef(args.ref)
      ref = `${parsed.namespace}/${parsed.name}`
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    const filePath = refToModelPath(getModelsPath(this.workspaceConfig), ref)
    if (!existsSync(filePath)) {
      this.jsonAwareFail(json, `Model not found: ${ref}`, EXIT_CODES.NOT_FOUND)
    }

    // Static fast path only: no transpile, no execution
    const [text, info] = await Promise.all([readFile(filePath, 'utf-8'), stat(filePath)])
    const { header, error } = parseSynthHeader(text)

    if (flags.json) {
      this.log(JSON.stringify({ ref, path: filePath, header }))
      return
    }

    this.log(`Ref:         ${ref}`)
    this.log(`Path:        ${filePath}`)
    this.log(`Size:        ${info.size} bytes`)
    if (header === null) {
      if (error !== undefined) {
        this.log(`Header:      unparseable $synth header: ${error}`)
      } else {
        this.log(`Header:      no $synth header ('synth model import' stamps one)`)
      }
      return
    }
    this.log(`Kind:        ${header.kind}`)
    this.log(`Metamodel:   ${header.metamodel}`)
    this.log(`Version:     ${header.version}`)
    this.log(`Author:      ${header.author}`)
    this.log(`Description: ${header.description}`)
    this.log(`Tags:        ${header.tags.length > 0 ? header.tags.join(', ') : '(none)'}`)
    this.log(`License:     ${header.license ?? '(none)'}`)
    this.log(`Created:     ${header.createdAt}`)
    this.log(`Modified:    ${header.modifiedAt}`)
    if (header.generatedBy === null) {
      this.log('Generated:   (authored)')
    } else {
      const gb = header.generatedBy
      const version = gb.txVersion !== undefined ? `@${gb.txVersion}` : ''
      this.log(`Generated:   by ${gb.tx}${version} on ${gb.date}`)
    }
    const references = Object.entries(header.references)
    if (references.length > 0) {
      this.log('References:')
      for (const [key, target] of references) {
        this.log(`  ${key} -> ${target}`)
      }
    }
  }
}
