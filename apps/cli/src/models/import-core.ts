/**
 * The model-import machinery, callable without a subprocess: validation
 * render (the gate), header stamping, dependency check, and the copy into
 * the namespace tree. `model import` is a thin shell over this, and the
 * interactive import offer ("--in names a .tsx file; import it first?")
 * reuses it directly, so the two paths cannot drift: every message and
 * exit code lives here exactly once.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'

import { getModelsPath } from '../config/index.js'
import type { WorkspaceConfig } from '../config/index.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { findMissingReferences, normalizeRef, refToModelPath } from '../support/refs.js'
import { EngineOutputBuffer } from '../tx/engine-output.js'
import { ExecuteError } from '../tx/execute-error.js'
import { GateRenderError, renderForGate, TxResolveError } from '../tx/load.js'
import { stampModelText } from './stamp.js'

/**
 * Typed failure of the import machinery; `exit` maps to the CLI exit
 * code. An ExecuteError subclass so the interactive flows' hosts map it
 * with the same failFromExecuteError path as every other typed failure.
 */
export class ModelImportError extends ExecuteError {}

/**
 * The default-ref policy for importing a file: current namespace + file
 * basename, UN-normalized (callers decide how to report an invalid
 * result), or undefined when no namespace is set. `model import` without
 * --as and the interactive import offer share this single policy.
 */
export function defaultImportRef(
  workspaceConfig: Pick<WorkspaceConfig, 'currentNamespace'>,
  sourcePath: string
): string | undefined {
  const namespace = workspaceConfig.currentNamespace
  return namespace ? `${namespace}/${basename(sourcePath, '.tsx')}` : undefined
}

export interface ImportModelOptions {
  workspaceConfig: WorkspaceConfig
  /** Absolute path of the source .tsx file. */
  sourcePath: string
  /**
   * Target ref as requested (e.g. --as), normalized here, AFTER the
   * source-file checks, so their errors keep precedence. When omitted,
   * the shared default policy (`defaultImportRef`) applies.
   */
  ref?: string
  /** Installed transformation providing the render context (configuration models). */
  tx?: string
  author?: string
  description?: string
  tags?: string[]
  /** Overwrite an existing target model. */
  force?: boolean
  /** Pass engine output through instead of buffering it. */
  verbose?: boolean
}

export interface ImportedModel {
  ref: string
  sourcePath: string
  destPath: string
}

/**
 * Validate a .tsx model file and copy it into the workspace (design §5):
 * transpile + render into a throwaway store, stamp the `$synth` header,
 * require every header reference to resolve in the workspace, then write
 * to the ref's namespace path. Throws ModelImportError with the exact
 * message and exit code `model import` reports.
 */
export async function importModelFile(options: ImportModelOptions): Promise<ImportedModel> {
  const { workspaceConfig, sourcePath } = options

  if (!existsSync(sourcePath)) {
    throw new ModelImportError(EXIT_CODES.NOT_FOUND, `Source file not found: ${sourcePath}`)
  }
  if (!sourcePath.endsWith('.tsx')) {
    throw new ModelImportError(EXIT_CODES.FAILURE, `Source file must be a .tsx model module: ${sourcePath}`)
  }

  // Resolve the target ref only now: the file's own problems outrank a
  // ref problem, whether the ref was requested or defaulted.
  const requested = options.ref ?? defaultImportRef(workspaceConfig, sourcePath)
  if (requested === undefined) {
    throw new ModelImportError(EXIT_CODES.FAILURE, 'No namespace set. Use --as or set a current namespace.')
  }
  let ref: string
  try {
    ref = normalizeRef(requested)
  } catch (err) {
    throw new ModelImportError(EXIT_CODES.FAILURE, errorMessage(err), { cause: err })
  }

  const modelsDir = getModelsPath(workspaceConfig)
  const text = await readFile(sourcePath, 'utf-8')

  // Validation gate: the model must transpile, import, and render into a
  // throwaway store before anything is copied into the workspace. With
  // --tx, the installed transformation's parts render into the store
  // first: the context configuration models need.
  let moduleHeader: unknown
  const buffer = new EngineOutputBuffer(!options.verbose)
  try {
    ;({ header: moduleHeader } = await buffer.run(() =>
      renderForGate(workspaceConfig, sourcePath, options.tx, modelsDir)
    ))
  } catch (err) {
    buffer.flushToStderr()
    if (err instanceof TxResolveError) {
      throw new ModelImportError(err.exit, errorMessage(err), { cause: err })
    }
    if (err instanceof GateRenderError) {
      const prefix =
        err.missingRef !== undefined
          ? `Import rejected: missing dependency '${err.missingRef}'; `
          : 'Import rejected: '
      throw new ModelImportError(EXIT_CODES.VALIDATION_FAILURE, `${prefix}${err.message}${err.hint}`, { cause: err })
    }
    throw new ModelImportError(EXIT_CODES.VALIDATION_FAILURE, `Import rejected: ${errorMessage(err)}`, { cause: err })
  }

  const { text: stamped, header } = await stampModelText(text, moduleHeader, {
    author: options.author,
    description: options.description,
    tags: options.tags
  })

  // Every workspace ref the header depends on must already be imported
  for (const { key, target } of findMissingReferences(modelsDir, header.references)) {
    throw new ModelImportError(
      EXIT_CODES.VALIDATION_FAILURE,
      `Import rejected: missing dependency. Header reference '${key}' -> '${target}' is not in the workspace. Import it first.`
    )
  }

  const destPath = refToModelPath(modelsDir, ref)
  if (existsSync(destPath) && !options.force) {
    throw new ModelImportError(EXIT_CODES.FAILURE, `Model already exists: ${ref}. Use --force to overwrite.`)
  }
  await mkdir(dirname(destPath), { recursive: true })
  await writeFile(destPath, stamped, 'utf-8')

  return { ref, sourcePath, destPath }
}
