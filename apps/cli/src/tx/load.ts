/**
 * Loading an installed transformation's execution context.
 *
 * Shared between `tx run`, `config init`, `config show`, and the --tx
 * variants of `model import`/`model validate`: resolving the installed
 * package, rendering its manifest-declared parts (metamodels, decision
 * model, binding model) into a store, and rendering a workspace model
 * *with* that context so files whose `$refByName` references point into
 * the transformation's parts (configuration models) can render at all.
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ModelStore } from '@synthesis/engine'
import { Context } from '@synthesis/jsx-runtime'

import type { WorkspaceConfig } from '../config/index.js'
import { parseSynthHeader } from '../models/header.js'
import type { SynthHeader } from '../models/header.js'
import { renderFactory, renderModel, renderReferenceClosure } from '../models/loader.js'
import type { ModelClosureErrorKind, RenderedModel } from '../models/loader.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { modelPathToRef, normalizeRef, refToModelPath } from '../support/refs.js'
import { loadTxManifest } from './manifest.js'
import type { TxManifest, TxPartRef } from './manifest.js'
import { importTxModule, requireExport } from './modules.js'

/**
 * A broken reference closure maps to the same exit codes the equivalent
 * direct failure would produce: missing model -> NOT_FOUND, malformed
 * header -> VALIDATION_FAILURE, everything else -> FAILURE. One table for
 * every command that loads a closure (`tx run`, `config init`).
 */
export const CLOSURE_EXIT_CODES: Record<ModelClosureErrorKind, number> = {
  'invalid-ref': EXIT_CODES.FAILURE,
  'missing-ref': EXIT_CODES.NOT_FOUND,
  'header-parse-failure': EXIT_CODES.VALIDATION_FAILURE,
  'render-failure': EXIT_CODES.FAILURE
}

/** Failure to resolve an installed transformation; `exit` maps to the CLI exit code. */
export class TxResolveError extends Error {
  public constructor(
    public readonly exit: number,
    message: string
  ) {
    super(message)
  }
}

export interface InstalledTx {
  /** Installed package directory. */
  packageDir: string
  manifest: TxManifest
}

/**
 * Resolve an installed transformation by name: workspace-config entry,
 * package directory on disk, and a valid manifest. Throws TxResolveError
 * with the exit code the failure maps to (NOT_FOUND for unknown/vanished,
 * FAILURE for a broken manifest).
 */
export async function resolveInstalledTx(
  workspaceConfig: WorkspaceConfig,
  txName: string
): Promise<InstalledTx> {
  const entry = workspaceConfig.transformations[txName]
  if (entry === undefined) {
    const installed = Object.keys(workspaceConfig.transformations)
    const hint =
      installed.length > 0
        ? `Installed transformations: ${installed.join(', ')}`
        : `No transformations installed. Use 'synth tx install' to install one.`
    throw new TxResolveError(EXIT_CODES.NOT_FOUND, `Transformation not found: ${txName}. ${hint}`)
  }
  // A config entry whose package directory has vanished is a missing
  // resource, not a generic failure: name what is gone and how to fix it.
  if (!existsSync(entry.path) || !existsSync(join(entry.path, 'package.json'))) {
    throw new TxResolveError(
      EXIT_CODES.NOT_FOUND,
      `Transformation '${txName}' is registered in the workspace config but its installed package is missing (expected ${entry.path} with a package.json). Reinstall it with 'synth tx install'.`
    )
  }
  let manifest: TxManifest
  try {
    manifest = await loadTxManifest(entry.path)
  } catch (err) {
    throw new TxResolveError(EXIT_CODES.FAILURE, errorMessage(err))
  }
  return { packageDir: entry.path, manifest }
}

/** Typed failure of `resolveSourceModel`; `exit` maps to the CLI exit code. */
export class SourceModelError extends Error {
  public constructor(
    public readonly exit: number,
    message: string
  ) {
    super(message)
  }
}

export interface ResolvedSourceModel {
  ref: string
  path: string
  header: SynthHeader | null
}

/**
 * Resolve the source model a transformation is applied to: normalize the
 * ref, find the file, parse the `$synth` header (a malformed header is a
 * broken declaration, not a missing one — the gate cannot be silently
 * skipped), and gate the declared metamodel against the manifest. Shared
 * by `tx run --in` and `config init --for` so checks, wording, and exit
 * codes cannot drift.
 */
export async function resolveSourceModel(
  modelsDir: string,
  rawRef: string,
  manifest: TxManifest
): Promise<ResolvedSourceModel> {
  let ref: string
  try {
    ref = normalizeRef(rawRef)
  } catch (err) {
    throw new SourceModelError(EXIT_CODES.FAILURE, errorMessage(err))
  }
  const path = refToModelPath(modelsDir, ref)
  if (!existsSync(path)) {
    throw new SourceModelError(EXIT_CODES.NOT_FOUND, `Source model not found: ${ref} (looked for ${path})`)
  }
  const parsed = parseSynthHeader(await readFile(path, 'utf-8'))
  if (parsed.error !== undefined) {
    throw new SourceModelError(
      EXIT_CODES.VALIDATION_FAILURE,
      `Source model ${ref} has a malformed $synth header: ${parsed.error}`
    )
  }
  const header = parsed.header
  if (header !== null && header.metamodel !== '' && header.metamodel !== manifest.source.metamodel) {
    throw new SourceModelError(
      EXIT_CODES.VALIDATION_FAILURE,
      `Type mismatch: source model ${ref} declares metamodel '${header.metamodel}' but transformation '${manifest.name}' expects '${manifest.source.metamodel}'.`
    )
  }
  return { ref, path, header }
}

/** Roots of the package parts rendered into a store. */
export interface TxParts {
  decisionModel?: unknown
  bindingModel?: unknown
}

/**
 * Render a transformation package's own parts into the store, in manifest
 * order: metamodels, decisionModel, bindingModel. These ship WITH the
 * package — they are not workspace models. Every part failure names the
 * manifest field and module it came from.
 */
export async function renderTxParts(
  packageDir: string,
  manifest: TxManifest,
  store: ModelStore,
  context: Context = new Context()
): Promise<TxParts> {
  const renderPart = async (part: TxPartRef, label: string): Promise<unknown> => {
    try {
      const mod = await importTxModule(packageDir, part.module)
      const factory = requireExport(mod, part.module, part.exportName)
      return renderFactory(factory, store, context, `export '${part.exportName}'`)
    } catch (err) {
      throw new Error(
        `Failed to render ${label} (${part.module} export ${part.exportName}): ${errorMessage(err)}`,
        { cause: err }
      )
    }
  }
  for (const [index, metamodel] of (manifest.parts?.metamodels ?? []).entries()) {
    await renderPart(metamodel, `parts.metamodels[${index}]`)
  }
  const parts: TxParts = {}
  if (manifest.parts?.decisionModel !== undefined) {
    parts.decisionModel = await renderPart(manifest.parts.decisionModel, 'parts.decisionModel')
  }
  if (manifest.parts?.bindingModel !== undefined) {
    parts.bindingModel = await renderPart(manifest.parts.bindingModel, 'parts.bindingModel')
  }
  return parts
}

/** renderModelWithTxContext result: the rendered model plus the part roots. */
export interface RenderedModelWithTxContext extends RenderedModel {
  parts: TxParts
}

/**
 * Render a workspace model file with an installed transformation's context:
 * the package's parts render into the store first, then (when `modelsDir`
 * is given) the reference closure from the file's own `$synth` header, and
 * finally the file itself. This is the render gate for configuration
 * models, whose `$refByName` references reach into the transformation's
 * decision/binding models and into the source model they configure — a
 * plain renderModel of such a file can never resolve them.
 *
 * A caller that already loaded the package manifest passes it to skip the
 * re-read. When the file lives inside the models tree, its own ref is
 * excluded from the closure (mirroring renderModelClosure's root
 * exclusion) so a reference cycle back to the file never renders it twice.
 */
export async function renderModelWithTxContext(
  filePath: string,
  txPackageDir: string,
  store: ModelStore = new ModelStore(),
  modelsDir?: string,
  manifest?: TxManifest
): Promise<RenderedModelWithTxContext> {
  const txManifest = manifest ?? (await loadTxManifest(txPackageDir))
  const parts = await renderTxParts(txPackageDir, txManifest, store)
  if (modelsDir !== undefined) {
    const parsed = parseSynthHeader(await readFile(filePath, 'utf-8'))
    if (parsed.error !== undefined) {
      throw new Error(`Model ${filePath} has a malformed $synth header: ${parsed.error}`)
    }
    const ownRef = modelPathToRef(modelsDir, filePath)
    await renderReferenceClosure(
      modelsDir,
      parsed.header?.references ?? {},
      store,
      filePath,
      ownRef === null ? [] : [ownRef]
    )
  }
  const rendered = await renderModel(filePath, store)
  return { ...rendered, parts }
}

// A dangling $refByName means the model references an element that neither
// the file itself nor the store provides.
const DANGLING_REF_RE = /Not existing object referenced with name "([^"]+)"/

/**
 * Typed render failure of the model gate; carries the classified pieces
 * the commands compose their messages from.
 */
export class GateRenderError extends Error {
  public constructor(
    message: string,
    /** Ready-to-append hint ('' or the configuration-model --tx hint). */
    public readonly hint: string,
    /** The dangling `$refByName` target, when the failure is a missing dependency. */
    public readonly missingRef?: string,
    options?: { cause?: unknown }
  ) {
    super(message, options)
  }
}

/**
 * The validation render shared by `model import` and `model validate`:
 * plain renderModel without --tx, renderModelWithTxContext (installed
 * package parts + header reference closure) with it. Render failures are
 * rethrown as GateRenderError with the configuration-model hint and the
 * dangling-ref classification already computed; a failure to resolve the
 * installed transformation propagates as TxResolveError.
 */
export async function renderForGate(
  workspaceConfig: WorkspaceConfig,
  filePath: string,
  txName: string | undefined,
  modelsDir: string
): Promise<{ header: unknown }> {
  let txPackageDir: string | undefined
  let manifest: TxManifest | undefined
  if (txName !== undefined) {
    ;({ packageDir: txPackageDir, manifest } = await resolveInstalledTx(workspaceConfig, txName))
  }
  try {
    const rendered =
      txPackageDir === undefined
        ? await renderModel(filePath)
        : await renderModelWithTxContext(filePath, txPackageDir, new ModelStore(), modelsDir, manifest)
    return { header: rendered.header }
  } catch (err) {
    const message = errorMessage(err)
    // A configuration model's references only resolve with its
    // transformation's parts in the store; point at the flag that loads them
    let kind: string | undefined
    try {
      kind = parseSynthHeader(await readFile(filePath, 'utf-8')).header?.kind
    } catch {
      kind = undefined
    }
    const hint =
      txPackageDir === undefined && kind === 'configuration-model'
        ? ` Hint: configuration models render only with their transformation's context — pass --tx <name> (e.g. the transformation named in the header's generatedBy).`
        : ''
    const dangling = DANGLING_REF_RE.exec(message)
    throw new GateRenderError(message, hint, dangling?.[1], { cause: err })
  }
}
