import { createRequire } from 'node:module'
import { join } from 'node:path'

/**
 * Central bare-specifier resolution for everything the CLI transpiles or
 * imports on behalf of a workspace: model files, manifest entry modules,
 * and manifest parts. Kept free of heavy imports so the base command can
 * register roots without pulling in esbuild or the engine.
 */

const cliRequire = createRequire(import.meta.url)

// Additional resolution roots: installed transformation package
// directories. A metamodel package that ships as a dependency of an
// installed transformation resolves from here when it is not part of the
// CLI installation itself.
const resolutionRoots: string[] = []

// One resolution per bare specifier per process. Whichever location
// resolves a specifier first wins for everyone, so all importers in a run
// share one module instance even when several installed packages vendor
// their own copy; that is what keeps aelastics type identity intact.
const resolutionCache = new Map<string, string>()

/**
 * Register installed transformation package directories as fallback
 * resolution roots. Idempotent; the base command registers the
 * workspace's installed transformations on every invocation.
 */
export function registerModuleResolutionRoots(dirs: Iterable<string>): void {
  for (const dir of dirs) {
    if (!resolutionRoots.includes(dir)) {
      resolutionRoots.push(dir)
    }
  }
}

/**
 * Resolve a bare specifier to an absolute path: the CLI installation
 * first (framework packages must always be the CLI's own instances), then
 * each registered transformation root. Memoized per process so every
 * importer receives the same file, hence the same module instance.
 */
export function resolveBareSpecifier(specifier: string): string {
  const cached = resolutionCache.get(specifier)
  if (cached !== undefined) {
    return cached
  }
  let resolved: string | undefined
  try {
    resolved = cliRequire.resolve(specifier)
  } catch {
    for (const root of resolutionRoots) {
      try {
        resolved = createRequire(join(root, 'package.json')).resolve(specifier)
        break
      } catch {
        // try the next root
      }
    }
  }
  if (resolved === undefined) {
    throw new Error(
      `Cannot resolve import '${specifier}'. Package imports must be resolvable ` +
        'from the Synthesis CLI installation or from an installed transformation package.'
    )
  }
  resolutionCache.set(specifier, resolved)
  return resolved
}
