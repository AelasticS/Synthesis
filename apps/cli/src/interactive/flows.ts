/**
 * The interactive picker flows: given a partially specified request and a
 * `Prompter`, fill in what is missing — the transformation, the source
 * model, the configuration consent, the m2t output directory, the
 * pipeline name, `config init`'s subject — and return the completed
 * request. The flows never print results and never execute anything: the
 * commands feed the completed values into the SAME shared bodies the
 * non-interactive paths use, so a picked value and a typed value take the
 * identical route.
 *
 * The prompter is injected (tests script it; the commands pass the
 * @inquirer/prompts implementation), candidates come from the candidate
 * provider (headers + manifests only), and a user abort is a typed
 * `FlowAborted` carrying the exit code. A picker choice IS explicit
 * consent: choosing "generate defaults" is the interactive form of
 * `--default-configs`, per the uniform configuration policy.
 */

import { existsSync } from 'node:fs'
import { basename, isAbsolute, join } from 'node:path'

import {
  configsFor,
  installedTransformations,
  modelsForMetamodel,
  pipelines
} from '../candidates/provider.js'
import type { ModelCandidate, TxCandidate } from '../candidates/provider.js'
import type { WorkspaceConfig } from '../config/index.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import type { Prompter, PromptChoice } from '../support/interactive.js'
import { normalizeRef, refToModelPath } from '../support/refs.js'
import { resolveChainSteps } from '../tx/chain.js'
import type { ChainStep } from '../tx/chain.js'
import { ExecuteError } from '../tx/execute-error.js'
import { resolveInstalledTx, TxResolveError } from '../tx/load.js'

/** The user (or an empty candidate set) ended the flow; `exit` is the CLI exit code. */
export class FlowAborted extends ExecuteError {}

/** Everything the flows need from their host command; injectable for tests. */
export interface FlowDeps {
  prompter: Prompter
  workspaceConfig: WorkspaceConfig
  modelsDir: string
  pipelinesDir: string
  /** Directory the CLI was invoked from; relative .tsx paths resolve against it. */
  invokedFrom: string
  /** The model-import machinery (never a subprocess); throws ModelImportError. */
  importModel: (sourcePath: string, ref: string) => Promise<void>
  /** Conversational output (never machine-read; the flows only run in a TTY). */
  info: (line: string) => void
}

function txChoice(candidate: TxCandidate): PromptChoice<string> {
  const arrow = `${candidate.kind}: ${candidate.sourceMetamodel} -> ${candidate.targetMetamodel}`
  return {
    name: candidate.name,
    value: candidate.name,
    description: candidate.description === '' ? arrow : `${arrow} — ${candidate.description}`
  }
}

function modelChoice(candidate: ModelCandidate): PromptChoice<string> {
  return {
    name: candidate.ref,
    value: candidate.ref,
    ...(candidate.description === '' ? {} : { description: candidate.description })
  }
}

/**
 * The import offer: when `raw` is not an existing workspace ref but names
 * an existing .tsx file, offer to import it (target ref defaults to the
 * current namespace + file basename) and return the imported ref. In
 * every other case — including a declined offer — `raw` is returned
 * unchanged, so the downstream checks fail exactly as they always did.
 */
export async function offerImportForPath(deps: FlowDeps, raw: string): Promise<string> {
  try {
    if (existsSync(refToModelPath(deps.modelsDir, normalizeRef(raw)))) {
      return raw
    }
  } catch {
    // not even ref-shaped; it may still be a file path
  }
  if (!raw.endsWith('.tsx')) {
    return raw
  }
  const sourcePath = isAbsolute(raw) ? raw : join(deps.invokedFrom, raw)
  if (!existsSync(sourcePath)) {
    return raw
  }
  const wantsImport = await deps.prompter.confirm(
    `'${raw}' is not a workspace ref, but it names an existing .tsx file. Import it into the workspace first?`,
    true
  )
  if (!wantsImport) {
    return raw
  }
  const namespace = deps.workspaceConfig.currentNamespace
  const suggested = namespace ? `${namespace}/${basename(sourcePath, '.tsx')}` : undefined
  const answer = (await deps.prompter.input('Workspace ref for the imported model', suggested)).trim()
  if (answer === '') {
    throw new FlowAborted(EXIT_CODES.FAILURE, 'Aborted: no workspace ref given for the import.')
  }
  let ref: string
  try {
    ref = normalizeRef(answer)
  } catch (err) {
    throw new FlowAborted(EXIT_CODES.FAILURE, errorMessage(err), { cause: err })
  }
  await deps.importModel(sourcePath, ref)
  deps.info(`Imported ${ref}`)
  return ref
}

export interface RunFlowInput {
  /** Transformation names (empty = ask; pipeline runs pass the resolved steps). */
  txNames: string[]
  inRef?: string
  config?: string
  defaultConfigs: boolean
  outDir?: string
}

export interface RunFlowResult {
  txNames: string[]
  inRef: string
  config?: string
  defaultConfigs: boolean
  outDir?: string
}

function stepLabel(steps: ChainStep[], index: number): string {
  return steps.length > 1 ? `step ${index + 1} (${steps[index].manifest.name})` : `Transformation '${steps[index].manifest.name}'`
}

function listLabels(steps: ChainStep[], indexes: number[]): string {
  const labels = indexes.map((index) => `step ${index + 1} (${steps[index].manifest.name})`)
  if (labels.length === 1) {
    return labels[0]
  }
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/** Consent select for decision-based steps whose input is produced mid-run. */
async function consentForLaterSteps(deps: FlowDeps, steps: ChainStep[], indexes: number[]): Promise<void> {
  const many = indexes.length > 1
  const picked = await deps.prompter.select(
    `${listLabels(steps, indexes)} ${many ? 'are' : 'is'} decision-based; a model produced mid-run cannot take an explicit configuration. Generate default configurations for ${many ? 'these steps' : 'this step'}?`,
    [
      {
        name: 'Generate default configurations for this run (--default-configs)',
        value: 'defaults',
        description: 'Every decision falls to its declared default; each choice is announced.'
      },
      { name: 'Abort', value: 'abort' }
    ]
  )
  if (picked === 'abort') {
    throw new FlowAborted(EXIT_CODES.VALIDATION_FAILURE, 'Aborted: decisions are never applied without explicit consent.')
  }
}

/**
 * Complete a `transformation run`/`pipeline run` request: pick the
 * transformation when none was named (single step — chains are typed, not
 * picked), pick or import the source model, settle the configuration
 * consent per the uniform policy, and ask for --out-dir when the last
 * step is m2t. Returns the completed request; throws FlowAborted (or a
 * resolution ExecuteError) when it cannot.
 */
export async function completeRunRequest(deps: FlowDeps, input: RunFlowInput): Promise<RunFlowResult> {
  let txNames = [...input.txNames]
  let { config, defaultConfigs, outDir } = input

  // 1. The transformation (only `transformation run` can arrive without one)
  if (txNames.length === 0) {
    const installed = await installedTransformations(deps.workspaceConfig)
    if (installed.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No transformations installed. Use 'synth transformation install' to install one.`
      )
    }
    txNames = [await deps.prompter.search('Select a transformation to run', installed.map(txChoice))]
  }

  // 2. Resolve the steps from the manifests (same resolution the execution
  // core performs; an unknown name fails here exactly as it would there)
  const steps = await resolveChainSteps(deps.workspaceConfig, txNames)
  const first = steps[0]
  const last = steps[steps.length - 1]

  // 3. The source model: pick one matching step 1's source metamodel, or
  // offer to import a .tsx file the user pointed --in at
  let inRef = input.inRef
  if (inRef === undefined) {
    const models = await modelsForMetamodel(deps.modelsDir, first.manifest.source.metamodel)
    if (models.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No models for metamodel '${first.manifest.source.metamodel}' found in the workspace. Import one with 'synth model import <file> --as <namespace>/<name>'.`
      )
    }
    inRef = await deps.prompter.search(
      `Select the source model (--in) for ${first.manifest.name}`,
      models.map(modelChoice)
    )
  } else {
    inRef = await offerImportForPath(deps, inRef)
  }

  // 4. Configuration consent, per the uniform policy: --config covers step
  // 1 only; every other decision-based step needs the defaults consent. A
  // picker choice IS that consent.
  if (!defaultConfigs) {
    const uncovered = steps
      .map((step, index) => index)
      .filter((index) => steps[index].manifest.variability && !(index === 0 && config !== undefined))
    if (uncovered.length > 0 && uncovered[0] === 0) {
      const existingConfigs = await configsFor(deps.modelsDir, first.manifest.name, inRef)
      const choices: PromptChoice<'existing' | 'defaults' | 'abort'>[] = []
      if (existingConfigs.length > 0) {
        choices.push({
          name: 'Use an existing configuration model (--config)',
          value: 'existing',
          description: `${existingConfigs.length} configuration model(s) in the workspace fit ${first.manifest.name} on ${inRef}.`
        })
      }
      choices.push(
        {
          name: 'Generate default configurations for this run (--default-configs)',
          value: 'defaults',
          description: 'Every decision falls to its declared default; each choice is announced.'
        },
        { name: 'Abort', value: 'abort' }
      )
      const picked = await deps.prompter.select(
        `${stepLabel(steps, 0)} is decision-based and no configuration was given. How should its decisions be made?`,
        choices
      )
      if (picked === 'abort') {
        throw new FlowAborted(
          EXIT_CODES.VALIDATION_FAILURE,
          'Aborted: decisions are never applied without explicit consent.'
        )
      }
      if (picked === 'defaults') {
        defaultConfigs = true
      } else {
        config = await deps.prompter.search(
          `Select the configuration model for ${first.manifest.name} on ${inRef}`,
          existingConfigs.map(modelChoice)
        )
        const later = uncovered.filter((index) => index > 0)
        if (later.length > 0) {
          await consentForLaterSteps(deps, steps, later)
          defaultConfigs = true
        }
      }
    } else if (uncovered.length > 0) {
      await consentForLaterSteps(deps, steps, uncovered)
      defaultConfigs = true
    }
  }

  // 5. An m2t last step writes files; there is no default directory to invent
  if (last.manifest.kind === 'm2t' && outDir === undefined) {
    const answer = (await deps.prompter.input('Output directory for the generated files (--out-dir)')).trim()
    if (answer === '') {
      throw new FlowAborted(
        EXIT_CODES.FAILURE,
        `Aborted: '${last.manifest.name}' is m2t and writes generated files; it needs --out-dir.`
      )
    }
    outDir = answer
  }

  return { txNames, inRef, config, defaultConfigs, outDir }
}

/**
 * Pick a saved pipeline by name (schema-valid ones only — a broken file
 * cannot run and has `pipeline edit` as its repair path).
 */
export async function pickPipelineName(deps: FlowDeps): Promise<string> {
  const saved = (await pipelines(deps.pipelinesDir)).filter((candidate) => candidate.steps.length > 0)
  if (saved.length === 0) {
    throw new FlowAborted(
      EXIT_CODES.NOT_FOUND,
      `No runnable pipelines saved. Create one with 'synth pipeline mk <name> <transformation...>' or save a successful run with 'transformation run --save-as'.`
    )
  }
  return deps.prompter.search(
    'Select a pipeline to run',
    saved.map((candidate) => ({
      name: candidate.name,
      value: candidate.name,
      description:
        candidate.description === ''
          ? candidate.steps.join(' -> ')
          : `${candidate.steps.join(' -> ')} — ${candidate.description}`
    }))
  )
}

export interface ConfigInitFlowInput {
  txName?: string
  forRef?: string
}

export interface ConfigInitFlowResult {
  txName: string
  forRef: string
}

/**
 * Complete a `config init` request: pick a decision-based transformation
 * when none was named, then pick (or import) the model the configuration
 * is for, filtered by the transformation's source metamodel.
 */
export async function completeConfigInitRequest(
  deps: FlowDeps,
  input: ConfigInitFlowInput
): Promise<ConfigInitFlowResult> {
  let txName = input.txName
  if (txName === undefined) {
    const decisionBased = (await installedTransformations(deps.workspaceConfig)).filter(
      (candidate) => candidate.variability
    )
    if (decisionBased.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No decision-based transformations installed; only decision-based transformations have configurations.`
      )
    }
    txName = await deps.prompter.search('Select the transformation to configure', decisionBased.map(txChoice))
  }

  let forRef = input.forRef
  if (forRef === undefined) {
    // The non-interactive path resolves the transformation itself; resolve
    // here only to learn the source metamodel for the model picker.
    let sourceMetamodel: string
    try {
      sourceMetamodel = (await resolveInstalledTx(deps.workspaceConfig, txName)).manifest.source.metamodel
    } catch (err) {
      throw new FlowAborted(
        err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE,
        errorMessage(err),
        { cause: err }
      )
    }
    const models = await modelsForMetamodel(deps.modelsDir, sourceMetamodel)
    if (models.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No models for metamodel '${sourceMetamodel}' found in the workspace. Import one with 'synth model import <file> --as <namespace>/<name>'.`
      )
    }
    forRef = await deps.prompter.search(
      `Select the model to configure ${txName} for (--for)`,
      models.map(modelChoice)
    )
  } else {
    forRef = await offerImportForPath(deps, forRef)
  }

  return { txName, forRef }
}
