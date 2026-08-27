import { format } from 'node:util'

/**
 * The engine traces transformations and dumps JSX via console.log (which
 * oclif's this.log also uses). Unless --verbose, each engine call runs
 * with console.log buffered; the buffer is flushed to stderr on failure so
 * errors keep their engine context.
 */
export class EngineOutputBuffer {
  private lines: string[] = []
  private readonly originalLog = console.log

  public constructor(private readonly active: boolean) {}

  public async run<T>(fn: () => T | Promise<T>): Promise<T> {
    if (!this.active) {
      return await fn()
    }
    console.log = (...logArgs: unknown[]): void => {
      this.lines.push(format(...logArgs))
    }
    try {
      return await fn()
    } finally {
      console.log = this.originalLog
    }
  }

  public flushToStderr(): void {
    for (const line of this.lines) {
      process.stderr.write(`${line}\n`)
    }
    this.lines = []
  }
}
