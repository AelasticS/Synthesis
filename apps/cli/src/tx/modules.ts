/**
 * Import of transformation-package modules (entry point and parts).
 *
 * A manifest references modules in two forms:
 *   - bare package specifiers that resolve from the CLI installation are
 *     imported directly: they honour the packages' ESM export conditions
 *     and share the module registry (and with it aelastics type/schema
 *     identity) with the CLI process. A bare specifier the CLI cannot
 *     resolve falls back to the installed transformations' own
 *     dependencies (e.g. a metamodel package shipped with an example) and
 *     the resolved file is imported natively by absolute path. Native,
 *     not transpiled: everything else that references the same specifier
 *     externalizes to the same absolute path, so one module instance
 *     serves all importers; bundling here would evaluate a second copy of
 *     the module's relative imports and break schema identity;
 *   - './'-relative paths resolve against the installed package directory.
 *     An installed package has no live node_modules of its own, so the
 *     file is bundled with its bare imports externalized to resolved
 *     absolute paths (same mechanism the model loader uses).
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { importModel } from '../models/loader.js'
import { resolveBareSpecifier } from '../models/resolution.js'
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
    let resolved: string
    try {
      resolved = resolveBareSpecifier(moduleSpec)
    } catch (resolveErr) {
      throw new Error(`Cannot resolve module '${moduleSpec}': ${errorMessage(resolveErr)}`, {
        cause: err
      })
    }
    return (await import(pathToFileURL(resolved).href)) as Record<string, unknown>
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
