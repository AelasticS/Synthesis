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
import { readdir, readFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'

import { parseSynthHeader } from '../models/header.js'

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
 * Parse and re-serialize a ref into its canonical `<namespace>/<name>`
 * form (namespace dotted). Throws exactly like `parseRef` for invalid refs.
 */
export function normalizeRef(ref: string): string {
  const { namespace, name } = parseRef(ref)
  return `${namespace}/${name}`
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
 * `<modelsDir>/com/example/persons.tsx` -> `com.example/persons`, the
 * inverse of `refToModelPath`. Returns null when the path is not an
 * addressable model file inside the nested tree (outside the tree, at the
 * tree root, or with segments the ref grammar cannot express).
 */
export function modelPathToRef(modelsDir: string, filePath: string): string | null {
  const rel = relative(resolve(modelsDir), resolve(filePath))
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel) || !rel.endsWith('.tsx')) {
    return null
  }
  const segments = rel.slice(0, -'.tsx'.length).split(sep)
  if (segments.length < 2 || segments.some((segment) => !SEGMENT_PATTERN.test(segment))) {
    return null
  }
  return `${segments.slice(0, -1).join('.')}/${segments[segments.length - 1]}`
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
export interface DependentReference {
  dependent: string
  key: string
  target: string
}

export interface DependencyGraph {
  /** Transitive dependents of the roots (roots excluded), BFS order. */
  closure: string[]
  /** Every reference edge reaching into roots ∪ closure (self-references excluded). */
  edges: DependentReference[]
}

/**
 * The full reverse-dependency closure of the given roots: every model
 * that would be left dangling, directly or transitively, if the roots
 * were deleted. One header scan over the workspace builds the reverse
 * adjacency; models with unreadable/unparseable headers are skipped
 * (doctor reports those separately).
 */
export async function findTransitiveDependents(
  modelsDir: string,
  roots: Iterable<string>
): Promise<DependencyGraph> {
  const rootSet = new Set(roots)
  if (rootSet.size === 0) {
    return { closure: [], edges: [] }
  }
  const reverse = new Map<string, DependentReference[]>()
  for (const model of await listModels(modelsDir)) {
    let text: string
    try {
      text = await readFile(model.path, 'utf-8')
    } catch {
      continue
    }
    const { header } = parseSynthHeader(text)
    if (header === null) {
      continue
    }
    for (const [key, target] of Object.entries(header.references)) {
      if (model.ref === target) {
        continue
      }
      const list = reverse.get(target) ?? []
      list.push({ dependent: model.ref, key, target })
      reverse.set(target, list)
    }
  }
  const closure: string[] = []
  const edges: DependentReference[] = []
  const seen = new Set(rootSet)
  const queue = [...rootSet]
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const edge of reverse.get(current) ?? []) {
      edges.push(edge)
      if (!seen.has(edge.dependent)) {
        seen.add(edge.dependent)
        closure.push(edge.dependent)
        queue.push(edge.dependent)
      }
    }
  }
  return { closure, edges }
}

/**
 * Render the reverse-dependency graph as an indented tree, one line per
 * model: each level shows who references the level above (and via which
 * key). Cycles are cut with an [already listed] marker.
 */
export function formatDependencyTree(roots: Iterable<string>, edges: DependentReference[]): string[] {
  const reverse = new Map<string, DependentReference[]>()
  for (const edge of edges) {
    const list = reverse.get(edge.target) ?? []
    list.push(edge)
    reverse.set(edge.target, list)
  }
  const lines: string[] = []
  const visited = new Set<string>()
  const visit = (ref: string, depth: number, key?: string): void => {
    const indent = '  '.repeat(depth)
    const suffix = key === undefined ? '' : `  (${key})`
    if (visited.has(ref)) {
      lines.push(`${indent}<- ${ref}${suffix}  [already listed]`)
      return
    }
    visited.add(ref)
    lines.push(depth === 0 ? ref : `${indent}<- ${ref}${suffix}`)
    for (const edge of reverse.get(ref) ?? []) {
      visit(edge.dependent, depth + 1, edge.key)
    }
  }
  for (const root of roots) {
    if (!visited.has(root)) {
      visit(root, 0)
    }
  }
  return lines
}

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
