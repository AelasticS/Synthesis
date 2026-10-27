/**
 * Module resolution hook that gives every importer the CLI's own instances
 * of the framework packages (@aelastics/*).
 *
 * Model files and transformation modules reach the framework through the
 * CLI's resolution (see models/resolution.ts). A metamodel package that an
 * installed transformation ships in its own node_modules is imported
 * natively, though, and Node resolves its imports from its own location:
 * outside a repository checkout there is no @aelastics/synthesis there at
 * all, and inside one it is a second copy whose types the CLI's engine
 * does not recognize. This hook resolves those imports from the CLI
 * installation instead, so one engine instance serves the whole process.
 *
 * Registered with module.register() in bin/run.js; it runs on the loader
 * thread, so it must stay free of CLI imports.
 */

import type { ResolveHook } from 'node:module'

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  if (specifier.startsWith('@aelastics/')) {
    try {
      // Resolved as if this file imported it, hence from the CLI's
      // node_modules. (import.meta.resolve is not available on the loader
      // thread in every Node 22 release.)
      return await nextResolve(specifier, { ...context, parentURL: import.meta.url })
    } catch {
      // Not part of the CLI installation: fall back to Node's resolution
    }
  }
  return nextResolve(specifier, context)
}
