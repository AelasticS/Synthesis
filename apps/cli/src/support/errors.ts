/**
 * Shared error helpers.
 */

/** The message of an Error, or the stringified value for non-Error throws. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
