import { Args, Flags } from '@oclif/core'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'

import { BaseCommand } from '../../base/base-command.js'
import { examplesRegistry } from '@synthesis/examples'
import { EXIT_CODES } from '../../support/exit-codes.js'

export default class ExampleRun extends BaseCommand {
  static override description = 'Execute a bundled example and write its artifacts to disk.'

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-rel-to-text',
    '<%= config.bin %> <%= command.id %> eer-to-rel-to-text --out ./generated'
  ]

  static override args = {
    id: Args.string({
      description: 'Example identifier (use `synth example ls` to see available ids).',
      required: true
    })
  }

  static override flags = {
    out: Flags.string({
      description: 'Output directory for artifacts. The example id is appended to it.',
      default: 'out'
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ExampleRun)
    const json = Boolean(flags.json)
    const r = examplesRegistry.get(args.id)

    if (!r) {
      this.jsonAwareFail(
        json,
        `No example with id "${args.id}". Run \`synth example ls\` to see available ids.`,
        EXIT_CODES.NOT_FOUND
      )
    }

    if (!flags.quiet && !json) {
      this.log(`Running example: ${r.name}`)
    }

    let result
    try {
      result = await r.run()
    } catch (err) {
      this.jsonAwareFail(json, `Example failed: ${(err as Error).message}`, EXIT_CODES.FAILURE)
    }

    const targetDir = path.join(flags.out, args.id)
    await fs.mkdir(targetDir, { recursive: true })
    for (const a of result.artifacts) {
      const filePath = path.join(targetDir, a.name)
      await fs.writeFile(filePath, a.content, 'utf8')
      if (!flags.quiet && !json) {
        this.log(`  wrote ${path.relative(process.cwd(), filePath)}`)
      }
    }

    if (flags.json) {
      this.log(
        JSON.stringify({
          id: args.id,
          artifacts: result.artifacts.map((a) => ({
            name: a.name,
            path: path.resolve(targetDir, a.name),
            bytes: Buffer.byteLength(a.content, 'utf8')
          }))
        })
      )
      return
    }

    if (!flags.quiet) {
      this.log(`✓ ${result.artifacts.length} artifact(s) written to ${path.resolve(targetDir)}/`)
    }
  }
}
