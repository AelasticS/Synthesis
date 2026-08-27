import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

import { build } from 'esbuild'
import type { Plugin } from 'esbuild'
import { ModelStore } from '@synthesis/engine'
import { Context } from '@synthesis/jsx-runtime'

import { errorMessage } from '../support/errors.js'

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
    const node = (factory as (s: ModelStore) => unknown)(targetStore)
    if (
      node === null ||
      typeof node !== 'object' ||
      typeof (node as { render?: unknown }).render !== 'function'
    ) {
      throw new Error('the default export did not return a JSX expression node (no .render method)')
    }
    root = (node as { render: (ctx: Context) => unknown }).render(new Context())
  } catch (err) {
    throw new Error(`Failed to render model ${filePath}: ${errorMessage(err)}`, { cause: err })
  }
  return { root, store: targetStore, header }
}
