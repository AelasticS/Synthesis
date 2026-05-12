/**
 * The report emitted by stub commands.
 * In JSON mode this is the entire output; in text mode it drives the formatted message.
 */
export interface StubReport {
  /** Always true for stub commands. */
  stub: true
  /** The full command path, e.g. "model show" or "tx install". */
  command: string
  /** Parsed positional arguments. */
  args: Record<string, unknown>
  /** Parsed flags (excluding global flags unless they affect output). */
  flags: Record<string, unknown>
  /** Human-readable description of what this command would do when implemented. */
  wouldDo: string[]
}
