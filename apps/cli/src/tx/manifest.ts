/**
 * Transformation manifest reader.
 *
 * A transformation package declares what the CLI needs to know without
 * loading any code. The manifest lives in one of two places (the final
 * location is deliberately still open, see design/cli-execution §6):
 *
 *   1. a `synth.json` file at the package root — takes precedence
 *   2. a `synth` object inside the package's `package.json`
 *
 * `entry` and every `parts` module specifier may be either a
 * package-relative path (`./lib/transformation.js`) or a bare package
 * specifier (`@synthesis/examples/lib/...`). The manifest reader only
 * records them — resolution against the installed package happens at
 * execution time (`tx run`), when the modules are actually imported.
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type TxKind = 'm2m' | 'm2t'

/** Reference to a named export of a module shipped with the package. */
export interface TxPartRef {
  /** Package-relative path ('./lib/x.js') or bare package specifier. */
  module: string
  /** Named export inside that module. */
  exportName: string
}

/**
 * Modules of the transformation package itself, rendered into the store
 * before execution — in this order: metamodels, decisionModel,
 * bindingModel. These ship WITH the transformation; they are not
 * workspace models.
 */
export interface TxManifestParts {
  /** Functions `(store) => ExprNode`, rendered first. */
  metamodels?: TxPartRef[]
  decisionModel?: TxPartRef
  bindingModel?: TxPartRef
}

export interface TxManifest {
  /** From package.json `name`; synth.json may override. */
  name: string
  /** From package.json `version`. */
  version: string
  kind: TxKind
  /** Module exporting the transformation class, relative to package root or bare specifier. */
  entry: string
  /** Named export of the transformation class inside `entry`. */
  exportName: string
  source: { metamodel: string }
  target: {
    metamodel: string
    /**
     * Import specifier of the JSX component module of the target
     * metamodel — needed to wrap M2M output into a workspace model file.
     */
    components?: string
  }
  parts?: TxManifestParts
  /** True iff parts.decisionModel and parts.bindingModel are present. */
  variability: boolean
}

export const SYNTH_MANIFEST_FILENAME = 'synth.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

class ManifestError extends Error {}

async function readJsonFile(path: string): Promise<Record<string, unknown>> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(path, 'utf-8'))
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new ManifestError(`Failed to parse '${path}': ${reason}`)
  }
  if (!isRecord(parsed)) {
    throw new ManifestError(`Failed to parse '${path}': expected a JSON object at the top level.`)
  }
  return parsed
}

/**
 * Load and validate the transformation manifest of a package directory.
 *
 * Reads `synth.json` at the package root when present, otherwise the
 * `synth` object in `package.json`. Throws with a precise message (which
 * file, which field) when neither source exists or a required field is
 * missing or malformed. The legacy field names `sourceMetamodel` /
 * `targetMetamodel` are accepted as aliases for `source.metamodel` /
 * `target.metamodel` — only inside the package.json `synth` block.
 */
export async function loadTxManifest(packageDir: string): Promise<TxManifest> {
  const pkgJsonPath = join(packageDir, 'package.json')
  if (!existsSync(pkgJsonPath)) {
    throw new ManifestError(
      `No package.json found in '${packageDir}': a transformation package needs one for its name and version.`
    )
  }
  const pkg = await readJsonFile(pkgJsonPath)

  const synthJsonPath = join(packageDir, SYNTH_MANIFEST_FILENAME)
  let raw: Record<string, unknown>
  let manifestFile: string
  let allowLegacyAliases: boolean

  if (existsSync(synthJsonPath)) {
    raw = await readJsonFile(synthJsonPath)
    manifestFile = synthJsonPath
    allowLegacyAliases = false
  } else if (isRecord(pkg.synth)) {
    raw = pkg.synth
    manifestFile = `${pkgJsonPath} ("synth" block)`
    allowLegacyAliases = true
  } else {
    throw new ManifestError(
      `No transformation manifest found in '${packageDir}': expected a '${SYNTH_MANIFEST_FILENAME}' file at the package root or a "synth" object in package.json.`
    )
  }

  const fail = (field: string, problem: string): never => {
    throw new ManifestError(`Invalid transformation manifest in '${manifestFile}': field '${field}' ${problem}.`)
  }

  // name / version come from package.json; synth.json may override name.
  const name = isNonEmptyString(raw.name) ? raw.name : pkg.name
  if (!isNonEmptyString(name)) {
    throw new ManifestError(
      `Invalid transformation manifest in '${pkgJsonPath}': field 'name' is required (set "name" in package.json${
        allowLegacyAliases ? '' : ` or override it in ${SYNTH_MANIFEST_FILENAME}`
      }).`
    )
  }
  const version = pkg.version
  if (!isNonEmptyString(version)) {
    throw new ManifestError(`Invalid transformation manifest in '${pkgJsonPath}': field 'version' is required.`)
  }

  const kind = raw.kind
  if (kind === undefined) {
    fail('kind', `is required ('m2m' or 'm2t')`)
  }
  if (kind !== 'm2m' && kind !== 'm2t') {
    fail('kind', `must be 'm2m' or 'm2t' (got ${JSON.stringify(kind)})`)
  }

  if (!isNonEmptyString(raw.entry)) {
    fail('entry', 'is required (module exporting the transformation class)')
  }
  if (!isNonEmptyString(raw.exportName)) {
    fail('exportName', 'is required (named export of the transformation class)')
  }

  const source = normalizeEndpoint(raw, 'source', allowLegacyAliases, fail)
  const target = normalizeEndpoint(raw, 'target', allowLegacyAliases, fail)

  let components: string | undefined
  if (isRecord(raw.target) && raw.target.components !== undefined) {
    if (!isNonEmptyString(raw.target.components)) {
      fail('target.components', 'must be an import specifier string when present')
    }
    components = raw.target.components as string
  }

  const parts = normalizeParts(raw, fail)

  return {
    name,
    version: version as string,
    kind: kind as TxKind,
    entry: raw.entry as string,
    exportName: raw.exportName as string,
    source: { metamodel: source },
    target: components === undefined ? { metamodel: target } : { metamodel: target, components },
    ...(parts === undefined ? {} : { parts }),
    variability: parts?.decisionModel !== undefined && parts?.bindingModel !== undefined
  }
}

/** Resolve `source.metamodel` / `target.metamodel`, honouring the legacy aliases. */
function normalizeEndpoint(
  raw: Record<string, unknown>,
  side: 'source' | 'target',
  allowLegacyAliases: boolean,
  fail: (field: string, problem: string) => never
): string {
  const value = raw[side]
  if (value === undefined) {
    const alias = raw[`${side}Metamodel`]
    if (allowLegacyAliases && isNonEmptyString(alias)) {
      return alias
    }
    fail(side, `is required (an object with a 'metamodel' string)`)
  }
  if (!isRecord(value)) {
    fail(side, `must be an object with a 'metamodel' string`)
  }
  const metamodel = (value as Record<string, unknown>).metamodel
  if (!isNonEmptyString(metamodel)) {
    fail(`${side}.metamodel`, 'is required (metamodel identifier: package specifier or URI)')
  }
  return metamodel as string
}

function normalizeParts(
  raw: Record<string, unknown>,
  fail: (field: string, problem: string) => never
): TxManifestParts | undefined {
  if (raw.parts === undefined) {
    return undefined
  }
  if (!isRecord(raw.parts)) {
    fail('parts', 'must be an object')
  }
  const rawParts = raw.parts as Record<string, unknown>
  const parts: TxManifestParts = {}

  if (rawParts.metamodels !== undefined) {
    if (!Array.isArray(rawParts.metamodels)) {
      fail('parts.metamodels', 'must be an array of { module, exportName } entries')
    }
    parts.metamodels = (rawParts.metamodels as unknown[]).map((entry, i) =>
      validatePartRef(entry, `parts.metamodels[${i}]`, fail)
    )
  }
  if (rawParts.decisionModel !== undefined) {
    parts.decisionModel = validatePartRef(rawParts.decisionModel, 'parts.decisionModel', fail)
  }
  if (rawParts.bindingModel !== undefined) {
    parts.bindingModel = validatePartRef(rawParts.bindingModel, 'parts.bindingModel', fail)
  }
  if ((parts.decisionModel === undefined) !== (parts.bindingModel === undefined)) {
    fail(
      parts.decisionModel === undefined ? 'parts.decisionModel' : 'parts.bindingModel',
      `must be declared together with its counterpart (a decision-based transformation needs both 'parts.decisionModel' and 'parts.bindingModel')`
    )
  }
  return parts
}

function validatePartRef(
  value: unknown,
  field: string,
  fail: (field: string, problem: string) => never
): TxPartRef {
  if (!isRecord(value)) {
    fail(field, `must be an object with 'module' and 'exportName' strings`)
  }
  const ref = value as Record<string, unknown>
  if (!isNonEmptyString(ref.module)) {
    fail(`${field}.module`, 'is required (package-relative path or bare package specifier)')
  }
  if (!isNonEmptyString(ref.exportName)) {
    fail(`${field}.exportName`, 'is required (named export of the module)')
  }
  return { module: ref.module as string, exportName: ref.exportName as string }
}
