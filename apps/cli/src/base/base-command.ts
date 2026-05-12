import { Command, Flags } from '@oclif/core'

/**
 * Base command class for all synth commands.
 * Defines global flags that are inherited by every subclass.
 */
export abstract class BaseCommand<T extends typeof Command = typeof Command> extends Command {
  /**
   * Global flags available on every command.
   * These are automatically merged with each subclass's static flags.
   */
  static baseFlags = {
    workspace: Flags.string({
      description: 'Override active workspace for this invocation.',
      helpGroup: 'GLOBAL'
    }),
    ns: Flags.string({
      description: 'Namespace context override (otherwise resolved from pwd).',
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
   * Resolve the active workspace path.
   * Currently returns a placeholder; will be implemented to read from config.
   */
  protected resolveWorkspace(): string {
    // TODO: Read from ~/.synth/config.json or --workspace flag
    return '<unresolved>'
  }
}
