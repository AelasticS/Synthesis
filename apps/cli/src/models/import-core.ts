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
import { findMissingReferences, listModels, normalizeRef, refToModelPath } from '../support/refs.js'
import { EngineOutputBuffer } from '../tx/engine-output.js'
import { ExecuteError } from '../tx/execute-error.js'
import { GateRenderError, renderForGate, TxResolveError } from '../tx/load.js'
import { parseSynthHeader, writeSynthHeader } from './header.js'
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
  /**
   * Installed models to load before this one (any model kind), recorded in
   * the header's references. A configuration model's source model is picked
   * out among them.
   */
  dependencies?: string[]
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
  /** Refs recorded in the header's references (--dependency or auto-resolved). */
  dependencies: string[]
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
  // --tx (or the header's generatedBy), the installed transformation's
  // parts render into the store first: the context configuration models
  // need. The source model they configure is a workspace ref the file
  // cannot name itself (the namespace is the user's), so it comes from
  // --dependency or, failing that, from the one installed model that defines
  // the dangling name.
  const buffer = new EngineOutputBuffer(!options.verbose)
  const runGate = (references: Record<string, string>) =>
    buffer.run(() => renderForGate(workspaceConfig, sourcePath, options.tx, modelsDir, references))

  let dependencies: string[]
  try {
    dependencies = [...new Set((options.dependencies ?? []).map((dependency) => normalizeRef(dependency)))]
  } catch (err) {
    throw new ModelImportError(EXIT_CODES.FAILURE, errorMessage(err), { cause: err })
  }
  for (const dependency of dependencies) {
    if (!existsSync(refToModelPath(modelsDir, dependency))) {
      throw new ModelImportError(
        EXIT_CODES.NOT_FOUND,
        `Dependency not found in the workspace: ${dependency}. Import it first.`
      )
    }
  }
  let references = await dependencyReferences(modelsDir, text, dependencies)

  let moduleHeader: unknown
  try {
    try {
      ;({ header: moduleHeader } = await runGate(references))
    } catch (err) {
      const candidates =
        dependencies.length === 0 && err instanceof GateRenderError && err.hint !== ''
          ? await findSourceCandidates(modelsDir, err.missingRef)
          : []
      if (candidates.length !== 1) {
        if (candidates.length > 1 && err instanceof GateRenderError) {
          throw new GateRenderError(
            err.message,
            `${err.hint} Candidates: ${candidates.join(', ')}.`,
            err.missingRef,
            { cause: err }
          )
        }
        throw err
      }
      // A wrong guess fails again below with its own, more specific error
      dependencies = candidates
      references = await dependencyReferences(modelsDir, text, dependencies)
      ;({ header: moduleHeader } = await runGate(references))
    }
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

  const stampedFile = await stampModelText(text, moduleHeader, {
    author: options.author,
    description: options.description,
    tags: options.tags
  })
  let { text: stamped, header } = stampedFile

  // Make the workspace copy self-contained: record the dependencies the
  // gate needed and the transformation that gave it context
  const recordTx = options.tx !== undefined && header.generatedBy === null
  if (dependencies.length > 0 || recordTx) {
    header = {
      ...header,
      references: { ...header.references, ...references },
      generatedBy: recordTx ? { tx: options.tx as string, date: header.modifiedAt } : header.generatedBy
    }
    stamped = writeSynthHeader(text, header)
  }

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

  return { ref, sourcePath, destPath, dependencies }
}

// A static text match on `name="<Name>"`: the model file declares that name
function definesName(fileText: string, name: string): boolean {
  return new RegExp(`\\bname=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(fileText)
}

/**
 * The `$synth.references` entries for the dependencies a model is imported
 * with: every dependency is a model to load before it, keyed by its name.
 * A configuration model's own `sourceModel` entry (the model it configures,
 * which `config show` and `transformation run --config` read) is the one
 * dependency that defines the schema its `sourceModel` element names, when
 * exactly one does.
 */
async function dependencyReferences(
  modelsDir: string,
  text: string,
  dependencies: string[]
): Promise<Record<string, string>> {
  const header = parseSynthHeader(text).header
  const sourceName =
    header?.kind === 'configuration-model' && header.references.sourceModel === undefined
      ? /sourceModel=\{\s*<Model\s+\$refByName="\/\/[^/"]+\/([^/"]+)"/.exec(text)?.[1]
      : undefined
  const defining: string[] = []
  if (sourceName !== undefined) {
    for (const dependency of dependencies) {
      if (definesName(await readFile(refToModelPath(modelsDir, dependency), 'utf-8'), sourceName)) {
        defining.push(dependency)
      }
    }
  }
  const references: Record<string, string> = {}
  for (const dependency of dependencies) {
    const isSource = defining.length === 1 && dependency === defining[0]
    const base = dependency.slice(dependency.lastIndexOf('/') + 1)
    let key = isSource ? 'sourceModel' : base
    for (let n = 2; key in references || (!isSource && key === 'sourceModel'); n++) {
      key = `${base}_${n}`
    }
    references[key] = dependency
  }
  return references
}

/**
 * The installed models that define the element named by a dangling
 * `//host/<Name>/...` reference. The gate re-render verifies a single
 * candidate that gets used.
 */
async function findSourceCandidates(modelsDir: string, missingRef: string | undefined): Promise<string[]> {
  const name = missingRef === undefined ? undefined : /^\/\/[^/]+\/([^/]+)/.exec(missingRef)?.[1]
  if (name === undefined) {
    return []
  }
  const matches: string[] = []
  for (const { ref, path } of await listModels(modelsDir)) {
    const fileText = await readFile(path, 'utf-8')
    if (parseSynthHeader(fileText).header?.kind !== 'configuration-model' && definesName(fileText, name)) {
      matches.push(ref)
    }
  }
  return matches
}
