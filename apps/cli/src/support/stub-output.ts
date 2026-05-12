import type { StubReport } from '../types/stub.js'

/**
 * Format a stub report for text output.
 *
 * Output rules:
 * - Default: `[stub] synth <command> — would: <line>` for each nextStep,
 *   followed by `args:` and `flags:` echo.
 * - quiet: suppresses the args/flags echo but still prints the would lines.
 * - verbose: appends workspace resolution debug info.
 */
export function formatStubText(
  report: StubReport,
  options: { quiet?: boolean; verbose?: boolean }
): string {
  const lines: string[] = []

  // Header with would-do lines
  for (const step of report.wouldDo) {
    lines.push(`[stub] synth ${report.command} — would: ${step}`)
  }

  // Args and flags echo (unless quiet)
  if (!options.quiet) {
    lines.push(`  args: ${JSON.stringify(report.args)}`)
    lines.push(`  flags: ${JSON.stringify(report.flags)}`)
  }

  // Debug info (if verbose)
  if (options.verbose) {
    lines.push(`[debug] resolved workspace: <unresolved (stub)>`)
  }

  return lines.join('\n')
}

/**
 * Format a stub report for JSON output.
 */
export function formatStubJson(report: StubReport): string {
  return JSON.stringify(report, null, 2)
}
