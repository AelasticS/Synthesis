import { existsSync } from 'node:fs'

import { Command, Flags } from '@oclif/core'
import {
  WorkspaceConfig,
  loadConfig,
  getWorkspacePath,
  getCurrentNamespacePath,
  getModelsPath,
  getPipelinesPath,
  expandPath,
  isWorkspaceInitialized
} from '../config/index.js'
import type { FlowDeps } from '../interactive/flows.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { isPromptCancel } from '../support/interactive.js'
import { ExecuteError } from '../tx/execute-error.js'

/** What `parseRelaxed` returns: everything optional, nothing validated away. */
export interface RelaxedParseResult<F extends object> {
  argv: unknown[]
  args: Record<string, string | undefined>
  flags: F & { json?: boolean; quiet?: boolean; verbose?: boolean }
}

/**
 * Base command class for all synth commands.
 * Defines global flags and handles namespace switching.
 */
export abstract class BaseCommand<T extends typeof Command = typeof Command> extends Command {
  /**
   * Global flags available on every command.
   */
  static baseFlags = {
    workspace: Flags.string({
      description: 'Override active workspace for this invocation.',
      helpGroup: 'GLOBAL'
    }),
    ns: Flags.string({
      description: 'Namespace context override (otherwise resolved from config).',
      helpGroup: 'GLOBAL'
    }),
    json: Flags.boolean({
      description: 'Emit machine-readable JSON.',
      helpGroup: 'GLOBAL'
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'Suppress informational output.',
      helpGroup: 'GLOBAL'
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Print debug-level logs.',
      helpGroup: 'GLOBAL'
    })
  } as const

  protected workspaceConfig!: WorkspaceConfig
  protected savedPwd!: string

  /**
   * Subclasses implement this instead of run().
   * When execute() is called, the working directory is already
   * set to the current namespace (if one is set).
   */
  abstract execute(): Promise<void>

  /**
   * Main entry point. Handles namespace switching, then calls execute().
   */
  async run(): Promise<void> {
    this.savedPwd = process.cwd()
    this.workspaceConfig = await loadConfig()

    // Recover the global overrides TOLERANTLY (base flags only, nothing
    // strict, nothing required): a spec violation is reported by
    // execute()'s own strict parse with the exact oclif message; run()
    // itself must never fail a command line first.
    let flags: { workspace?: string; ns?: string }
    try {
      ;({ flags } = (await this.parse({
        flags: {},
        baseFlags: BaseCommand.baseFlags,
        args: {},
        strict: false
      })) as { flags: { workspace?: string; ns?: string } })
    } catch {
      flags = {}
    }
    if (flags.workspace) {
      this.workspaceConfig.workspace = expandPath(flags.workspace)
    }

    // Apply --ns override if provided
    if (flags.ns) {
      this.workspaceConfig.currentNamespace = flags.ns
    }

    // Switch to namespace directory if set
    const nsPath = getCurrentNamespacePath(this.workspaceConfig)
    if (nsPath) {
      try {
        process.chdir(nsPath)
      } catch {
        // Namespace folder doesn't exist, stay in current dir
        // Commands can handle this as needed
      }
    }

    try {
      await this.execute()
    } finally {
      // Always restore original working directory
      process.chdir(this.savedPwd)
    }
  }

  /**
   * Fail the command with the given exit code in both output modes. In
   * JSON mode the machine-readable `{ error }` object is the only stdout
   * output; otherwise the message goes through this.error as usual.
   * Either way the process exits non-zero so scripts can detect failure.
   */
  protected jsonAwareFail(json: boolean, message: string, exit: number): never {
    if (json) {
      this.log(JSON.stringify({ error: message }))
      this.exit(exit)
    }
    this.error(message, { exit })
  }

  /**
   * Map a failure thrown by the transformation execution core to the
   * command's exit: a typed ExecuteError keeps its exit code, anything
   * else is a generic failure. Shared by `transformation run` and `pipeline run` so the two
   * surfaces cannot drift.
   */
  protected failFromExecuteError(json: boolean, err: unknown): never {
    if (err instanceof ExecuteError) {
      this.jsonAwareFail(json, err.message, err.exit)
    }
    this.jsonAwareFail(json, errorMessage(err), EXIT_CODES.FAILURE)
  }

  /**
   * Parse against a RELAXED twin of this command's own spec (the same
   * flags and args with nothing required) to see what IS present before
   * deciding between the interactive flow and the strict re-parse. Every
   * non-presence validation (unknown flags, exclusive pairs, value
   * parsing) still applies, so the relaxed parse fails exactly where the
   * strict one would; only MISSING values pass through, to be rescued by
   * a picker or re-reported by the strict parse in execute().
   */
  protected async parseRelaxed<F extends object = Record<string, unknown>>(): Promise<RelaxedParseResult<F>> {
    const ctor = this.constructor as typeof Command
    const relax = <T extends Record<string, unknown>>(spec: T | undefined): T =>
      Object.fromEntries(
        Object.entries(spec ?? {}).map(([name, definition]) => [
          name,
          { ...(definition as Record<string, unknown>), required: false }
        ])
      ) as T
    return (await this.parse({
      flags: relax(ctor.flags),
      baseFlags: BaseCommand.baseFlags,
      args: relax(ctor.args),
      strict: ctor.strict
    })) as unknown as RelaxedParseResult<F>
  }

  /**
   * Run an interactive picker flow with the standard dependencies and the
   * uniform failure mapping: a prompt cancel (ctrl+c) becomes a clean
   * 'Aborted.' with exit 130, every other failure goes through
   * failFromExecuteError. The prompt implementation and the import
   * machinery load lazily, so non-interactive invocations never pay for
   * them. `verbose` threads into the import gate so engine output passes
   * through when asked for.
   */
  protected async runInteractiveFlow<T>(verbose: boolean, flow: (deps: FlowDeps) => Promise<T>): Promise<T> {
    const { makeInquirerPrompter } = await import('../support/interactive.js')
    const { importModelFile } = await import('../models/import-core.js')
    const deps: FlowDeps = {
      prompter: await makeInquirerPrompter(),
      workspaceConfig: this.workspaceConfig,
      modelsDir: getModelsPath(this.workspaceConfig),
      pipelinesDir: getPipelinesPath(this.workspaceConfig),
      invokedFrom: this.savedPwd,
      importModel: async (sourcePath, ref) => {
        await importModelFile({ workspaceConfig: this.workspaceConfig, sourcePath, ref, verbose })
      },
      info: (line) => this.log(line)
    }
    try {
      return await flow(deps)
    } catch (err) {
      if (isPromptCancel(err)) {
        this.error('Aborted.', { exit: 130 })
      }
      this.failFromExecuteError(false, err)
    }
  }

  /**
   * Guard for commands that only make sense inside an initialized
   * workspace (namespace and pipeline management): fail with
   * WORKSPACE_ERROR when the workspace's models directory does not exist.
   */
  protected requireInitializedWorkspace(json: boolean): void {
    if (!existsSync(getModelsPath(this.workspaceConfig))) {
      this.jsonAwareFail(json, 'Workspace not initialized. Run `synth init` first.', EXIT_CODES.WORKSPACE_ERROR)
    }
  }

  /**
   * Get the resolved workspace path.
   */
  protected getWorkspacePath(): string {
    return getWorkspacePath(this.workspaceConfig)
  }

  /**
   * Check if workspace is initialized.
   */
  protected isWorkspaceInitialized(): boolean {
    return isWorkspaceInitialized(this.workspaceConfig)
  }

  /**
   * Log only if not in quiet mode.
   */
  protected logInfo(message: string): void {
    // Access flags through parse - for now just log
    // TODO: Check quiet flag
    this.log(message)
  }

  /**
   * Log debug message only in verbose mode.
   */
  protected logDebug(message: string): void {
    // TODO: Check verbose flag
    this.debug(message)
  }
}
