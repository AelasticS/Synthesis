/**
 * Candidate provider: answers "which values are valid here?" for the
 * interactive pickers and the dynamic shell completion, from manifests,
 * `$synth` headers, and pipeline files ONLY. Nothing here transpiles,
 * imports, or renders a model, and nothing touches the engine: every
 * function is a couple of small file reads plus the static header parse,
 * fast enough to run on every TAB press (reads are batched, and one
 * models-tree scan can serve several filters).
 *
 * Tolerance policy: a candidate list is assistance, not a gate. Entries
 * that cannot be judged (an installed transformation whose package or
 * manifest is broken, a model file that is unreadable or has no parseable
 * header, a pipeline file that violates the schema) are silently skipped;
 * the honest errors still come from the commands that actually use the
 * value (`doctor` reports the broken files).
 */

import { readFile } from 'node:fs/promises'

import type { WorkspaceConfig } from '../config/index.js'
import { parseSynthHeader } from '../models/header.js'
import type { SynthHeader, SynthHeaderKind } from '../models/header.js'
import { listModels, listNamespaces, normalizeRef } from '../support/refs.js'
import { listPipelines } from '../pipelines/store.js'
import { chainStructureProblems } from '../tx/chain.js'
import { loadTxManifestWithMeta } from '../tx/manifest.js'
import type { TxKind, TxManifest } from '../tx/manifest.js'

/** One installed transformation, as the pickers and completion present it. */
export interface TxCandidate {
  /** Name the workspace knows it by: what the user types. */
  name: string
  kind: TxKind
  sourceMetamodel: string
  targetMetamodel: string
  /** True iff the transformation is decision-based. */
  variability: boolean
  /** package.json description ('' when absent). */
  description: string
  /** Installed package directory (for callers that go on to execute). */
  packageDir: string
  /** The already-loaded manifest, so callers need not resolve it again. */
  manifest: TxManifest
}

/** One workspace model file, as the pickers and completion present it. */
export interface ModelCandidate {
  ref: string
  kind: SynthHeaderKind
  description: string
}

/** One saved pipeline (schema-invalid files surface with empty steps). */
export interface PipelineCandidate {
  name: string
  steps: string[]
  description: string
}

/**
 * Every installed transformation with a readable manifest, sorted by name.
 * Broken entries (vanished package, invalid manifest) are skipped. The
 * manifests load in parallel: one batch, not one await per entry.
 */
export async function installedTransformations(config: WorkspaceConfig): Promise<TxCandidate[]> {
  const loaded = await Promise.all(
    Object.entries(config.transformations).map(async ([name, entry]): Promise<TxCandidate | undefined> => {
      try {
        const { manifest, meta } = await loadTxManifestWithMeta(entry.path)
        return {
          name,
          kind: manifest.kind,
          sourceMetamodel: manifest.source.metamodel,
          targetMetamodel: manifest.target.metamodel,
          variability: manifest.variability,
          description: meta.description ?? '',
          packageDir: entry.path,
          manifest
        }
      } catch {
        return undefined
      }
    })
  )
  const candidates = loaded.filter((candidate): candidate is TxCandidate => candidate !== undefined)
  candidates.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return candidates
}

/**
 * The transformations that can FOLLOW `previousTx` in a chain, judged by
 * `chainStructureProblems`, the single owner of chain compatibility (text
 * is terminal, and the target metamodel must equal the next step's source
 * metamodel). An unknown or broken `previousTx` yields an empty list.
 */
export async function chainNext(config: WorkspaceConfig, previousTx: string): Promise<TxCandidate[]> {
  const all = await installedTransformations(config)
  const previous = all.find((candidate) => candidate.name === previousTx)
  if (previous === undefined) {
    return []
  }
  return all.filter(
    (candidate) =>
      chainStructureProblems([{ manifest: previous.manifest }, { manifest: candidate.manifest }]).length === 0
  )
}

async function readHeader(path: string): Promise<SynthHeader | null> {
  let text: string
  try {
    text = await readFile(path, 'utf-8')
  } catch {
    return null
  }
  return parseSynthHeader(text).header
}

/** One workspace model file with its parsed header: the raw material the filters below run on. */
export interface HeaderedModel {
  ref: string
  header: SynthHeader
}

/**
 * Every addressable model file with a parseable header, from ONE
 * models-tree walk with the header reads batched. The pure `filter*`
 * functions turn a single scan into several candidate lists, so an
 * interactive flow scans once and filters in memory.
 */
export async function modelHeaders(modelsDir: string): Promise<HeaderedModel[]> {
  const models = await listModels(modelsDir)
  const headers = await Promise.all(models.map((model) => readHeader(model.path)))
  const out: HeaderedModel[] = []
  for (const [index, header] of headers.entries()) {
    if (header !== null) {
      out.push({ ref: models[index].ref, header })
    }
  }
  return out
}

const toCandidate = ({ ref, header }: HeaderedModel): ModelCandidate => ({
  ref,
  kind: header.kind,
  description: header.description
})

/**
 * Workspace models a transformation can run on: header kind 'model',
 * optionally filtered to a source metamodel. A model declaring an EMPTY
 * metamodel is included even under a filter; the run gate accepts it
 * (only a CONFLICTING declaration is a mismatch), so completion must not
 * hide what would run.
 */
export function filterModelsForMetamodel(models: readonly HeaderedModel[], metamodel?: string): ModelCandidate[] {
  return models
    .filter(
      ({ header }) =>
        header.kind === 'model' &&
        (metamodel === undefined || header.metamodel === '' || header.metamodel === metamodel)
    )
    .map(toCandidate)
}

/** `filterModelsForMetamodel` over a fresh scan of the models tree. */
export async function modelsForMetamodel(modelsDir: string, metamodel?: string): Promise<ModelCandidate[]> {
  return filterModelsForMetamodel(await modelHeaders(modelsDir), metamodel)
}

/** Every addressable model file with a parseable header, any kind. */
export async function allModels(modelsDir: string): Promise<ModelCandidate[]> {
  return (await modelHeaders(modelsDir)).map(toCandidate)
}

/**
 * Configuration models, optionally narrowed to those stamped as generated
 * by `txName` (the MANIFEST name recorded in `generatedBy.tx`) and to
 * those declaring `references.sourceModel === sourceModelRef`. A
 * hand-written configuration without a `generatedBy` stamp passes the tx
 * filter; `transformation run --config` accepts it too (with a warning),
 * so completion must not hide it.
 */
export function filterConfigsFor(
  models: readonly HeaderedModel[],
  txName?: string,
  sourceModelRef?: string
): ModelCandidate[] {
  let wantedSource: string | undefined
  if (sourceModelRef !== undefined) {
    try {
      wantedSource = normalizeRef(sourceModelRef)
    } catch {
      wantedSource = sourceModelRef
    }
  }
  return models
    .filter(({ header }) => {
      if (header.kind !== 'configuration-model') {
        return false
      }
      if (txName !== undefined && header.generatedBy !== null && header.generatedBy.tx !== txName) {
        return false
      }
      if (wantedSource !== undefined) {
        const declared = header.references.sourceModel
        let declaredRef: string | undefined
        try {
          declaredRef = declared === undefined ? undefined : normalizeRef(declared)
        } catch {
          declaredRef = declared
        }
        if (declaredRef !== wantedSource) {
          return false
        }
      }
      return true
    })
    .map(toCandidate)
}

/** `filterConfigsFor` over a fresh scan of the models tree. */
export async function configsFor(
  modelsDir: string,
  txName?: string,
  sourceModelRef?: string
): Promise<ModelCandidate[]> {
  return filterConfigsFor(await modelHeaders(modelsDir), txName, sourceModelRef)
}

/**
 * Saved pipelines, leniently: every `pipelines/*.json` stem is a candidate
 * (schema-invalid files with empty steps and description; `pipeline
 * show`/`rm`/`edit` address them too). Sorted by name.
 */
export async function pipelines(pipelinesDir: string): Promise<PipelineCandidate[]> {
  const candidates: PipelineCandidate[] = []
  let entries
  try {
    entries = await listPipelines(pipelinesDir)
  } catch {
    // An unreadable pipelines directory yields no candidates; the pipeline
    // commands themselves report the real error.
    return []
  }
  for (const entry of entries) {
    candidates.push({
      name: entry.name,
      steps: entry.pipeline?.steps ?? [],
      description: entry.pipeline?.description ?? ''
    })
  }
  return candidates
}

/** All namespaces in the models tree, dotted, sorted. */
export async function namespaces(modelsDir: string): Promise<string[]> {
  return listNamespaces(modelsDir)
}
