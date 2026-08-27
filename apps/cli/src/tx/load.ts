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
import { renderFactory, renderModel, renderReferenceClosure } from '../models/loader.js'
import type { RenderedModel } from '../models/loader.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { loadTxManifest } from './manifest.js'
import type { TxManifest, TxPartRef } from './manifest.js'
import { importTxModule, requireExport } from './modules.js'

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
 */
export async function renderModelWithTxContext(
  filePath: string,
  txPackageDir: string,
  store: ModelStore = new ModelStore(),
  modelsDir?: string
): Promise<RenderedModelWithTxContext> {
  const manifest = await loadTxManifest(txPackageDir)
  const parts = await renderTxParts(txPackageDir, manifest, store)
  if (modelsDir !== undefined) {
    const parsed = parseSynthHeader(await readFile(filePath, 'utf-8'))
    if (parsed.error !== undefined) {
      throw new Error(`Model ${filePath} has a malformed $synth header: ${parsed.error}`)
    }
    await renderReferenceClosure(modelsDir, parsed.header?.references ?? {}, store, filePath)
  }
  const rendered = await renderModel(filePath, store)
  return { ...rendered, parts }
}
