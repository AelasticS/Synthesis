/**
 * Pure helpers for writing `tx run` results, kept free of command/engine
 * imports so their edge cases stay unit-testable.
 */

import { resolve, sep } from 'node:path'

// Quoted attribute values are stripped before tag scanning: a string like
// type="Set<Person>" is data, not a tag, and must not fabricate imports.
const QUOTED_ATTRIBUTE_RE = /"[^"]*"|'[^']*'/g
const JSX_TAG_RE = /<([A-Z][A-Za-z0-9_$]*)/g

/**
 * The distinct capitalized JSX tag names used in a serialized JSX text,
 * sorted. Text inside quoted attribute strings is ignored.
 */
export function uniqueJsxTags(jsx: string): string[] {
  const withoutStrings = jsx.replace(QUOTED_ATTRIBUTE_RE, '""')
  return [...new Set([...withoutStrings.matchAll(JSX_TAG_RE)].map((match) => match[1]))].sort()
}

/**
 * Wrap rendered model JSX into a complete workspace model module — the
 * shared skeleton behind tx run's m2m writer and the configuration-model
 * serializer: jsx pragma, import lines, `$synth` header text, and a
 * default-exported `(store) => (<jsx>)` factory.
 */
export function buildModelModuleSource(importLines: string[], headerText: string, body: string): string {
  return [
    '/** @jsx createExprNode */',
    '',
    ...importLines,
    '',
    headerText,
    '',
    'export default (store) => (',
    body,
    ')',
    ''
  ].join('\n')
}

/**
 * Resolve a generated Doc's item path against the output root. Doc names
 * come from the transformation, so they are untrusted: an empty path, the
 * output root itself, or anything escaping the root is rejected.
 * `outRoot` must already be resolved (absolute, no trailing separator).
 */
export function resolveDocDest(
  outRoot: string,
  itemPath: string
): { dest: string } | { error: string } {
  if (itemPath.trim() === '' || itemPath === '.') {
    return { error: 'empty document path' }
  }
  const dest = resolve(outRoot, itemPath)
  if (dest === outRoot) {
    return { error: 'resolves to the output directory itself' }
  }
  if (!dest.startsWith(outRoot + sep)) {
    return { error: 'resolves outside the output directory' }
  }
  return { dest }
}
