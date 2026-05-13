/**
 * The minimal execution contract every CLI-runnable Synthesis transformation
 * must satisfy. v0 — additions like logger, abort signal, structured inputs,
 * and trace collection will be layered on as concrete needs emerge.
 */
export interface Runnable {
  /** Stable unique identifier — used by CLI args (e.g. `synth example run <id>`). */
  readonly id: string;

  /** Human-readable display name. */
  readonly name: string;

  /** One-paragraph description shown by `synth example describe`. */
  readonly description: string;

  /**
   * Execute the transformation.
   * Returns artifacts (named string payloads). The caller (typically the CLI)
   * decides what to do with them — write to disk, render to stdout, etc.
   * Runnables MUST NOT touch the filesystem themselves.
   */
  run(): Promise<RunResult>;
}

export interface RunResult {
  readonly artifacts: ReadonlyArray<Artifact>;
}

export interface Artifact {
  /** Suggested file name or short identifier (no path components). */
  readonly name: string;
  /** Artifact content as a string (UTF-8). Binary artifacts are out of scope for v0. */
  readonly content: string;
}
