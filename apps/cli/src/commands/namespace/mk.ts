import { Args } from '@oclif/core'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { namespaceToDir } from '../../support/refs.js'

export default class NamespaceMk extends BaseCommand {
  static override aliases = ['ns:mk']

  static override description = 'Create an empty namespace.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example.orders']

  static override args = {
    namespace: Args.string({
      description: 'Name of the namespace to create.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(NamespaceMk)
    const json = Boolean(flags.json)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      this.jsonAwareFail(json, 'Workspace not initialized. Run `synth init` first.', EXIT_CODES.WORKSPACE_ERROR)
    }

    let nsPath: string
    try {
      // com.example -> <models>/com/example
      nsPath = namespaceToDir(modelsPath, args.namespace)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    if (existsSync(nsPath)) {
      // A no-op, not a failure: the requested state already holds (mkdir -p
      // semantics), but say so instead of claiming a creation.
      if (json) {
        this.log(JSON.stringify({ created: false, namespace: args.namespace, path: nsPath }))
      } else {
        this.log(`Namespace '${args.namespace}' already exists.`)
      }
      return
    }

    await mkdir(nsPath, { recursive: true })

    if (flags.json) {
      this.log(JSON.stringify({ created: true, namespace: args.namespace, path: nsPath }))
    } else {
      this.log(`Created namespace: ${args.namespace}`)
    }
  }
}
