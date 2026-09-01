import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { build } from 'esbuild'
import type { Plugin } from 'esbuild'
import { ModelStore } from '@aelastics/synthesis/engine'
import { Context } from '@aelastics/synthesis/jsx-runtime'

import { errorMessage } from '../support/errors.js'
import { parseSynthHeader } from './header.js'
import { normalizeRef, refToModelPath } from '../support/refs.js'

/** Result of importing a transpiled workspace model module. */
export interface ImportedModel {
  mod: Record<string, unknown>
  header: unknown
}

/** Result of rendering a workspace model into a ModelStore. */
export interface RenderedModel {
  root: unknown
  store: ModelStore
  header: unknown
}

const cliRequire = createRequire(import.meta.url)

// Bare specifiers (packages and node builtins) are resolved against the
// CLI's own node_modules and emitted as absolute-path externals. The
// imported model therefore shares the exact module instances -- and with
// them aelastics type/schema identity -- with the CLI process; bundling
// copies of metamodel packages would break that identity. Relative imports
// inside the model file are bundled as usual.
const externalizeBareImports: Plugin = {
  name: 'externalize-bare-imports',
  setup(pluginBuild) {
    pluginBuild.onResolve({ filter: /^[^./]/ }, (args) => {
      try {
        return { path: cliRequire.resolve(args.path), external: true }
      } catch {
        return {
          errors: [
            {
              text:
                `Cannot resolve import '${args.path}' (imported from ${args.importer}). ` +
                'Package imports must be resolvable from the Synthesis CLI installation.'
            }
          ]
        }
      }
    })
  }
}

/**
 * Transpile a workspace .tsx model file into an ESM JavaScript module in a
 * fresh temp directory and return the path of the emitted file. The caller
 * owns the temp directory (importModel removes it after importing).
 */
export async function transpileModel(filePath: string): Promise<string> {
  const sourcePath = resolve(filePath)
  const outDir = await mkdtemp(join(tmpdir(), 'synth-model-'))
  const outPath = join(outDir, `${basename(sourcePath).replace(/\.[^.]+$/, '')}.mjs`)
  try {
    await build({
      entryPoints: [sourcePath],
      outfile: outPath,
      bundle: true,
      format: 'esm',
      platform: 'node',
      // Defaults for model files without a /** @jsx */ pragma; esbuild still
      // honors an explicit pragma when one is present.
      jsx: 'transform',
      jsxFactory: 'createExprNode',
      logLevel: 'silent',
      plugins: [externalizeBareImports]
    })
  } catch (err) {
    // Nothing useful was emitted; do not leak the fresh temp directory
    await rm(outDir, { recursive: true, force: true }).catch(() => {})
    throw new Error(`Failed to transpile model ${sourcePath}: ${errorMessage(err)}`, { cause: err })
  }
  return outPath
}

/**
 * Transpile and dynamically import a workspace model file. The `$synth`
 * header is read from the imported module (the authoritative read path),
 * never parsed from the source text.
 */
export async function importModel(filePath: string): Promise<ImportedModel> {
  const outPath = await transpileModel(filePath)
  try {
    let mod: Record<string, unknown>
    try {
      mod = (await import(pathToFileURL(outPath).href)) as Record<string, unknown>
    } catch (err) {
      throw new Error(
        `Failed to import model ${filePath} (transpiled to ${outPath}): ${errorMessage(err)}`,
        { cause: err }
      )
    }
    return { mod, header: mod.$synth }
  } finally {
    // The module is in memory once the import settles; the emitted file is
    // no longer needed. Best-effort: a leftover temp dir must not fail the
    // import itself.
    await rm(dirname(outPath), { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Call a model/part factory `(store: ModelStore) => <jsx expression>` and
 * render the returned expression node into the store. Shared between
 * renderModel and `transformation run`'s package-part rendering so the factory-shape
 * checks cannot diverge. `what` names the factory in error messages.
 */
export function renderFactory(
  factory: unknown,
  store: ModelStore,
  context: Context = new Context(),
  what = 'the default export'
): unknown {
  if (typeof factory !== 'function') {
    throw new Error(`${what} is not a function (store: ModelStore) => JSX (got ${typeof factory})`)
  }
  const node = (factory as (s: ModelStore) => unknown)(store)
  if (
    node === null ||
    typeof node !== 'object' ||
    typeof (node as { render?: unknown }).render !== 'function'
  ) {
    throw new Error(`${what} did not return a JSX expression node (no .render method)`)
  }
  return (node as { render: (ctx: Context) => unknown }).render(context)
}

/**
 * Import a workspace model file and render it into a ModelStore. The module
 * must default-export a function `(store: ModelStore) => <jsx expression>`;
 * the returned expression node is rendered with a fresh Context.
 */
export async function renderModel(filePath: string, store?: ModelStore): Promise<RenderedModel> {
  const { mod, header } = await importModel(filePath)
  const factory = mod.default
  if (typeof factory !== 'function') {
    throw new Error(
      `Model ${filePath} must default-export a function (store: ModelStore) => JSX, got ${typeof factory}`
    )
  }
  const targetStore = store ?? new ModelStore()
  let root: unknown
  try {
    root = renderFactory(factory, targetStore)
  } catch (err) {
    throw new Error(`Failed to render model ${filePath}: ${errorMessage(err)}`, { cause: err })
  }
  return { root, store: targetStore, header }
}

/** Why loading a model's reference closure failed. */
export type ModelClosureErrorKind =
  /** A referenced ref is not a valid `<namespace>/<name>` ref. */
  | 'invalid-ref'
  /** A referenced model file does not exist in the workspace. */
  | 'missing-ref'
  /** A referenced model file has a `$synth` header that does not parse. */
  | 'header-parse-failure'
  /** A referenced model failed to transpile, import, or render. */
  | 'render-failure'

/** Typed failure from renderModelClosure; callers map `kind` to exit codes. */
export class ModelClosureError extends Error {
  public constructor(
    public readonly kind: ModelClosureErrorKind,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options)
  }
}

/**
 * Render every model reachable from a `references` map (depth-first: a
 * model's own references render before the model itself) into the store.
 * Reference cycles are cut on first visit; `exclude` names refs that must
 * not be (re)rendered, e.g. the referencing model itself. `origin` names
 * the referencing artifact in error messages. Failures are reported as
 * ModelClosureError so callers can distinguish a missing reference from a
 * broken one.
 */
export async function renderReferenceClosure(
  modelsDir: string,
  references: Record<string, string>,
  store: ModelStore,
  origin: string,
  exclude: Iterable<string> = []
): Promise<void> {
  const visited = new Set<string>(exclude)
  const renderReferences = async (refs: Record<string, string>): Promise<void> => {
    for (const target of Object.values(refs)) {
      let targetRef: string
      try {
        targetRef = normalizeRef(target)
      } catch (err) {
        throw new ModelClosureError('invalid-ref', `Invalid model reference '${target}': ${errorMessage(err)}`, {
          cause: err
        })
      }
      if (visited.has(targetRef)) {
        continue
      }
      visited.add(targetRef)
      const targetPath = refToModelPath(modelsDir, targetRef)
      if (!existsSync(targetPath)) {
        throw new ModelClosureError(
          'missing-ref',
          `Referenced model not found: ${targetRef} (required by ${origin} or its references)`
        )
      }
      const parsed = parseSynthHeader(await readFile(targetPath, 'utf-8'))
      if (parsed.error !== undefined) {
        throw new ModelClosureError(
          'header-parse-failure',
          `Referenced model ${targetRef} has a malformed $synth header: ${parsed.error}`
        )
      }
      // Depth-first: a model's own references render before the model itself
      await renderReferences(parsed.header?.references ?? {})
      try {
        await renderModel(targetPath, store)
      } catch (err) {
        throw new ModelClosureError(
          'render-failure',
          `Failed to load referenced model ${targetRef}: ${errorMessage(err)}`,
          { cause: err }
        )
      }
    }
  }
  await renderReferences(references)
}

/**
 * Render every model in the reference closure of `ref` (depth-first, the
 * ref itself excluded) into the store. See renderReferenceClosure for the
 * traversal and failure semantics.
 */
export async function renderModelClosure(
  modelsDir: string,
  ref: string,
  store: ModelStore
): Promise<void> {
  const rootRef = normalizeRef(ref)
  const rootPath = refToModelPath(modelsDir, rootRef)
  const rootParsed = parseSynthHeader(await readFile(rootPath, 'utf-8'))
  if (rootParsed.error !== undefined) {
    throw new ModelClosureError(
      'header-parse-failure',
      `Model ${rootRef} has a malformed $synth header: ${rootParsed.error}`
    )
  }
  await renderReferenceClosure(modelsDir, rootParsed.header?.references ?? {}, store, rootRef, [rootRef])
}

/**
 * Atomically replace (or create) a model file, but only when the new
 * content passes `gate`. The content is written to a temp file next to the
 * target, the gate runs against the temp file, and only on success is the
 * temp renamed over the target; a failing gate leaves any pre-existing
 * target untouched and removes the temp. The temp file keeps the `.tsx`
 * extension (the transpiler selects its loader by extension); its dotted
 * stem is not a valid ref segment, so the models-tree walker can never
 * mistake a leftover for a model.
 */
export async function writeGatedModelFile(
  targetPath: string,
  content: string,
  gate: (candidatePath: string) => Promise<unknown>
): Promise<void> {
  const tempPath = join(dirname(targetPath), `${basename(targetPath, '.tsx')}.${process.pid}.tmp.tsx`)
  await writeFile(tempPath, content, 'utf-8')
  try {
    await gate(tempPath)
  } catch (err) {
    await rm(tempPath, { force: true }).catch(() => {})
    throw err
  }
  await rename(tempPath, targetPath)
}
