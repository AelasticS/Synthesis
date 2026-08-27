import { Args } from '@oclif/core'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { namespaceToDir } from '../../support/refs.js'

export default class NsMk extends BaseCommand {
  static override description = 'Create an empty namespace.'

  static override examples = ['<%= config.bin %> <%= command.id %> com.example.orders']

  static override args = {
    namespace: Args.string({
      description: 'Name of the namespace to create.',
      required: true
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(NsMk)
    const modelsPath = getModelsPath(this.workspaceConfig)

    if (!existsSync(modelsPath)) {
      this.error('Workspace not initialized. Run `synth init` first.')
    }

    let nsPath: string
    try {
      // com.example -> <models>/com/example
      nsPath = namespaceToDir(modelsPath, args.namespace)
    } catch (err) {
      this.error(errorMessage(err))
    }

    if (existsSync(nsPath)) {
      if (flags.json) {
        this.log(JSON.stringify({ created: false, namespace: args.namespace, error: 'already exists' }))
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
