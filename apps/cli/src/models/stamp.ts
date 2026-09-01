/**
 * Shared $synth header stamping: re-derives the tool-maintained fields and
 * fills the human fields of a model file's header. Both `model import` and
 * `doctor --fix` go through stampModelText so their derivations cannot
 * diverge.
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { SYNTH_HEADER_KINDS, isPlainObject, parseSynthHeader, writeSynthHeader } from './header.js'
import type { SynthGeneratedBy, SynthHeader, SynthHeaderKind } from './header.js'

const execFileAsync = promisify(execFile)

export interface StampOptions {
  author?: string
  description?: string
  tags?: string[]
}

export interface StampResult {
  text: string
  header: SynthHeader
}

// Matches every import declaration's import clause and module specifier,
// including multi-line named imports and bare side-effect imports. A static
// heuristic: an 'import' at the start of a line inside a template literal
// would false-match, which is acceptable for metamodel derivation.
const IMPORT_SPECIFIER_RE = /^[ \t]*import\b([^'"]*)['"]([^'"]+)['"]/gm

// A statement-level `import type ...` is erased at compile time and never a
// runtime metamodel dependency. `import type from '...'` is the one value
// form starting with the keyword (a default import bound to `type`).
const TYPE_ONLY_CLAUSE_RE = /^\s*type\s(?!\s*from\s*$)/

// Support namespaces every model imports for rendering; never its metamodel.
const NON_METAMODEL_PACKAGES = [
  '@aelastics/synthesis/jsx',
  '@aelastics/synthesis/store',
  '@aelastics/synthesis/m2m',
  '@aelastics/synthesis/m2t',
  '@aelastics/synthesis/variability'
]

// Metamodels bundled into the merged library live under this subpath; they
// are metamodel candidates even though the rest of @aelastics/ is support.
const MERGED_METAMODELS_PREFIX = '@aelastics/synthesis/metamodels/'

function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('node:')
}

function isNonMetamodelPackage(specifier: string): boolean {
  if (specifier.startsWith('@aelastics/')) {
    return true
  }
  return NON_METAMODEL_PACKAGES.some((pkg) => specifier === pkg || specifier.startsWith(`${pkg}/`))
}

/**
 * Derive the metamodel specifier from a model file's imports: the first
 * import resolving under @synthesis/standard-metamodels or under the
 * merged library's @aelastics/synthesis/metamodels subpath anywhere in
 * the imports wins; otherwise the first bare import that is not one of the
 * library's support namespaces (jsx, store, m2m, m2t, variability) or any
 * other @aelastics support package. Statement-level
 * `import type ...` declarations are erased at compile time and ignored
 * entirely. Returns null when the file has no candidate.
 */
export function deriveMetamodel(fileText: string): string | null {
  const bare: string[] = []
  for (const match of fileText.matchAll(IMPORT_SPECIFIER_RE)) {
    if (TYPE_ONLY_CLAUSE_RE.test(match[1])) {
      continue
    }
    const specifier = match[2]
    if (isBareSpecifier(specifier)) {
      bare.push(specifier)
    }
  }
  const standard = bare.find(
    (specifier) =>
      specifier === '@synthesis/standard-metamodels' ||
      specifier.startsWith('@synthesis/standard-metamodels/') ||
      specifier.startsWith(MERGED_METAMODELS_PREFIX)
  )
  if (standard !== undefined) {
    return standard
  }
  return bare.find((specifier) => !isNonMetamodelPackage(specifier)) ?? null
}

async function gitConfigValue(key: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', key])
    const value = stdout.trim()
    return value === '' ? null : value
  } catch {
    // git not installed or the key is unset; the caller falls back
    return null
  }
}

// git config cannot change identity mid-process, so one lookup serves
// every stamp in the run (doctor --fix stamps many files in a loop).
let gitAuthorPromise: Promise<string | null> | undefined

/** `user.name <user.email>` from git config; null when neither is set. */
export function resolveGitAuthor(): Promise<string | null> {
  gitAuthorPromise ??= (async () => {
    const [name, email] = await Promise.all([gitConfigValue('user.name'), gitConfigValue('user.email')])
    if (name !== null && email !== null) {
      return `${name} <${email}>`
    }
    return name ?? email
  })()
  return gitAuthorPromise
}

export interface GeneratedHeaderOptions {
  /** Header kind; defaults to 'model'. */
  kind?: SynthHeaderKind
  metamodel: string
  generatedBy: Omit<SynthGeneratedBy, 'date'>
  description?: string
  references?: Record<string, string>
}

/**
 * Header for a model file the CLI generates itself (e.g. a `transformation run` m2m
 * result). Owns the same defaults stampModelText applies to imported
 * files (author from git config falling back to 'unknown', version
 * '0.1.0', fresh dates, empty tags/custom, null license) so generated
 * and imported headers cannot derive differently.
 */
export async function makeGeneratedHeader(options: GeneratedHeaderOptions): Promise<SynthHeader> {
  const now = new Date().toISOString()
  return {
    kind: options.kind ?? 'model',
    metamodel: options.metamodel,
    references: options.references ?? {},
    generatedBy: { ...options.generatedBy, date: now },
    createdAt: now,
    modifiedAt: now,
    author: (await resolveGitAuthor()) ?? 'unknown',
    version: '0.1.0',
    description: options.description ?? '',
    tags: [],
    license: null,
    custom: {}
  }
}

interface ExistingFields {
  kind?: SynthHeaderKind
  metamodel?: string
  references?: Record<string, string>
  generatedBy?: SynthGeneratedBy
  createdAt?: string
  author?: string
  version?: string
  description?: string
  tags?: string[]
  license?: string
  custom?: Record<string, unknown>
}

// Salvage only well-typed fields from a prior header (the parsed literal or
// a module's $synth export); everything else is re-derived. Empty strings
// count as absent so normalized defaults never mask derivation.
function pickExisting(value: unknown): ExistingFields {
  const existing: ExistingFields = {}
  if (!isPlainObject(value)) {
    return existing
  }
  if (typeof value.kind === 'string' && (SYNTH_HEADER_KINDS as readonly string[]).includes(value.kind)) {
    existing.kind = value.kind as SynthHeaderKind
  }
  if (typeof value.metamodel === 'string' && value.metamodel !== '') {
    existing.metamodel = value.metamodel
  }
  if (
    isPlainObject(value.references) &&
    Object.values(value.references).every((target) => typeof target === 'string')
  ) {
    existing.references = value.references as Record<string, string>
  }
  const gb = value.generatedBy
  if (isPlainObject(gb) && typeof gb.tx === 'string' && typeof gb.date === 'string') {
    const generatedBy: SynthGeneratedBy = { tx: gb.tx, date: gb.date }
    if (typeof gb.txVersion === 'string') {
      generatedBy.txVersion = gb.txVersion
    }
    if (typeof gb.config === 'string') {
      generatedBy.config = gb.config
    }
    existing.generatedBy = generatedBy
  }
  for (const field of ['createdAt', 'author', 'version', 'description'] as const) {
    const fieldValue = value[field]
    if (typeof fieldValue === 'string' && fieldValue !== '') {
      existing[field] = fieldValue
    }
  }
  if (Array.isArray(value.tags) && value.tags.every((tag) => typeof tag === 'string')) {
    existing.tags = value.tags as string[]
  }
  if (typeof value.license === 'string' && value.license !== '') {
    existing.license = value.license
  }
  if (isPlainObject(value.custom)) {
    existing.custom = value.custom
  }
  return existing
}

/**
 * Merge a (possibly missing or partial) existing header with re-derived
 * tool-maintained fields and write the result into the file text.
 * `moduleHeader` is the module's `$synth` export when the caller already
 * imported the file (the authoritative read path); the static parse of the
 * text is used otherwise.
 */
export async function stampModelText(
  fileText: string,
  moduleHeader?: unknown,
  options: StampOptions = {}
): Promise<StampResult> {
  const parsed = parseSynthHeader(fileText)
  const existing = pickExisting(parsed.header ?? moduleHeader)
  const now = new Date().toISOString()
  const header: SynthHeader = {
    kind: existing.kind ?? 'model',
    // An existing non-empty header value always wins: the header is the
    // declared metamodel. Derivation from the imports only fills the field
    // when the header never declared one.
    metamodel: existing.metamodel ?? deriveMetamodel(fileText) ?? '',
    references: existing.references ?? {},
    generatedBy: existing.generatedBy ?? null,
    createdAt: existing.createdAt ?? now,
    modifiedAt: now,
    author: options.author ?? existing.author ?? (await resolveGitAuthor()) ?? 'unknown',
    version: existing.version ?? '0.1.0',
    description: options.description ?? existing.description ?? '',
    tags: options.tags ?? existing.tags ?? [],
    license: existing.license ?? null,
    custom: existing.custom ?? {}
  }
  return { text: writeSynthHeader(fileText, header), header }
}
