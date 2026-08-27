/**
 * Ref/path mapping for the nested workspace model tree.
 *
 * A ref is `<namespace>/<name>`; the namespace is dot-separated and maps
 * to nested directories: `com.example/persons` <-> `<modelsDir>/com/example/persons.tsx`.
 *
 * The tree is strictly nested: every directory level is one namespace
 * segment and every model file lives inside a namespace. Entries that
 * cannot be addressed by a ref (directories whose names are not valid
 * segments, `.tsx` files at the models root, model files whose stem is
 * not a valid name) are skipped by the walker and reported via
 * `scanModelsTree` so `doctor` can surface them.
 */

import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

const SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/

export interface ParsedRef {
  namespace: string
  name: string
}

export interface ModelEntry {
  ref: string
  path: string
}

/** A models-tree entry the walker cannot address with a ref. */
export interface SkippedEntry {
  path: string
  reason: string
}

/** Full result of one models-tree walk. */
export interface ModelsTreeScan {
  /** All namespaces (any directory at any depth), dotted, sorted. */
  namespaces: string[]
  /** All addressable model files, sorted by ref. */
  models: ModelEntry[]
  /** Entries no ref can address, sorted by path. */
  skipped: SkippedEntry[]
}

function splitNamespace(namespace: string, label: string): string[] {
  // Accept '/' as an alternative separator so refs like `com/example/persons`
  // and dotted namespaces normalize to the same segments.
  const segments = namespace.split(/[./]/)
  for (const segment of segments) {
    if (!SEGMENT_PATTERN.test(segment)) {
      throw new Error(
        `Invalid ${label} '${namespace}': segments must be non-empty and contain only letters, digits, hyphen or underscore`
      )
    }
  }
  return segments
}

/**
 * Parse a `<namespace>/<name>` ref. The namespace may be dotted
 * (`com.example/persons`) or slash-separated (`com/example/persons`);
 * the returned namespace is always dotted.
 */
export function parseRef(ref: string): ParsedRef {
  const slash = ref.lastIndexOf('/')
  if (slash < 0) {
    throw new Error(`Invalid ref '${ref}': expected <namespace>/<name>, e.g. com.example/persons`)
  }
  const name = ref.slice(slash + 1)
  if (!SEGMENT_PATTERN.test(name)) {
    throw new Error(
      `Invalid ref '${ref}': model name must be non-empty and contain only letters, digits, hyphen or underscore`
    )
  }
  const namespace = splitNamespace(ref.slice(0, slash), 'ref namespace').join('.')
  return { namespace, name }
}

/**
 * `com.example/persons` -> `<modelsDir>/com/example/persons.tsx`
 */
export function refToModelPath(modelsDir: string, ref: string): string {
  const { namespace, name } = parseRef(ref)
  return join(namespaceToDir(modelsDir, namespace), `${name}.tsx`)
}

/**
 * `com.example` -> `<modelsDir>/com/example`
 */
export function namespaceToDir(modelsDir: string, namespace: string): string {
  return join(modelsDir, ...splitNamespace(namespace, 'namespace'))
}

/**
 * Whether the namespace has a directory in the nested tree.
 * Throws for a namespace that violates the segment grammar.
 */
export function namespaceExists(modelsDir: string, namespace: string): boolean {
  return existsSync(namespaceToDir(modelsDir, namespace))
}

/**
 * `<modelsDir>/com/example` -> `com.example`. Every path segment must be a
 * valid namespace segment; a dot-named directory (`<modelsDir>/com.example`)
 * is not addressable and is rejected.
 */
export function dirToNamespace(modelsDir: string, dir: string): string {
  const rel = relative(resolve(modelsDir), resolve(dir))
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Directory '${dir}' is not a namespace inside '${modelsDir}'`)
  }
  const segments = rel.split(sep)
  for (const segment of segments) {
    if (!SEGMENT_PATTERN.test(segment)) {
      throw new Error(
        `Directory '${dir}' is not a namespace: '${segment}' is not a valid namespace segment`
      )
    }
  }
  return segments.join('.')
}

async function readDirEntries(dir: string): Promise<Dirent[]> {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch {
    // Missing or unreadable directory reads as empty
    return []
  }
}

interface WalkResult {
  namespaces: Set<string>
  models: ModelEntry[]
  skipped: SkippedEntry[]
}

async function walk(dir: string, namespace: string, out: WalkResult): Promise<void> {
  for (const entry of await readDirEntries(dir)) {
    // Hidden entries (.git, .DS_Store, ...) are never namespaces or models
    if (entry.name.startsWith('.')) {
      continue
    }
    const entryPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SEGMENT_PATTERN.test(entry.name)) {
        // A dot-named flat directory ('com.example') has no ref addressing it
        out.skipped.push({
          path: entryPath,
          reason: `directory name '${entry.name}' is not a valid namespace segment`
        })
        continue
      }
      const childNamespace = namespace === '' ? entry.name : `${namespace}.${entry.name}`
      out.namespaces.add(childNamespace)
      await walk(entryPath, childNamespace, out)
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      const name = entry.name.slice(0, -'.tsx'.length)
      if (namespace === '') {
        out.skipped.push({
          path: entryPath,
          reason: 'model file at the models root has no namespace'
        })
        continue
      }
      if (!SEGMENT_PATTERN.test(name)) {
        out.skipped.push({
          path: entryPath,
          reason: `model name '${name}' is not a valid ref segment`
        })
        continue
      }
      out.models.push({ ref: `${namespace}/${name}`, path: entryPath })
    }
  }
}

/**
 * Walk the whole models tree once and return namespaces, models, and every
 * entry the nested layout cannot address. A missing modelsDir yields empty
 * lists.
 */
export async function scanModelsTree(modelsDir: string): Promise<ModelsTreeScan> {
  const out: WalkResult = { namespaces: new Set<string>(), models: [], skipped: [] }
  await walk(modelsDir, '', out)
  // Code-unit comparison keeps ordering locale-independent
  const byString = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
  return {
    namespaces: [...out.namespaces].sort(byString),
    models: out.models.sort((a, b) => byString(a.ref, b.ref)),
    skipped: out.skipped.sort((a, b) => byString(a.path, b.path))
  }
}

/**
 * All namespaces in the tree (any directory at any depth), dotted, sorted.
 * A missing modelsDir yields an empty list.
 */
export async function listNamespaces(modelsDir: string): Promise<string[]> {
  return (await scanModelsTree(modelsDir)).namespaces
}

/**
 * All addressable `*.tsx` model files in the tree, optionally filtered to a
 * namespace (including its sub-namespaces). A missing modelsDir yields an
 * empty list.
 */
export async function listModels(modelsDir: string, namespace?: string): Promise<ModelEntry[]> {
  const filter = namespace === undefined ? undefined : splitNamespace(namespace, 'namespace').join('.')
  const { models } = await scanModelsTree(modelsDir)
  if (filter === undefined) {
    return models
  }
  return models.filter((model) => {
    const slash = model.ref.lastIndexOf('/')
    const modelNamespace = slash < 0 ? '' : model.ref.slice(0, slash)
    return modelNamespace === filter || modelNamespace.startsWith(`${filter}.`)
  })
}

/**
 * The header references (key -> ref) that do not resolve to an existing
 * model file in the workspace. Invalid refs count as missing.
 */
export function findMissingReferences(
  modelsDir: string,
  references: Record<string, string>
): Array<{ key: string; target: string }> {
  const missing: Array<{ key: string; target: string }> = []
  for (const [key, target] of Object.entries(references)) {
    let targetPath: string | null
    try {
      targetPath = refToModelPath(modelsDir, target)
    } catch {
      targetPath = null
    }
    if (targetPath === null || !existsSync(targetPath)) {
      missing.push({ key, target })
    }
  }
  return missing
}
