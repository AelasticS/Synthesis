import { readFile } from 'node:fs/promises'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader } from '../../models/header.js'
import type { SynthHeader } from '../../models/header.js'
import { errorMessage } from '../../support/errors.js'
import { listModels, namespaceExists } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'

interface ModelRow {
  ref: string
  header: SynthHeader | null
  error?: string
}

export default class ModelLs extends BaseCommand {
  static override description = 'List models in the workspace or a namespace.'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --ns com.example.orders'
  ]

  public async execute(): Promise<void> {
    const { flags } = await this.parse(ModelLs)
    const json = Boolean(flags.json)

    const modelsDir = getModelsPath(this.workspaceConfig)
    // --ns overrides currentNamespace via BaseCommand; no namespace lists all
    const namespace = this.workspaceConfig.currentNamespace

    // A namespace filter must name an existing directory; only the
    // unfiltered listing may run against whatever the tree contains
    if (namespace) {
      let exists = false
      try {
        exists = namespaceExists(modelsDir, namespace)
      } catch (err) {
        this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
      }
      if (!exists) {
        this.jsonAwareFail(json, `Namespace '${namespace}' does not exist`, EXIT_CODES.NOT_FOUND)
      }
    }

    const entries = await listModels(modelsDir, namespace)

    const rows: ModelRow[] = []
    for (const entry of entries) {
      // Static fast path only: no transpile, no execution. One unreadable
      // file marks its own row instead of aborting the whole listing.
      try {
        const text = await readFile(entry.path, 'utf-8')
        rows.push({ ref: entry.ref, header: parseSynthHeader(text).header })
      } catch (err) {
        rows.push({ ref: entry.ref, header: null, error: errorMessage(err) })
      }
    }

    if (json) {
      this.log(JSON.stringify(rows))
      return
    }

    if (rows.length === 0) {
      this.log(namespace ? `No models found in namespace ${namespace}.` : 'No models found.')
      return
    }

    const width = Math.max(...rows.map((row) => row.ref.length))
    for (const row of rows) {
      if (row.error !== undefined) {
        this.log(`${row.ref.padEnd(width)}  (unreadable)`)
      } else if (row.header === null) {
        this.log(`${row.ref.padEnd(width)}  (no header)`)
      } else {
        const version = row.header.version === '' ? '-' : row.header.version
        this.log(
          `${row.ref.padEnd(width)}  ${row.header.kind}  ${version}  ${row.header.description}`.trimEnd()
        )
      }
    }
  }
}
