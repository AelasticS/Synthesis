import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { Args, Flags } from '@oclif/core'
import { ModelStore } from '@synthesis/engine'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { parseSynthHeader } from '../../models/header.js'
import {
  ModelClosureError,
  renderModel,
  renderModelClosure
} from '../../models/loader.js'
import { errorMessage } from '../../support/errors.js'
import { normalizeRef, refToModelPath } from '../../support/refs.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { generateDefaultConfigModel, writeConfigModelFile } from '../../tx/config-model.js'
import { collectDecisions, formatDecisionAnnouncement } from '../../tx/decisions.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import { renderTxParts, resolveInstalledTx, TxResolveError } from '../../tx/load.js'
import type { TxParts } from '../../tx/load.js'
import type { TxManifest } from '../../tx/manifest.js'

export default class ConfigInit extends BaseCommand {
  static override description = `Generate the default configuration model for a transformation on a model.

Runs the transformation's default-configuration generation (one default choice per issue its binding model attaches, global and per-element) against the model named with --for and saves the result as an editable configuration model in the workspace — the same generation 'tx run' performs implicitly when --config is omitted. Edit the saved file to steer the transformation, then pass it to 'tx run --config'. Exit codes: 2 for a source-metamodel mismatch or a result that fails the import gate, 3 for an unknown transformation or missing model.`

  static override examples = [
    '<%= config.bin %> <%= command.id %> eer-to-relational --for com.example/persons',
    '<%= config.bin %> <%= command.id %> eer-to-relational --for com.example/persons --out com.example/persons-config'
  ]

  static override args = {
    tx: Args.string({
      description: 'Installed transformation to create a configuration for.',
      required: true
    })
  }

  static override flags = {
    for: Flags.string({
      description: 'Model ref this configuration applies to.',
      required: true
    }),
    out: Flags.string({
      description: "Ref to store the configuration model as (default: '<namespace>/<name>-cfg' derived from --for)."
    }),
    overwrite: Flags.boolean({
      description: 'Replace the configuration model if it already exists.',
      default: false
    })
  }

  public async execute(): Promise<void> {
    const { args, flags } = await this.parse(ConfigInit)
    const json = Boolean(flags.json)

    // 1. Resolve the installed transformation; only decision-based ones
    // have anything to configure
    let packageDir: string
    let manifest: TxManifest
    try {
      ;({ packageDir, manifest } = await resolveInstalledTx(this.workspaceConfig, args.tx))
    } catch (err) {
      const exit = err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    if (!manifest.variability) {
      this.jsonAwareFail(
        json,
        `Transformation '${manifest.name}' is not decision-based (its manifest declares no decision/binding model parts); there is nothing to configure.`,
        EXIT_CODES.FAILURE
      )
    }

    // 2. Resolve the source model and gate on its declared metamodel
    let inRef: string
    try {
      inRef = normalizeRef(flags.for)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }
    const modelsDir = getModelsPath(this.workspaceConfig)
    const inPath = refToModelPath(modelsDir, inRef)
    if (!existsSync(inPath)) {
      this.jsonAwareFail(json, `Model not found: ${inRef} (looked for ${inPath})`, EXIT_CODES.NOT_FOUND)
    }
    const inParsed = parseSynthHeader(await readFile(inPath, 'utf-8'))
    if (inParsed.error !== undefined) {
      this.jsonAwareFail(
        json,
        `Model ${inRef} has a malformed $synth header: ${inParsed.error}`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }
    const inHeader = inParsed.header
    if (inHeader !== null && inHeader.metamodel !== '' && inHeader.metamodel !== manifest.source.metamodel) {
      this.jsonAwareFail(
        json,
        `Type mismatch: model ${inRef} declares metamodel '${inHeader.metamodel}' but transformation '${manifest.name}' expects '${manifest.source.metamodel}'.`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    // 3. Resolve the output ref before any engine work so clashes fail fast
    let outRef: string
    try {
      outRef = normalizeRef(flags.out ?? `${inRef}-cfg`)
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }
    const outPath = refToModelPath(modelsDir, outRef)
    if (existsSync(outPath) && !flags.overwrite) {
      this.jsonAwareFail(
        json,
        `Configuration model already exists: ${outRef}. Use --overwrite to replace it.`,
        EXIT_CODES.FAILURE
      )
    }

    // 4. Load closure + model + transformation parts into one store, then
    // generate the default configuration — the same machinery as tx run
    const buffer = new EngineOutputBuffer(!flags.verbose)
    const store = new ModelStore()
    try {
      await buffer.run(() => renderModelClosure(modelsDir, inRef, store))
    } catch (err) {
      buffer.flushToStderr()
      const exit = err instanceof ModelClosureError && err.kind === 'missing-ref' ? EXIT_CODES.NOT_FOUND : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    let inputRoot: unknown
    let parts: TxParts
    let configModel: unknown
    try {
      ;({ root: inputRoot } = await buffer.run(() => renderModel(inPath, store)))
      parts = await buffer.run(() => renderTxParts(packageDir, manifest, store))
      configModel = await buffer.run(() => generateDefaultConfigModel(store, inputRoot, parts.bindingModel))
    } catch (err) {
      buffer.flushToStderr()
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    // 5. Announce the decisions the configuration records — same code path
    // as tx run's implicit generation
    const decisions = collectDecisions(store, configModel, parts.decisionModel)
    if (!json) {
      for (const announcement of decisions) {
        this.log(formatDecisionAnnouncement(announcement))
      }
    }

    // 6. Persist through the gated writer; the gate re-renders the file
    // with the transformation's parts, exactly like model import --tx
    try {
      await buffer.run(() =>
        writeConfigModelFile({
          store,
          configModel,
          decisionModel: parts.decisionModel,
          manifest,
          packageDir,
          sourceRef: inRef,
          targetPath: outPath,
          modelsDir
        })
      )
    } catch (err) {
      buffer.flushToStderr()
      this.jsonAwareFail(
        json,
        `Generated configuration model failed the import gate (${outRef} was left unchanged): ${errorMessage(err)}`,
        EXIT_CODES.VALIDATION_FAILURE
      )
    }

    if (json) {
      this.log(JSON.stringify({ tx: manifest.name, for: inRef, out: outRef, decisions, written: [outPath] }))
    } else {
      this.log(`Wrote ${outRef} (${outPath})`)
    }
  }
}
