/**
 * Saved pipelines.
 *
 * A pipeline is a NAMED PROCESS: an ordered list of transformation steps,
 * stored as plain JSON (not a model) at `pipelines/<name>.json` in the
 * workspace. It deliberately stores NO data bindings: no input model, no
 * output target, no configuration, no consent flags. Stored bindings would
 * silently steer replays (the same hazard as implicit defaults), and a
 * stored configuration is provably wrong for any other input: a
 * configuration model's `references.sourceModel` must equal the model
 * being transformed. Every `pipeline run` therefore names its own data
 * (`--in`, output, consent) explicitly, per the normal policy.
 *
 * This module owns the schema (hand-rolled validation with precise field
 * errors, like the transformation manifest reader), the load/save/list
 * primitives, and the dependency scan behind the `transformation
 * uninstall` guard. Commands stay thin.
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { ExecuteError } from '../tx/execute-error.js'

/** Pipeline names are single ref segments: `pipelines/<name>.json`. */
const PIPELINE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/

export interface PipelineDefinition {
  /** Must equal the file stem (`pipelines/<name>.json`). */
  name: string
  /** Transformation names, in execution order (one = single step). */
  steps: string[]
  description: string
  createdAt: string
  modifiedAt: string
}

export function isValidPipelineName(name: string): boolean {
  return PIPELINE_NAME_PATTERN.test(name)
}

/**
 * Why `name` cannot become a NEW pipeline, or undefined when it can:
 * the segment grammar, and no shadowing of an installed transformation
 * (one name meaning two runnable things invites invoking the wrong one).
 * Shared by `pipeline mk` and `transformation run --save-as`, the only
 * two places that create pipelines.
 */
export function newPipelineNameProblem(name: string, installedTxNames: Iterable<string>): string | undefined {
  if (!isValidPipelineName(name)) {
    return `Invalid pipeline name '${name}': names must contain only letters, digits, hyphen or underscore.`
  }
  for (const txName of installedTxNames) {
    if (txName === name) {
      return `Pipeline name '${name}' would shadow the installed transformation of the same name. Choose a different name.`
    }
  }
  return undefined
}

export function pipelinePath(pipelinesDir: string, name: string): string {
  return join(pipelinesDir, `${name}.json`)
}

/** Whether `name` addresses a saved pipeline file (invalid names never do). */
export function pipelineFileExists(pipelinesDir: string, name: string): boolean {
  return isValidPipelineName(name) && existsSync(pipelinePath(pipelinesDir, name))
}

export interface PipelineValidation {
  /** The validated definition, or null when `errors` is non-empty. */
  pipeline: PipelineDefinition | null
  /** Every schema problem found, with the offending field named. */
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

const KNOWN_FIELDS = new Set(['name', 'steps', 'description', 'createdAt', 'modifiedAt'])

/**
 * Validate a parsed pipeline file against the process-only schema,
 * collecting EVERY problem (not just the first) so `pipeline edit` and
 * `doctor` can report them all at once. Unknown fields are errors: the
 * legacy data-binding fields (`in`, `out`, `config`, ...) must not
 * silently survive in a file that no longer honors them.
 */
export function validatePipeline(raw: unknown, expectedName?: string): PipelineValidation {
  const errors: string[] = []
  if (!isRecord(raw)) {
    return { pipeline: null, errors: ['expected a JSON object at the top level'] }
  }

  for (const key of Object.keys(raw)) {
    if (!KNOWN_FIELDS.has(key)) {
      errors.push(
        `unknown field '${key}' (a pipeline stores only the process: name, steps, description, createdAt, modifiedAt)`
      )
    }
  }

  let name = ''
  if (!isNonEmptyString(raw.name)) {
    errors.push(`field 'name' is required (the pipeline's own name)`)
  } else if (!isValidPipelineName(raw.name)) {
    errors.push(`field 'name' must contain only letters, digits, hyphen or underscore (got '${raw.name}')`)
  } else if (expectedName !== undefined && raw.name !== expectedName) {
    errors.push(`field 'name' is '${raw.name}' but the file is '${expectedName}.json' (they must match)`)
  } else {
    name = raw.name
  }

  const steps: string[] = []
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    errors.push(`field 'steps' must be a non-empty array of transformation names`)
  } else {
    for (const [index, step] of raw.steps.entries()) {
      if (!isNonEmptyString(step)) {
        errors.push(`field 'steps[${index}]' must be a transformation name`)
      } else {
        steps.push(step)
      }
    }
  }

  const optionalString = (field: 'description' | 'createdAt' | 'modifiedAt'): string => {
    const value = raw[field]
    if (value === undefined) {
      return ''
    }
    if (typeof value !== 'string') {
      errors.push(`field '${field}' must be a string`)
      return ''
    }
    return value
  }
  const description = optionalString('description')
  const createdAt = optionalString('createdAt')
  const modifiedAt = optionalString('modifiedAt')

  if (errors.length > 0) {
    return { pipeline: null, errors }
  }
  return {
    pipeline: { name, steps, description, createdAt, modifiedAt },
    errors: []
  }
}

/**
 * Read and validate one pipeline file without throwing: an unreadable or
 * unparseable file reports errors like a schema violation. The non-throwing
 * twin of `loadPipeline`, for `doctor` and `pipeline edit`.
 */
export async function readPipelineFile(pipelinesDir: string, name: string): Promise<PipelineValidation> {
  const path = pipelinePath(pipelinesDir, name)
  let parsed: unknown
  try {
    parsed = JSON.parse(await readFile(path, 'utf-8'))
  } catch (err) {
    return { pipeline: null, errors: [`not readable as JSON: ${errorMessage(err)}`] }
  }
  return validatePipeline(parsed, name)
}

/**
 * Load a saved pipeline by name. Throws ExecuteError: NOT_FOUND when no
 * file exists (or the name is not even a valid pipeline name),
 * VALIDATION_FAILURE when the file exists but violates the schema; every
 * problem is listed, with `pipeline edit` as the repair path.
 */
export async function loadPipeline(pipelinesDir: string, name: string): Promise<PipelineDefinition> {
  if (!pipelineFileExists(pipelinesDir, name)) {
    throw new ExecuteError(
      EXIT_CODES.NOT_FOUND,
      `Pipeline not found: ${name} (looked for ${pipelinePath(pipelinesDir, name)}). See 'synth pipeline ls'.`
    )
  }
  const { pipeline, errors } = await readPipelineFile(pipelinesDir, name)
  if (pipeline === null) {
    throw new ExecuteError(
      EXIT_CODES.VALIDATION_FAILURE,
      `Pipeline '${name}' is invalid (fix it with 'synth pipeline edit ${name}'):\n  ${errors.join('\n  ')}`
    )
  }
  return pipeline
}

/** Write a pipeline definition to `pipelines/<name>.json`, creating the directory. */
export async function savePipeline(pipelinesDir: string, pipeline: PipelineDefinition): Promise<string> {
  const path = pipelinePath(pipelinesDir, pipeline.name)
  await mkdir(pipelinesDir, { recursive: true })
  await writeFile(path, JSON.stringify(pipeline, null, 2) + '\n', 'utf-8')
  return path
}

/**
 * The `*.json` stems in the pipelines directory, sorted. A missing
 * directory (older workspace, nothing saved yet) yields an empty list;
 * any OTHER readdir failure (permissions, a file where the directory
 * should be) throws: silently treating it as empty would misreport the
 * workspace.
 */
async function pipelineFileNames(pipelinesDir: string): Promise<string[]> {
  let files: string[]
  try {
    files = await readdir(pipelinesDir)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw new Error(`Cannot read the pipelines directory ${pipelinesDir}: ${errorMessage(err)}`)
  }
  const names = files.filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -'.json'.length))
  names.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return names
}

export interface PipelineListEntry {
  name: string
  path: string
  /** null when the file is unreadable or violates the schema. */
  pipeline: PipelineDefinition | null
  errors: string[]
}

/**
 * All `*.json` files in the pipelines directory, each with its validation
 * result. Files whose stem is not a valid pipeline name are included with
 * an error; no `pipeline run <name>` can ever address them.
 */
export async function listPipelines(pipelinesDir: string): Promise<PipelineListEntry[]> {
  const entries: PipelineListEntry[] = []
  for (const name of await pipelineFileNames(pipelinesDir)) {
    const path = pipelinePath(pipelinesDir, name)
    if (!isValidPipelineName(name)) {
      entries.push({
        name,
        path,
        pipeline: null,
        errors: [`file name '${name}.json' is not a valid pipeline name (letters, digits, hyphen or underscore)`]
      })
      continue
    }
    const { pipeline, errors } = await readPipelineFile(pipelinesDir, name)
    entries.push({ name, path, pipeline, errors })
  }
  return entries
}

/**
 * Names of the saved pipelines whose steps include the transformation:
 * the `transformation uninstall` guard. Steps are extracted LENIENTLY
 * (best-effort from the raw JSON, even when the file fails schema
 * validation): an invalid-but-repairable pipeline still protects the
 * transformations its steps name. Only a file that is not JSON at all
 * protects nothing.
 */
export async function findPipelinesUsingTx(pipelinesDir: string, txName: string): Promise<string[]> {
  const names: string[] = []
  for (const name of await pipelineFileNames(pipelinesDir)) {
    let raw: unknown
    try {
      raw = JSON.parse(await readFile(pipelinePath(pipelinesDir, name), 'utf-8'))
    } catch {
      continue
    }
    if (isRecord(raw) && Array.isArray(raw.steps) && raw.steps.some((step) => step === txName)) {
      names.push(name)
    }
  }
  return names
}
