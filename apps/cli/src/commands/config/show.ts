import { Args, Flags } from '@oclif/core'
import { ModelStore } from '@synthesis/engine'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { ConfigModelResolveError, resolveConfigurationModel } from '../../tx/config-model.js'
import type { ResolvedConfigModel } from '../../tx/config-model.js'
import { collectDecisions, formatDecisionAnnouncement } from '../../tx/decisions.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import { renderModelWithTxContext, resolveInstalledTx, TxResolveError } from '../../tx/load.js'

export default class ConfigShow extends BaseCommand {
  static override description = `Render a configuration model and print every decision it records.

The model renders with its transformation's context (decision/binding models); the transformation is taken from the header's generatedBy, or from --tx for hand-written configurations.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> com.example/persons-cfg',
    '<%= config.bin %> <%= command.id %> com.example/persons-cfg --tx eer-to-relational'
  ]

  static override args = {
    ref: Args.string({
      description: 'Configuration model ref to show.',
      required: true
    })
  }

  static override flags = {
    tx: Flags.string({
      description: "Installed transformation providing the render context (default: the header's generatedBy.tx)."
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ConfigShow)
    const json = Boolean(flags.json)

    const modelsDir = getModelsPath(this.workspaceConfig)
    let resolved: ResolvedConfigModel
    try {
      resolved = await resolveConfigurationModel(modelsDir, args.ref)
    } catch (err) {
      if (err instanceof ConfigModelResolveError) {
        this.jsonAwareFail(json, err.message, err.exit)
      }
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }
    const { ref, path: modelPath, header } = resolved

    const txName = flags.tx ?? header.generatedBy?.tx
    if (txName === undefined) {
      this.jsonAwareFail(
        json,
        `${ref} does not record the transformation it belongs to (no generatedBy in the header); pass --tx <name>.`,
        EXIT_CODES.FAILURE
      )
    }
    let packageDir: string
    try {
      ;({ packageDir } = await resolveInstalledTx(this.workspaceConfig, txName))
    } catch (err) {
      const exit = err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }

    const buffer = new EngineOutputBuffer(!flags.verbose)
    let root: unknown
    let decisionModel: unknown
    let store: ModelStore
    try {
      store = new ModelStore()
      const rendered = await buffer.run(() => renderModelWithTxContext(modelPath, packageDir, store, modelsDir))
      root = rendered.root
      decisionModel = rendered.parts.decisionModel
    } catch (err) {
      buffer.flushToStderr()
      this.jsonAwareFail(
        json,
        `Configuration model ${ref} failed to render with '${txName}' context: ${errorMessage(err)}`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    const decisions = collectDecisions(store, root, decisionModel)
    const sourceModel = header.references.sourceModel

    if (json) {
      this.log(JSON.stringify({ ref, path: modelPath, tx: txName, sourceModel: sourceModel ?? null, decisions }))
      return
    }

    this.log(`Ref:          ${ref}`)
    this.log(`Path:         ${modelPath}`)
    this.log(`Tx:           ${txName}`)
    this.log(`Source model: ${sourceModel ?? '(none declared)'}`)
    if (header.generatedBy !== null) {
      const gb = header.generatedBy
      const version = gb.txVersion !== undefined ? `@${gb.txVersion}` : ''
      this.log(`Generated:    by ${gb.tx}${version} on ${gb.date}`)
    } else {
      this.log('Generated:    (authored)')
    }
    this.log('Decisions:')
    if (decisions.length === 0) {
      this.log('  (none)')
    }
    for (const announcement of decisions) {
      this.log(`  ${formatDecisionAnnouncement(announcement)}`)
    }
  }
}
