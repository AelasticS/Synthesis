/**
 * Model removal shared by `model rm` and `config rm`: the deletion mirror
 * of the import gate — the CLI never leaves dangling references. Either
 * nothing depends on the target, or the whole reverse-dependency closure
 * goes with it (--cascade).
 */

import { unlink } from 'node:fs/promises'

import { findTransitiveDependents, formatDependencyTree, refToModelPath } from '../support/refs.js'

/** Removal refused: dependents would be left dangling (use --cascade). */
export class DanglingDependentsError extends Error {
  public constructor(
    ref: string,
    public readonly tree: string[],
    dependentCount: number
  ) {
    super(
      `Cannot remove ${ref} — ${dependentCount} dependent model(s) would be left dangling:\n` +
        `${tree.join('\n')}\n` +
        'Remove or update them first, or pass --cascade to delete all of the above together.'
    )
  }
}

export interface ModelRemoval {
  /** Every deleted ref: the target first, then the cascaded dependents. */
  deleted: string[]
  /** Transitive dependents deleted alongside the target (empty without --cascade). */
  cascaded: string[]
  /** Rendered reverse-dependency tree (target first). */
  tree: string[]
}

/**
 * Delete a model (the ref must exist — callers gate on that) together with
 * its reverse-dependency closure when `cascade` is set. Refuses with
 * DanglingDependentsError when dependents exist and cascade is off.
 */
export async function removeModelWithDependents(
  modelsDir: string,
  ref: string,
  cascade: boolean
): Promise<ModelRemoval> {
  const { closure, edges } = await findTransitiveDependents(modelsDir, [ref])
  const tree = formatDependencyTree([ref], edges)
  if (closure.length > 0 && !cascade) {
    throw new DanglingDependentsError(ref, tree, closure.length)
  }
  const deleted = [ref, ...closure]
  for (const target of deleted) {
    await unlink(refToModelPath(modelsDir, target))
  }
  return { deleted, cascaded: closure, tree }
}

/** The machine-readable result object both rm commands emit with --json. */
export function removalJson(ref: string, path: string, removal: ModelRemoval): Record<string, unknown> {
  return removal.cascaded.length > 0
    ? { deleted: ref, path, cascaded: removal.cascaded }
    : { deleted: ref, path }
}

/** The human-readable lines both rm commands print without --json. */
export function removalLines(removal: ModelRemoval): string[] {
  const lines: string[] = []
  if (removal.cascaded.length > 0) {
    lines.push('Cascade delete of the dependency graph:')
    for (const line of removal.tree) {
      lines.push(`  ${line}`)
    }
  }
  for (const target of removal.deleted) {
    lines.push(`Deleted ${target}`)
  }
  return lines
}
