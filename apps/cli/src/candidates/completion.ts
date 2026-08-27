/**
 * Dynamic shell completion: turn "the words on the command line so far"
 * into the candidate VALUES for the position being completed. This is the
 * engine behind the hidden `synth completions` command that the shipped
 * bash/zsh snippets call on TAB.
 *
 * Contract (stable — the shell scripts depend on it):
 *   - Input: the command-line words AFTER the program name, in order, the
 *     LAST word being the one under the cursor ('' when a new word starts).
 *   - Output: newline-separated candidate values for that position,
 *     filtered by the partial word; nothing else.
 *   - Values only: command names and flag names are the base completion's
 *     job — for a position this module has no candidates for (including
 *     any partial starting with '-'), it prints nothing.
 *   - It NEVER errors and never blocks on the engine: candidates come from
 *     the candidate provider (manifests, headers, pipeline files).
 *
 * Completed positions: transformation names after `transformation run`
 * (chain-aware from the second positional on), after `transformation
 * show`/`uninstall`, and for `pipeline mk` steps; model refs after `--in`
 * (source-metamodel-filtered when the transformation or pipeline is
 * already on the line), after `--for`, and for `model show`/`rm`/
 * `validate`/`export`; configuration refs after `--config`
 * (transformation- and --in-aware) and for `config show`/`rm`/`edit`;
 * pipeline names after `pipeline run`/`show`/`rm`/`edit`; namespaces
 * after `cd`, `namespace rm`, and `--ns`. Typing aliases (`tx`, `pl`,
 * `ns`) complete like their canonical topics.
 */

import { getModelsPath, getPipelinesPath } from '../config/index.js'
import type { WorkspaceConfig } from '../config/index.js'
import { loadTxManifest } from '../tx/manifest.js'
import {
  allModels,
  chainNext,
  configsFor,
  installedTransformations,
  modelsForMetamodel,
  namespaces,
  pipelines
} from './provider.js'

const TOPIC_ALIASES: Record<string, string> = { tx: 'transformation', pl: 'pipeline', ns: 'namespace' }

/** Global value-taking flags every command accepts. */
const BASE_VALUE_FLAGS = ['--workspace', '--ns']

/**
 * Value-taking flags per command — needed to tell a flag's value apart
 * from a positional when walking the words. Commands not listed complete
 * no positionals here; `--ns` still completes for them.
 */
const VALUE_FLAGS: Record<string, string[]> = {
  'transformation run': ['--in', '--out', '--out-dir', '--config', '--save-config', '--save-as'],
  'pipeline run': ['--in', '--out', '--out-dir', '--config', '--save-config'],
  'pipeline mk': ['--description'],
  'pipeline show': [],
  'pipeline rm': [],
  'pipeline edit': [],
  'config init': ['--for', '--out'],
  'config show': ['--tx'],
  'config rm': [],
  'config edit': [],
  'model show': [],
  'model rm': [],
  'model validate': ['--against', '--tx'],
  'model export': ['--to'],
  'transformation show': [],
  'transformation uninstall': [],
  'namespace rm': [],
  cd: []
}

/** The positional tokens among `tokens`, skipping flags and their values. */
function positionalsOf(tokens: string[], valueFlags: Set<string>): string[] {
  const out: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.startsWith('--')) {
      if (!token.includes('=') && valueFlags.has(token)) {
        i++ // the next token is this flag's value
      }
      continue
    }
    if (token.startsWith('-') && token !== '-') {
      continue // short flags (-q, -v) take no values
    }
    out.push(token)
  }
  return out
}

/** The value given for `flag` among `tokens` (`--flag value` or `--flag=value`). */
function flagValueOf(tokens: string[], flag: string): string | undefined {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === flag && i + 1 < tokens.length) {
      return tokens[i + 1]
    }
    if (tokens[i].startsWith(`${flag}=`)) {
      return tokens[i].slice(flag.length + 1)
    }
  }
  return undefined
}

/** Source metamodel of an installed transformation, or undefined. */
async function sourceMetamodelOf(config: WorkspaceConfig, txName: string | undefined): Promise<string | undefined> {
  if (txName === undefined) {
    return undefined
  }
  const entry = config.transformations[txName]
  if (entry === undefined) {
    return undefined
  }
  try {
    return (await loadTxManifest(entry.path)).source.metamodel
  } catch {
    return undefined
  }
}

/** Manifest name of an installed transformation (stamped into generatedBy.tx). */
async function manifestNameOf(config: WorkspaceConfig, txName: string | undefined): Promise<string | undefined> {
  if (txName === undefined) {
    return undefined
  }
  const entry = config.transformations[txName]
  if (entry === undefined) {
    return undefined
  }
  try {
    return (await loadTxManifest(entry.path)).name
  } catch {
    return undefined
  }
}

/**
 * Candidate values for the position the last word marks. Unknown context
 * yields an empty list — never an error.
 */
export async function completionCandidates(config: WorkspaceConfig, words: string[]): Promise<string[]> {
  if (words.length === 0) {
    return []
  }
  const partial = words[words.length - 1]
  if (partial.startsWith('-')) {
    return [] // flag names are the base completion's job
  }
  const context = words.slice(0, -1)
  const modelsDir = getModelsPath(config)
  const pipelinesDir = getPipelinesPath(config)

  // Resolve the command: a canonical or aliased topic + verb, or `cd`.
  const topic = context[0] === undefined ? undefined : (TOPIC_ALIASES[context[0]] ?? context[0])
  const isCd = topic === 'cd'
  const commandKey = isCd ? 'cd' : topic !== undefined && context[1] !== undefined ? `${topic} ${context[1]}` : undefined
  const rest = isCd ? context.slice(1) : context.slice(2)
  const valueFlags = new Set([...BASE_VALUE_FLAGS, ...(commandKey !== undefined ? (VALUE_FLAGS[commandKey] ?? []) : [])])

  const finish = (candidates: string[]): string[] =>
    [...new Set(candidates)].filter((candidate) => candidate.startsWith(partial))

  // A flag immediately before the cursor that takes a value: complete it.
  const previous = context[context.length - 1]
  if (previous !== undefined && previous.startsWith('--') && valueFlags.has(previous)) {
    if (previous === '--ns') {
      return finish(await namespaces(modelsDir))
    }
    if (commandKey === undefined) {
      return []
    }
    const positionals = positionalsOf(rest, valueFlags)
    if (previous === '--in' && (commandKey === 'transformation run' || commandKey === 'pipeline run')) {
      let txName: string | undefined = positionals[0]
      if (commandKey === 'pipeline run' && txName !== undefined) {
        txName = (await pipelines(pipelinesDir)).find((candidate) => candidate.name === positionals[0])?.steps[0]
      }
      const metamodel = await sourceMetamodelOf(config, txName)
      return finish((await modelsForMetamodel(modelsDir, metamodel)).map((candidate) => candidate.ref))
    }
    if (previous === '--config' && (commandKey === 'transformation run' || commandKey === 'pipeline run')) {
      let txName: string | undefined = positionals[0]
      if (commandKey === 'pipeline run' && txName !== undefined) {
        txName = (await pipelines(pipelinesDir)).find((candidate) => candidate.name === positionals[0])?.steps[0]
      }
      const inRef = flagValueOf(rest, '--in')
      return finish(
        (await configsFor(modelsDir, await manifestNameOf(config, txName), inRef)).map((candidate) => candidate.ref)
      )
    }
    if (previous === '--for' && commandKey === 'config init') {
      const metamodel = await sourceMetamodelOf(config, positionals[0])
      return finish((await modelsForMetamodel(modelsDir, metamodel)).map((candidate) => candidate.ref))
    }
    return [] // a value flag with free-form values (paths, new refs, names)
  }

  if (commandKey === undefined) {
    return []
  }
  const positionals = positionalsOf(rest, valueFlags)

  switch (commandKey) {
    case 'transformation run': {
      // First positional: every installed transformation; later ones: only
      // chain-compatible continuations of the PREVIOUS step.
      if (positionals.length === 0) {
        return finish((await installedTransformations(config)).map((candidate) => candidate.name))
      }
      return finish((await chainNext(config, positionals[positionals.length - 1])).map((candidate) => candidate.name))
    }
    case 'pipeline mk': {
      // First positional is the NEW name (free-form); the steps behind it
      // complete exactly like a `transformation run` chain.
      if (positionals.length === 0) {
        return []
      }
      if (positionals.length === 1) {
        return finish((await installedTransformations(config)).map((candidate) => candidate.name))
      }
      return finish((await chainNext(config, positionals[positionals.length - 1])).map((candidate) => candidate.name))
    }
    case 'pipeline run':
    case 'pipeline show':
    case 'pipeline rm':
    case 'pipeline edit': {
      if (positionals.length > 0) {
        return []
      }
      return finish((await pipelines(pipelinesDir)).map((candidate) => candidate.name))
    }
    case 'config init': {
      if (positionals.length > 0) {
        return []
      }
      return finish(
        (await installedTransformations(config))
          .filter((candidate) => candidate.variability)
          .map((candidate) => candidate.name)
      )
    }
    case 'config show':
    case 'config rm':
    case 'config edit': {
      if (positionals.length > 0) {
        return []
      }
      return finish((await configsFor(modelsDir)).map((candidate) => candidate.ref))
    }
    case 'model show':
    case 'model rm':
    case 'model validate':
    case 'model export': {
      if (positionals.length > 0) {
        return []
      }
      return finish((await allModels(modelsDir)).map((candidate) => candidate.ref))
    }
    case 'transformation show':
    case 'transformation uninstall': {
      if (positionals.length > 0) {
        return []
      }
      return finish((await installedTransformations(config)).map((candidate) => candidate.name))
    }
    case 'cd':
    case 'namespace rm': {
      if (positionals.length > 0) {
        return []
      }
      return finish(await namespaces(modelsDir))
    }
    default:
      return []
  }
}
