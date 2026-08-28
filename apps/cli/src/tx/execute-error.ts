/**
 * Typed failure of the transformation execution core; `exit` maps to the
 * CLI exit code. Kept in its own module (instead of execute.ts) so command
 * infrastructure can catch it without importing the execution core (and
 * with it the engine) into every command's startup path.
 */
export class ExecuteError extends Error {
  public constructor(
    public readonly exit: number,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options)
  }
}
