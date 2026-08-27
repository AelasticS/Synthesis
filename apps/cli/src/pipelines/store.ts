/**
 * Saved pipelines.
 *
 * A pipeline is a SAVED INVOCATION of the chaining `run` command — the
 * steps plus their bindings — stored as plain JSON (not a model) at
 * `pipelines/<name>.json` in the workspace. Replaying one (`synth run
 * <name>`) rebuilds the execution request from the saved fields and goes
 * through the full normal pre-flight; a pipeline is convenience, never a
 * bypass.
 *
 * This module owns the schema (hand-rolled validation with precise field
 * errors, like the transformation manifest reader), the load/save/list
 * primitives, and the dependency scans behind the guards (`tx uninstall`,
 * model removal, `doctor`). Commands stay thin.
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { normalizeRef } from '../support/refs.js'

/** Pipeline names are single ref segments: `pipelines/<name>.json`. */
const PIPELINE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/

export interface PipelineDefinition {
  /** Must equal the file stem (`pipelines/<name>.json`). */
  name: string
  /** Transformation names, in execution order (one = single step). */
  steps: string[]
  /** Source model ref the first step transforms. */
  in: string
  /** Destination ref for the final result model (last step m2m). */
  out?: string
  /** Output directory for generated files (last step m2t), as invoked. */
  outDir?: string
  /** Configuration model ref for step 1. */
  config?: string
  /** Consent to generated default configurations. */
  defaultConfigs?: boolean
  /** Persist every intermediate step result as a workspace model. */
  keepIntermediates?: boolean
  description: string
  createdAt: string
  modifiedAt: string
}

/** Typed pipeline failure; `exit` maps to the CLI exit code. */
export class PipelineError extends Error {
  public constructor(
    public readonly exit: number,
    message: string
  ) {
    super(message)
  }
}

export function isValidPipelineName(name: string): boolean {
  return PIPELINE_NAME_PATTERN.test(name)
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

const KNOWN_FIELDS = new Set([
  'name',
  'steps',
  'in',
  'out',
  'outDir',
  'config',
  'defaultConfigs',
  'keepIntermediates',
  'description',
  'createdAt',
  'modifiedAt'
])

/**
 * Validate a parsed pipeline file against the schema, collecting EVERY
 * problem (not just the first) so `pipeline edit` and `doctor` can report
 * them all at once. Refs (`in`, `out`, `config`) are normalized to their
 * canonical dotted form in the returned definition, so dependency scans
 * compare canonically.
 */
export function validatePipeline(raw: unknown, expectedName?: string): PipelineValidation {
  const errors: string[] = []
  if (!isRecord(raw)) {
    return { pipeline: null, errors: ['expected a JSON object at the top level'] }
  }

  for (const key of Object.keys(raw)) {
    if (!KNOWN_FIELDS.has(key)) {
      errors.push(`unknown field '${key}'`)
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

  const normalizedRef = (field: 'in' | 'out' | 'config', required: boolean): string | undefined => {
    const value = raw[field]
    if (value === undefined) {
      if (required) {
        errors.push(`field '${field}' is required (a workspace model ref like com.example/persons)`)
      }
      return undefined
    }
    if (!isNonEmptyString(value)) {
      errors.push(`field '${field}' must be a workspace model ref string`)
      return undefined
    }
    try {
      return normalizeRef(value)
    } catch (err) {
      errors.push(`field '${field}' is not a valid model ref: ${errorMessage(err)}`)
      return undefined
    }
  }

  const inRef = normalizedRef('in', true)
  const out = normalizedRef('out', false)
  const config = normalizedRef('config', false)

  let outDir: string | undefined
  if (raw.outDir !== undefined) {
    if (!isNonEmptyString(raw.outDir)) {
      errors.push(`field 'outDir' must be a directory path string`)
    } else {
      outDir = raw.outDir
    }
  }
  if (out !== undefined && outDir !== undefined) {
    errors.push(`fields 'out' and 'outDir' are mutually exclusive (m2m results take 'out', m2t results take 'outDir')`)
  }

  const optionalBoolean = (field: 'defaultConfigs' | 'keepIntermediates'): boolean | undefined => {
    const value = raw[field]
    if (value === undefined) {
      return undefined
    }
    if (typeof value !== 'boolean') {
      errors.push(`field '${field}' must be a boolean`)
      return undefined
    }
    return value
  }
  const defaultConfigs = optionalBoolean('defaultConfigs')
  const keepIntermediates = optionalBoolean('keepIntermediates')

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
    pipeline: {
      name,
      steps,
      in: inRef as string,
      ...(out !== undefined ? { out } : {}),
      ...(outDir !== undefined ? { outDir } : {}),
      ...(config !== undefined ? { config } : {}),
      ...(defaultConfigs !== undefined ? { defaultConfigs } : {}),
      ...(keepIntermediates !== undefined ? { keepIntermediates } : {}),
      description,
      createdAt,
      modifiedAt
    },
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
 * Load a saved pipeline by name. Throws PipelineError: NOT_FOUND when no
 * file exists (or the name is not even a valid pipeline name),
 * VALIDATION_FAILURE when the file exists but violates the schema — every
 * problem is listed, with `pipeline edit` as the repair path.
 */
export async function loadPipeline(pipelinesDir: string, name: string): Promise<PipelineDefinition> {
  if (!pipelineFileExists(pipelinesDir, name)) {
    throw new PipelineError(
      EXIT_CODES.NOT_FOUND,
      `Pipeline not found: ${name} (looked for ${pipelinePath(pipelinesDir, name)})`
    )
  }
  const { pipeline, errors } = await readPipelineFile(pipelinesDir, name)
  if (pipeline === null) {
    throw new PipelineError(
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

export interface PipelineListEntry {
  name: string
  path: string
  /** null when the file is unreadable or violates the schema. */
  pipeline: PipelineDefinition | null
  errors: string[]
}

/**
 * All `*.json` files in the pipelines directory, sorted by name, each with
 * its validation result. A missing directory (older workspace, nothing
 * saved yet) yields an empty list. Files whose stem is not a valid
 * pipeline name are included with an error — no `run <name>` can ever
 * address them.
 */
export async function listPipelines(pipelinesDir: string): Promise<PipelineListEntry[]> {
  let names: string[]
  try {
    names = (await readdir(pipelinesDir))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -'.json'.length))
  } catch {
    return []
  }
  names.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const entries: PipelineListEntry[] = []
  for (const name of names) {
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
 * Names of the saved pipelines whose steps include the transformation —
 * the `tx uninstall` guard. Broken pipeline files are skipped (`doctor`
 * reports those separately).
 */
export async function findPipelinesUsingTx(pipelinesDir: string, txName: string): Promise<string[]> {
  const names: string[] = []
  for (const entry of await listPipelines(pipelinesDir)) {
    if (entry.pipeline !== null && entry.pipeline.steps.includes(txName)) {
      names.push(entry.name)
    }
  }
  return names
}

/** A pipeline bound to a model that is about to be deleted. */
export interface PipelineModelDependent {
  name: string
  /** Which bindings reach the model: 'in' and/or 'config', with the ref. */
  bindings: Array<{ field: 'in' | 'config'; ref: string }>
}

/**
 * The saved pipelines whose `in` or `config` binding names one of the
 * given model refs — the model-deletion guard. Refs are compared in
 * canonical form (the validator normalizes the stored ones). Broken
 * pipeline files are skipped (`doctor` reports those separately).
 */
export async function findPipelinesReferencingModels(
  pipelinesDir: string,
  refs: Iterable<string>
): Promise<PipelineModelDependent[]> {
  const targets = new Set(refs)
  if (targets.size === 0) {
    return []
  }
  const dependents: PipelineModelDependent[] = []
  for (const entry of await listPipelines(pipelinesDir)) {
    if (entry.pipeline === null) {
      continue
    }
    const bindings: PipelineModelDependent['bindings'] = []
    if (targets.has(entry.pipeline.in)) {
      bindings.push({ field: 'in', ref: entry.pipeline.in })
    }
    if (entry.pipeline.config !== undefined && targets.has(entry.pipeline.config)) {
      bindings.push({ field: 'config', ref: entry.pipeline.config })
    }
    if (bindings.length > 0) {
      dependents.push({ name: entry.name, bindings })
    }
  }
  return dependents
}
