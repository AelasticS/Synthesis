/**
 * Candidate provider: answers "which values are valid here?" for the
 * interactive pickers and the dynamic shell completion — from manifests,
 * `$synth` headers, and pipeline files ONLY. Nothing here transpiles,
 * imports, or renders a model, and nothing touches the engine: every
 * function is a couple of small file reads plus the static header parse,
 * fast enough to run on every TAB press.
 *
 * Tolerance policy: a candidate list is assistance, not a gate. Entries
 * that cannot be judged — an installed transformation whose package or
 * manifest is broken, a model file that is unreadable or has no parseable
 * header, a pipeline file that violates the schema — are silently skipped;
 * the honest errors still come from the commands that actually use the
 * value (`doctor` reports the broken files).
 */

import { readFile } from 'node:fs/promises'

import type { WorkspaceConfig } from '../config/index.js'
import { parseSynthHeader } from '../models/header.js'
import type { SynthHeader, SynthHeaderKind } from '../models/header.js'
import { listModels, listNamespaces, normalizeRef } from '../support/refs.js'
import { listPipelines } from '../pipelines/store.js'
import { loadTxManifestWithMeta } from '../tx/manifest.js'
import type { TxKind } from '../tx/manifest.js'

/** One installed transformation, as the pickers and completion present it. */
export interface TxCandidate {
  /** Name the workspace knows it by — what the user types. */
  name: string
  kind: TxKind
  sourceMetamodel: string
  targetMetamodel: string
  /** True iff the transformation is decision-based. */
  variability: boolean
  /** package.json description ('' when absent). */
  description: string
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
 * Broken entries (vanished package, invalid manifest) are skipped.
 */
export async function installedTransformations(config: WorkspaceConfig): Promise<TxCandidate[]> {
  const candidates: TxCandidate[] = []
  for (const [name, entry] of Object.entries(config.transformations)) {
    try {
      const { manifest, meta } = await loadTxManifestWithMeta(entry.path)
      candidates.push({
        name,
        kind: manifest.kind,
        sourceMetamodel: manifest.source.metamodel,
        targetMetamodel: manifest.target.metamodel,
        variability: manifest.variability,
        description: meta.description ?? ''
      })
    } catch {
      continue
    }
  }
  candidates.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return candidates
}

/**
 * The transformations that can FOLLOW `previousTx` in a chain: those whose
 * source metamodel equals the previous step's target metamodel (the same
 * judgment the chain pre-flight makes). An unknown or broken `previousTx`,
 * or an m2t one (text is terminal), yields an empty list.
 */
export async function chainNext(config: WorkspaceConfig, previousTx: string): Promise<TxCandidate[]> {
  const all = await installedTransformations(config)
  const previous = all.find((candidate) => candidate.name === previousTx)
  if (previous === undefined || previous.kind === 'm2t') {
    return []
  }
  return all.filter((candidate) => candidate.sourceMetamodel === previous.targetMetamodel)
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

/**
 * Workspace models a transformation can run on: header kind 'model',
 * optionally filtered to a source metamodel. A model declaring an EMPTY
 * metamodel is included even under a filter — the run gate accepts it
 * (only a CONFLICTING declaration is a mismatch), so completion must not
 * hide what would run.
 */
export async function modelsForMetamodel(modelsDir: string, metamodel?: string): Promise<ModelCandidate[]> {
  const candidates: ModelCandidate[] = []
  for (const model of await listModels(modelsDir)) {
    const header = await readHeader(model.path)
    if (header === null || header.kind !== 'model') {
      continue
    }
    if (metamodel !== undefined && header.metamodel !== '' && header.metamodel !== metamodel) {
      continue
    }
    candidates.push({ ref: model.ref, kind: header.kind, description: header.description })
  }
  return candidates
}

/** Every addressable model file with a parseable header, any kind. */
export async function allModels(modelsDir: string): Promise<ModelCandidate[]> {
  const candidates: ModelCandidate[] = []
  for (const model of await listModels(modelsDir)) {
    const header = await readHeader(model.path)
    if (header === null) {
      continue
    }
    candidates.push({ ref: model.ref, kind: header.kind, description: header.description })
  }
  return candidates
}

/**
 * Configuration models, optionally narrowed to those stamped as generated
 * by `txName` (the MANIFEST name recorded in `generatedBy.tx`) and to
 * those declaring `references.sourceModel === sourceModelRef`. A
 * hand-written configuration without a `generatedBy` stamp passes the tx
 * filter — `transformation run --config` accepts it too (with a warning),
 * so completion must not hide it.
 */
export async function configsFor(
  modelsDir: string,
  txName?: string,
  sourceModelRef?: string
): Promise<ModelCandidate[]> {
  let wantedSource: string | undefined
  if (sourceModelRef !== undefined) {
    try {
      wantedSource = normalizeRef(sourceModelRef)
    } catch {
      wantedSource = sourceModelRef
    }
  }
  const candidates: ModelCandidate[] = []
  for (const model of await listModels(modelsDir)) {
    const header = await readHeader(model.path)
    if (header === null || header.kind !== 'configuration-model') {
      continue
    }
    if (txName !== undefined && header.generatedBy !== null && header.generatedBy.tx !== txName) {
      continue
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
        continue
      }
    }
    candidates.push({ ref: model.ref, kind: header.kind, description: header.description })
  }
  return candidates
}

/**
 * Saved pipelines, leniently: every `pipelines/*.json` stem is a candidate
 * (schema-invalid files with empty steps and description — `pipeline
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
