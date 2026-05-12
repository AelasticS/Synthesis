/**
 * Exit codes for the CLI, matching the documentation.
 *
 * @see docs/cli/commands.md §"Exit codes"
 */
export const EXIT_CODES = {
  /** Success. */
  SUCCESS: 0,
  /** Generic failure (unhandled error, invalid arguments). */
  FAILURE: 1,
  /** Validation failure (one or more model errors reported). */
  VALIDATION_FAILURE: 2,
  /** Resource not found (model, transformation, or namespace). */
  NOT_FOUND: 3,
  /** Workspace not initialized or unreadable. */
  WORKSPACE_ERROR: 4
} as const

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES]
