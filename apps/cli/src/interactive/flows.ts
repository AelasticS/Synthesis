/**
 * The interactive picker flows: given a partially specified request and a
 * `Prompter`, fill in what is missing (the transformation, the source
 * model, the configuration consent, the m2t output directory, the
 * pipeline name, `config init`'s subject) and return the completed
 * request. The flows never print results and never execute anything: the
 * commands feed the completed values into the SAME shared bodies the
 * non-interactive paths use, so a picked value and a typed value take the
 * identical route.
 *
 * The prompter is injected (tests script it; the commands pass the
 * @inquirer/prompts implementation), candidates come from the candidate
 * provider (headers + manifests only; the models tree is scanned ONCE per
 * flow and filtered in memory), and a user abort is a typed `FlowAborted`
 * carrying the exit code. A picker choice IS explicit consent: choosing
 * "generate defaults" is the interactive form of `--default-configs`, per
 * the uniform configuration policy, and which steps still need that
 * consent is the execution core's own judgment (`uncoveredDecisionSteps`),
 * never re-derived here.
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'

import {
  filterConfigsFor,
  filterModelsForMetamodel,
  installedTransformations,
  modelHeaders,
  pipelines
} from '../candidates/provider.js'
import type { HeaderedModel, ModelCandidate, TxCandidate } from '../candidates/provider.js'
import type { WorkspaceConfig } from '../config/index.js'
import { parseSynthHeader } from '../models/header.js'
import { defaultImportRef } from '../models/import-core.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import type { Prompter, PromptChoice } from '../support/interactive.js'
import { normalizeRef, refToModelPath } from '../support/refs.js'
import { resolveChainSteps } from '../tx/chain.js'
import type { ChainStep } from '../tx/chain.js'
import { ExecuteError } from '../tx/execute-error.js'
import { uncoveredDecisionSteps } from '../tx/execute.js'
import { resolveInstalledTx, TxResolveError } from '../tx/load.js'
import type { TxManifest } from '../tx/manifest.js'

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
    description: candidate.description === '' ? arrow : `${arrow} (${candidate.description})`
  }
}

function modelChoice(candidate: ModelCandidate): PromptChoice<string> {
  return {
    name: candidate.ref,
    value: candidate.ref,
    ...(candidate.description === '' ? {} : { description: candidate.description })
  }
}

/** The one defaults-consent choice every consent picker offers. */
const DEFAULTS_CHOICE: PromptChoice<'defaults'> = {
  name: 'Generate default configurations for this run (--default-configs)',
  value: 'defaults',
  description: 'Every decision falls to its declared default; each choice is announced.'
}

const ABORT_CHOICE: PromptChoice<'abort'> = { name: 'Abort', value: 'abort' }

/** The uniform consent refusal: identical wording and exit everywhere. */
function consentAborted(): never {
  throw new FlowAborted(
    EXIT_CODES.VALIDATION_FAILURE,
    'Aborted: decisions are never applied without explicit consent.'
  )
}

function refExists(modelsDir: string, ref: string): boolean {
  try {
    return existsSync(refToModelPath(modelsDir, ref))
  } catch {
    return false
  }
}

/** Header kind of a .tsx file, or undefined when it has no parseable header. */
async function headerKindOf(path: string): Promise<string | undefined> {
  try {
    return parseSynthHeader(await readFile(path, 'utf-8')).header?.kind
  } catch {
    return undefined
  }
}

/**
 * The import offer: when `raw` is not an existing workspace ref but names
 * an existing .tsx file, offer to import it and return the imported ref.
 * The flow never dead-ends while a usable model exists: when the
 * workspace already holds a model under the file's default ref (current
 * namespace + basename, the shared `defaultImportRef` policy), using that
 * model is offered up front; a target ref that turns out to be taken
 * offers the existing model too. In every other case, including a
 * declined offer, `raw` is returned unchanged, so the downstream checks
 * fail exactly as they always did.
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

  const suggestedRaw = defaultImportRef(deps.workspaceConfig, sourcePath)
  let suggested: string | undefined
  try {
    suggested = suggestedRaw === undefined ? undefined : normalizeRef(suggestedRaw)
  } catch {
    suggested = undefined
  }
  const suggestedExists = suggested !== undefined && refExists(deps.modelsDir, suggested)

  if (suggestedExists) {
    // The workspace already holds a model under the file's default ref:
    // using it must be on offer: an import that can only collide is a
    // dead end this select avoids.
    const picked = await deps.prompter.select(
      `'${raw}' is not a workspace ref, but it names a .tsx file, and the workspace already has a model at '${suggested}'. How should this run proceed?`,
      [
        { name: `Use the existing workspace model ${suggested}`, value: 'existing' as const },
        { name: 'Import the file under a different ref', value: 'import' as const },
        ABORT_CHOICE
      ]
    )
    if (picked === 'abort') {
      throw new FlowAborted(EXIT_CODES.FAILURE, 'Aborted.')
    }
    if (picked === 'existing') {
      return suggested as string
    }
  } else {
    const wantsImport = await deps.prompter.confirm(
      `'${raw}' is not a workspace ref, but it names an existing .tsx file. Import it into the workspace first?`,
      true
    )
    if (!wantsImport) {
      return raw
    }
  }

  // Ask for the target ref; a ref that is already taken is never a dead
  // end; the existing model is offered instead.
  let ref: string
  for (;;) {
    const answer = (
      await deps.prompter.input('Workspace ref for the imported model', suggestedExists ? undefined : suggested)
    ).trim()
    if (answer === '') {
      throw new FlowAborted(EXIT_CODES.FAILURE, 'Aborted: no workspace ref given for the import.')
    }
    try {
      ref = normalizeRef(answer)
    } catch (err) {
      throw new FlowAborted(EXIT_CODES.FAILURE, errorMessage(err), { cause: err })
    }
    if (!refExists(deps.modelsDir, ref)) {
      break
    }
    const picked = await deps.prompter.select(`Model already exists: ${ref}. How should this run proceed?`, [
      { name: `Use the existing workspace model ${ref} (no import)`, value: 'existing' as const },
      { name: 'Import under a different ref', value: 'retry' as const },
      ABORT_CHOICE
    ])
    if (picked === 'existing') {
      return ref
    }
    if (picked === 'abort') {
      throw new FlowAborted(EXIT_CODES.FAILURE, 'Aborted.')
    }
  }

  try {
    await deps.importModel(sourcePath, ref)
  } catch (err) {
    // A usable model must never be lost to a failed import: when the
    // target ref exists after all (e.g. written concurrently), offer it.
    if (refExists(deps.modelsDir, ref)) {
      const useExisting = await deps.prompter.confirm(
        `Import failed (${errorMessage(err)}), but the workspace has a model at ${ref}. Use the existing model?`,
        true
      )
      if (useExisting) {
        return ref
      }
    }
    // A configuration model renders only with its transformation's
    // context, which the inline offer cannot provide: name the command
    // that can.
    if ((await headerKindOf(sourcePath)) === 'configuration-model') {
      throw new FlowAborted(
        err instanceof ExecuteError ? err.exit : EXIT_CODES.VALIDATION_FAILURE,
        `${errorMessage(err)}\nConfiguration models import with their transformation's context: synth model import ${raw} --as ${ref} --tx <transformation>.`,
        { cause: err }
      )
    }
    throw err
  }
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
  /**
   * --save-config as typed. It is rejected next to --config at parse time,
   * so the consent picker must never assemble that combination.
   */
  saveConfig?: string
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

/** Consent select for configuration-based steps whose input is produced mid-run. */
async function consentForLaterSteps(deps: FlowDeps, steps: ChainStep[], indexes: number[]): Promise<void> {
  const many = indexes.length > 1
  const picked = await deps.prompter.select(
    `${listLabels(steps, indexes)} ${many ? 'are' : 'is'} configuration-based; a model produced mid-run cannot take an explicit configuration. Generate default configurations for ${many ? 'these steps' : 'this step'}?`,
    [DEFAULTS_CHOICE, ABORT_CHOICE]
  )
  if (picked === 'abort') {
    consentAborted()
  }
}

/**
 * Complete a `transformation run`/`pipeline run` request: pick the
 * transformation when none was named (single step; chains are typed, not
 * picked), pick or import the source model, settle the configuration
 * consent per the uniform policy, and ask for --out-dir when the last
 * step is m2t. Returns the completed request; throws FlowAborted (or a
 * resolution ExecuteError) when it cannot.
 */
export async function completeRunRequest(deps: FlowDeps, input: RunFlowInput): Promise<RunFlowResult> {
  let txNames = [...input.txNames]
  let { config, defaultConfigs, outDir } = input

  // One models-tree scan serves the --in picker AND the configuration
  // picker; the filters run in memory.
  let scanned: HeaderedModel[] | undefined
  const scan = async (): Promise<HeaderedModel[]> => (scanned ??= await modelHeaders(deps.modelsDir))

  // 1. The transformation (only `transformation run` can arrive without
  // one); a picked candidate already carries its manifest, so the steps
  // need no second resolution.
  let steps: ChainStep[]
  if (txNames.length === 0) {
    const installed = await installedTransformations(deps.workspaceConfig)
    if (installed.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No transformations installed. Use 'synth transformation install' to install one.`
      )
    }
    const picked = await deps.prompter.search('Select a transformation to run', installed.map(txChoice))
    const candidate = installed.find((entry) => entry.name === picked) as TxCandidate
    txNames = [candidate.name]
    steps = [{ txName: candidate.name, packageDir: candidate.packageDir, manifest: candidate.manifest }]
  } else {
    // 2. Resolve the steps from the manifests (same resolution the
    // execution core performs; an unknown name fails here exactly as it
    // would there)
    steps = await resolveChainSteps(deps.workspaceConfig, txNames)
  }
  const first = steps[0]
  const last = steps[steps.length - 1]

  // 3. The source model: pick one matching step 1's source metamodel, or
  // offer to import a .tsx file the user pointed --in at
  let inRef = input.inRef
  if (inRef === undefined) {
    const models = filterModelsForMetamodel(await scan(), first.manifest.source.metamodel)
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
  // 1 only; every other configuration-based step needs the defaults consent
  // (the execution core's own coverage judgment). A picker choice IS that
  // consent.
  if (!defaultConfigs) {
    const uncovered = uncoveredDecisionSteps(steps, config)
    if (uncovered.length > 0 && uncovered[0] === 0) {
      // --save-config forbids --config at parse time; with it on the line
      // the defaults consent is the only lawful choice to assemble.
      const existingConfigs =
        input.saveConfig === undefined ? filterConfigsFor(await scan(), first.manifest.name, inRef) : []
      const choices: PromptChoice<'existing' | 'defaults' | 'abort'>[] = []
      if (existingConfigs.length > 0) {
        choices.push({
          name: 'Use an existing configuration model (--config)',
          value: 'existing',
          description: `${existingConfigs.length} configuration model(s) in the workspace fit ${first.manifest.name} on ${inRef}.`
        })
      }
      choices.push(
        input.saveConfig === undefined
          ? DEFAULTS_CHOICE
          : {
              ...DEFAULTS_CHOICE,
              name: 'Generate default configurations for this run (--default-configs, required by --save-config)'
            },
        ABORT_CHOICE
      )
      const picked = await deps.prompter.select(
        `${stepLabel(steps, 0)} is configuration-based and no configuration was given. How should its decisions be made?`,
        choices
      )
      if (picked === 'abort') {
        consentAborted()
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
 * Pick a saved pipeline by name (schema-valid ones only; a broken file
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
          : `${candidate.steps.join(' -> ')} (${candidate.description})`
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
 * Complete a `config init` request: pick a configuration-based transformation
 * when none was named, then pick (or import) the model the configuration
 * is for, filtered by the transformation's source metamodel. An
 * explicitly named transformation is checked for variability BEFORE any
 * --for prompt; the flow never asks for an answer the shared body would
 * discard.
 */
export async function completeConfigInitRequest(
  deps: FlowDeps,
  input: ConfigInitFlowInput
): Promise<ConfigInitFlowResult> {
  let txName = input.txName
  let manifest: TxManifest | undefined
  if (txName === undefined) {
    const decisionBased = (await installedTransformations(deps.workspaceConfig)).filter(
      (candidate) => candidate.variability
    )
    if (decisionBased.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No configuration-based transformations installed; only configuration-based transformations have configurations.`
      )
    }
    txName = await deps.prompter.search('Select the transformation to configure', decisionBased.map(txChoice))
    manifest = decisionBased.find((candidate) => candidate.name === txName)?.manifest
  }

  let forRef = input.forRef
  if (forRef === undefined) {
    if (manifest === undefined) {
      // Explicitly named transformation: the non-interactive path resolves
      // it too; resolve here to learn variability and the source metamodel
      // BEFORE any prompt.
      try {
        ;({ manifest } = await resolveInstalledTx(deps.workspaceConfig, txName))
      } catch (err) {
        throw new FlowAborted(
          err instanceof TxResolveError ? err.exit : EXIT_CODES.FAILURE,
          errorMessage(err),
          { cause: err }
        )
      }
    }
    if (!manifest.variability) {
      // Same message and exit as the shared body, just BEFORE the --for
      // prompt whose answer it would discard.
      throw new FlowAborted(
        EXIT_CODES.FAILURE,
        `Transformation '${manifest.name}' is not configuration-based (its manifest declares no decision/binding model parts); there is nothing to configure.`
      )
    }
    const models = filterModelsForMetamodel(await modelHeaders(deps.modelsDir), manifest.source.metamodel)
    if (models.length === 0) {
      throw new FlowAborted(
        EXIT_CODES.NOT_FOUND,
        `No models for metamodel '${manifest.source.metamodel}' found in the workspace. Import one with 'synth model import <file> --as <namespace>/<name>'.`
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
