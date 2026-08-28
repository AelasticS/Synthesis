/**
 * Dynamic shell completion: turn "the words on the command line so far"
 * into the candidate VALUES for the position being completed. This is the
 * engine behind the hidden `synth completions` command that the shipped
 * bash/zsh snippets call on TAB.
 *
 * Contract (stable — the shell scripts depend on it):
 *   - Input: the command-line words AFTER the program name, in order, the
 *     LAST word being the one under the cursor ('' when a new word starts).
 *     The last word may arrive in the single-token `--flag=partial` form
 *     (bash reassembles its '='-split words; zsh never splits) — it
 *     completes exactly like `--flag partial`.
 *   - Output: newline-separated candidate values for that position,
 *     filtered by the partial word; nothing else.
 *   - Values only: command names and flag names are the base completion's
 *     job — for a position this module has no candidates for (including
 *     any partial starting with '-'), it prints nothing.
 *   - It NEVER errors and never blocks on the engine: candidates come from
 *     the candidate provider (manifests, headers, pipeline files).
 *
 * Command knowledge (which flags take values, which alias ids exist) is
 * derived from the loaded oclif config — never hand-maintained. Global
 * flags typed before the topic (`synth -q tx run <TAB>`) are skipped when
 * resolving the command, and a `--workspace`/`--ns` override anywhere on
 * the line resolves the candidates from THAT workspace, exactly like the
 * command being completed would.
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

import { expandPath, getModelsPath, getPipelinesPath } from '../config/index.js'
import type { WorkspaceConfig } from '../config/index.js'
import { readPipelineFile } from '../pipelines/store.js'
import { resolveInstalledTx } from '../tx/load.js'
import type { TxManifest } from '../tx/manifest.js'
import {
  allModels,
  chainNext,
  configsFor,
  installedTransformations,
  modelsForMetamodel,
  namespaces,
  pipelines
} from './provider.js'

/**
 * What the completion engine needs to know about one CLI command, derived
 * by the caller from the loaded oclif config (`this.config.commands`):
 * canonical id and alias ids in space form ('transformation run',
 * 'tx run'), and the '--'-prefixed names of its value-taking flags.
 */
export interface CompletionCommandSpec {
  id: string
  aliases: string[]
  valueFlags: string[]
}

/**
 * Global value-taking flags every command accepts (the base flags). Needed
 * even before a command is resolved: for skipping leading globals and for
 * completing `--ns` on a bare `synth --ns <TAB>`.
 */
const GLOBAL_VALUE_FLAGS = new Set(['--workspace', '--ns'])

interface ResolvedCommand {
  /** Canonical id in space form — what the position logic switches on. */
  id: string
  valueFlags: Set<string>
}

/**
 * Every id and alias id mapped to its command's completion knowledge.
 * oclif lists alias STUB entries too (their id appears in their own alias
 * list); those are skipped, and canonical ids always win over alias keys.
 */
function commandTable(commands: readonly CompletionCommandSpec[]): Map<string, ResolvedCommand> {
  const table = new Map<string, ResolvedCommand>()
  const real = commands.filter((command) => !command.aliases.includes(command.id))
  for (const command of real) {
    table.set(command.id, {
      id: command.id,
      valueFlags: new Set([...GLOBAL_VALUE_FLAGS, ...command.valueFlags])
    })
  }
  for (const command of real) {
    for (const alias of command.aliases) {
      if (!table.has(alias)) {
        table.set(alias, table.get(command.id) as ResolvedCommand)
      }
    }
  }
  return table
}

/** The positional tokens among `tokens`, skipping flags and their values. */
function positionalsOf(tokens: string[], valueFlags: ReadonlySet<string>): string[] {
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

/**
 * The installed transformation's manifest, tolerantly (assistance, not a
 * gate): one lookup serves both the source metamodel (--in/--for filters)
 * and the manifest name (`generatedBy.tx` in --config filters).
 */
async function installedManifestOf(
  config: WorkspaceConfig,
  txName: string | undefined
): Promise<TxManifest | undefined> {
  if (txName === undefined) {
    return undefined
  }
  try {
    return (await resolveInstalledTx(config, txName)).manifest
  } catch {
    return undefined
  }
}

/**
 * The transformation whose manifest governs `--in`/`--config` at this
 * position: the first positional for `transformation run`, the named
 * pipeline's first step for `pipeline run` (ONE lenient file read — never
 * a directory scan).
 */
async function stepOneTxOf(
  commandId: string,
  positionals: string[],
  pipelinesDir: string
): Promise<string | undefined> {
  const first = positionals[0]
  if (commandId !== 'pipeline run' || first === undefined) {
    return first
  }
  try {
    return (await readPipelineFile(pipelinesDir, first)).pipeline?.steps[0]
  } catch {
    return undefined
  }
}

/**
 * Candidate values for the position the last word marks. Unknown context
 * yields an empty list — never an error.
 */
export async function completionCandidates(
  config: WorkspaceConfig,
  commands: readonly CompletionCommandSpec[],
  words: string[]
): Promise<string[]> {
  if (words.length === 0) {
    return []
  }
  let partial = words[words.length - 1]
  let context = words.slice(0, -1)

  // The single-token `--flag=partial` form splits into flag + value here,
  // so both spellings take the identical path below.
  const eq = partial.startsWith('--') ? partial.indexOf('=') : -1
  if (eq > 0) {
    context = [...context, partial.slice(0, eq)]
    partial = partial.slice(eq + 1)
  }
  if (partial.startsWith('-')) {
    return [] // flag names are the base completion's job
  }

  // Honor a --workspace/--ns override typed anywhere on the line: resolve
  // the candidates from THAT workspace, exactly like the command itself.
  const workspaceOverride = flagValueOf(context, '--workspace')
  const nsOverride = flagValueOf(context, '--ns')
  if (workspaceOverride !== undefined || nsOverride !== undefined) {
    config = {
      ...config,
      ...(workspaceOverride !== undefined ? { workspace: expandPath(workspaceOverride) } : {}),
      ...(nsOverride !== undefined ? { currentNamespace: nsOverride } : {})
    }
  }
  const modelsDir = getModelsPath(config)
  const pipelinesDir = getPipelinesPath(config)

  // Resolve the command from the first tokens that are not global flags
  // (or their values): `synth -q tx run <TAB>` completes like
  // `synth tx run <TAB>`.
  let start = 0
  while (start < context.length && context[start].startsWith('-')) {
    start += !context[start].includes('=') && GLOBAL_VALUE_FLAGS.has(context[start]) ? 2 : 1
  }
  const table = commandTable(commands)
  const topic = context[start]
  const verb = context[start + 1]
  let command: ResolvedCommand | undefined
  let rest: string[] = []
  if (topic !== undefined && verb !== undefined && table.has(`${topic} ${verb}`)) {
    command = table.get(`${topic} ${verb}`)
    rest = context.slice(start + 2)
  } else if (topic !== undefined && table.has(topic)) {
    command = table.get(topic)
    rest = context.slice(start + 1)
  }
  const valueFlags = command?.valueFlags ?? GLOBAL_VALUE_FLAGS

  const finish = (candidates: string[]): string[] =>
    [...new Set(candidates)].filter((candidate) => candidate.startsWith(partial))

  // A flag immediately before the cursor that takes a value: complete it.
  const previous = context[context.length - 1]
  if (previous !== undefined && previous.startsWith('--') && valueFlags.has(previous)) {
    if (previous === '--ns') {
      return finish(await namespaces(modelsDir))
    }
    if (command === undefined) {
      return []
    }
    const positionals = positionalsOf(rest, valueFlags)
    if (previous === '--in' && (command.id === 'transformation run' || command.id === 'pipeline run')) {
      const manifest = await installedManifestOf(config, await stepOneTxOf(command.id, positionals, pipelinesDir))
      return finish((await modelsForMetamodel(modelsDir, manifest?.source.metamodel)).map((candidate) => candidate.ref))
    }
    if (previous === '--config' && (command.id === 'transformation run' || command.id === 'pipeline run')) {
      const manifest = await installedManifestOf(config, await stepOneTxOf(command.id, positionals, pipelinesDir))
      const inRef = flagValueOf(rest, '--in')
      return finish((await configsFor(modelsDir, manifest?.name, inRef)).map((candidate) => candidate.ref))
    }
    if (previous === '--for' && command.id === 'config init') {
      const manifest = await installedManifestOf(config, positionals[0])
      return finish((await modelsForMetamodel(modelsDir, manifest?.source.metamodel)).map((candidate) => candidate.ref))
    }
    return [] // a value flag with free-form values (paths, new refs, names)
  }

  if (command === undefined) {
    return []
  }
  const positionals = positionalsOf(rest, valueFlags)

  switch (command.id) {
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
