import { Args, Flags } from '@oclif/core'
import { ModelStore } from '@aelastics/synthesis/engine'

import { BaseCommand } from '../../base/base-command.js'
import { getModelsPath } from '../../config/index.js'
import { ModelClosureError, renderModel, renderReferenceClosure } from '../../models/loader.js'
import { errorMessage } from '../../support/errors.js'
import { EXIT_CODES } from '../../support/exit-codes.js'
import { isInteractiveSession } from '../../support/interactive.js'
import {
  DefaultConfigError,
  generateAndPersistDefaultConfig,
  resolveWritableRef
} from '../../tx/config-model.js'
import type { WritableTarget } from '../../tx/config-model.js'
import { EngineOutputBuffer } from '../../tx/engine-output.js'
import {
  CLOSURE_EXIT_CODES,
  renderTxParts,
  resolveInstalledTx,
  resolveSourceModel,
  SourceModelError,
  TxResolveError
} from '../../tx/load.js'
import type { ResolvedSourceModel, TxParts } from '../../tx/load.js'
import type { TxManifest } from '../../tx/manifest.js'

/** The parsed values the shared body runs on, identical for both paths. */
interface InitFlags {
  out?: string
  overwrite: boolean
  json?: boolean
  quiet?: boolean
  verbose?: boolean
}

export default class ConfigInit extends BaseCommand {
  static override description = `Generate the default configuration model for a transformation on a model.

Runs the transformation's default-configuration generation (one default choice per issue its binding model attaches, global and per-element) against the model named with --for and saves the result as an editable configuration model in the workspace; this is the same generation 'transformation run --default-configs' accepts in memory. Edit the saved file to steer the transformation, then pass it to 'transformation run --config'. In a terminal session, a missing transformation opens a picker over the installed configuration-based transformations and a missing --for over the models matching its source metamodel; piped, scripted, --json, --quiet, and CI invocations never prompt. Exit codes: 2 for a source-metamodel mismatch or a result that fails the import gate, 3 for an unknown transformation or missing model.`

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
    // The relaxed twin of the spec (derived generically in the base class)
    // shows what IS present before deciding between the interactive flow
    // and the strict re-parse.
    const relaxed = await this.parseRelaxed<InitFlags & { for?: string }>()
    if (!isInteractiveSession(relaxed.flags)) {
      // Non-interactive: the strict parse reproduces today's errors exactly.
      const { args, flags } = await this.parse(ConfigInit)
      await this.runParsed(args.tx, flags.for, flags)
      return
    }

    const flags = relaxed.flags
    const { completeConfigInitRequest } = await import('../../interactive/flows.js')
    const completed = await this.runInteractiveFlow(Boolean(flags.verbose), (deps) =>
      completeConfigInitRequest(deps, {
        txName: relaxed.args.tx,
        forRef: flags.for
      })
    )
    await this.runParsed(completed.txName, completed.forRef, flags)
  }

  private async runParsed(tx: string, forRef: string, flags: InitFlags): Promise<void> {
    const json = Boolean(flags.json)

    // 1. Resolve the installed transformation; only configuration-based ones
    // have anything to configure
    let packageDir: string
    let manifest: TxManifest
    try {
      ;({ packageDir, manifest } = await resolveInstalledTx(this.workspaceConfig, tx))
    } catch (err) {
      const exit = err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    if (!manifest.variability) {
      this.jsonAwareFail(
        json,
        `Transformation '${manifest.name}' is not configuration-based (its manifest declares no decision/binding model parts); there is nothing to configure.`,
        EXIT_CODES.FAILURE
      )
    }

    // 2. Resolve the source model and gate on its declared metamodel
    // (same shared step as tx run)
    const modelsDir = getModelsPath(this.workspaceConfig)
    let source: ResolvedSourceModel
    try {
      source = await resolveSourceModel(modelsDir, forRef, manifest)
    } catch (err) {
      const exit = err instanceof SourceModelError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    const inRef = source.ref

    // 3. Resolve the output ref before any engine work so clashes fail fast
    let target: WritableTarget
    try {
      target = resolveWritableRef(modelsDir, flags.out ?? `${inRef}-cfg`, flags.overwrite, 'Configuration model')
    } catch (err) {
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    // 4. Load closure + model + transformation parts into one store, then
    // generate the default configuration (the same machinery as tx run)
    const buffer = new EngineOutputBuffer(!flags.verbose)
    const store = new ModelStore()
    try {
      await buffer.run(() =>
        renderReferenceClosure(modelsDir, source.header?.references ?? {}, store, inRef, [inRef])
      )
    } catch (err) {
      buffer.flushToStderr()
      const exit = err instanceof ModelClosureError ? CLOSURE_EXIT_CODES[err.kind] : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    let inputRoot: unknown
    let parts: TxParts
    try {
      ;({ root: inputRoot } = await buffer.run(() => renderModel(source.path, store)))
      parts = await buffer.run(() => renderTxParts(packageDir, manifest, store))
    } catch (err) {
      buffer.flushToStderr()
      this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
    }

    // 5+6. Generate, announce, and persist through the gated writer, i.e.
    // the shared default-configuration flow (the gate re-renders the file with
    // the transformation's parts, exactly like model import --tx)
    let result
    try {
      result = await generateAndPersistDefaultConfig({
        buffer,
        store,
        inputRoot,
        parts,
        manifest,
        packageDir,
        sourceRef: inRef,
        modelsDir,
        target,
        announce: (line) => {
          if (!json) {
            this.log(line)
          }
        }
      })
    } catch (err) {
      buffer.flushToStderr()
      const exit = err instanceof DefaultConfigError ? err.exit : EXIT_CODES.FAILURE
      this.jsonAwareFail(json, errorMessage(err), exit)
    }
    for (const warning of result.warnings) {
      this.warn(warning)
    }

    if (json) {
      this.log(
        JSON.stringify({ tx: manifest.name, for: inRef, out: target.ref, decisions: result.decisions, written: [target.path] })
      )
    } else {
      this.log(`Wrote ${target.ref} (${target.path})`)
    }
  }
}
