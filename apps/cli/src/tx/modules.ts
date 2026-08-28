/**
 * Import of transformation-package modules (entry point and parts).
 *
 * A manifest references modules in two forms:
 *   - bare package specifiers are imported directly: they resolve against
 *     the CLI installation itself (the CLI's dependencies are the runtime
 *     the packages compile against), honour the packages' ESM export
 *     conditions, and share the module registry (and with it aelastics
 *     type/schema identity) with the CLI process;
 *   - './'-relative paths resolve against the installed package directory.
 *     An installed package has no node_modules of its own, so the file is
 *     bundled with its bare imports externalized to CLI-resolved absolute
 *     paths (same mechanism the model loader uses).
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { importModel } from '../models/loader.js'
import { errorMessage } from '../support/errors.js'

/** Import a manifest-referenced module of an installed transformation package. */
export async function importTxModule(
  packageDir: string,
  moduleSpec: string
): Promise<Record<string, unknown>> {
  if (moduleSpec.startsWith('./') || moduleSpec.startsWith('../')) {
    const filePath = resolve(packageDir, moduleSpec)
    if (!existsSync(filePath)) {
      throw new Error(
        `Module '${moduleSpec}' not found in the installed package (looked for ${filePath})`
      )
    }
    const { mod } = await importModel(filePath)
    return mod
  }
  try {
    return (await import(moduleSpec)) as Record<string, unknown>
  } catch (err) {
    throw new Error(
      `Cannot resolve module '${moduleSpec}': package imports must be resolvable from the Synthesis CLI installation (${errorMessage(err)})`,
      { cause: err }
    )
  }
}

/**
 * A named export of an imported module, or undefined. CommonJS modules
 * imported dynamically may surface named exports only under `default`.
 */
export function moduleExport(mod: Record<string, unknown>, exportName: string): unknown {
  if (mod[exportName] !== undefined) {
    return mod[exportName]
  }
  const fallback = mod.default
  if (typeof fallback === 'object' && fallback !== null) {
    return (fallback as Record<string, unknown>)[exportName]
  }
  return undefined
}

/** The named export of an imported module, or a precise error. */
export function requireExport(
  mod: Record<string, unknown>,
  moduleSpec: string,
  exportName: string
): unknown {
  const value = moduleExport(mod, exportName)
  if (value === undefined) {
    throw new Error(`Module '${moduleSpec}' has no export named '${exportName}'`)
  }
  return value
}
