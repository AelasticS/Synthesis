import { existsSync } from 'node:fs'

import { Command, Flags } from '@oclif/core'
import {
  WorkspaceConfig,
  loadConfig,
  getWorkspacePath,
  getCurrentNamespacePath,
  getModelsPath,
  expandPath,
  isWorkspaceInitialized
} from '../config/index.js'
import { errorMessage } from '../support/errors.js'
import { EXIT_CODES } from '../support/exit-codes.js'
import { ExecuteError } from '../tx/execute-error.js'

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

  /**
   * Commands that rescue missing required values interactively (pickers in
   * a TTY session) set this: a failing spec parse here in run() is then
   * NOT fatal — the command's own parse in execute() re-throws the
   * identical error on the non-interactive path, or the interactive flow
   * fills the missing value. Every other command keeps the fail-fast
   * behavior unchanged.
   */
  protected static deferParseErrors = false

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

    // Apply --workspace override if provided
    let flags: { workspace?: string; ns?: string }
    try {
      ;({ flags } = await this.parse(this.constructor as typeof BaseCommand))
    } catch (err) {
      if (!(this.constructor as typeof BaseCommand).deferParseErrors) {
        throw err
      }
      // Recover the global overrides tolerantly so --workspace/--ns still
      // apply; execute()'s own parse reproduces (or rescues) the error.
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
