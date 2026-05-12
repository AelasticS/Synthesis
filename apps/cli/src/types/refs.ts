/**
 * A Ref is a model address in the form `namespace/name`.
 * Example: `com.example.orders/order-1`
 */
export type Ref = `${string}/${string}`

/**
 * Check if a string is a valid Ref (contains exactly one slash).
 */
export function isRef(value: string): value is Ref {
  const slashIndex = value.indexOf('/')
  return slashIndex > 0 && slashIndex === value.lastIndexOf('/') && slashIndex < value.length - 1
}

/**
 * Parse a Ref into its namespace and name components.
 * Returns undefined if the value is not a valid Ref.
 */
export function parseRef(value: string): { namespace: string; name: string } | undefined {
  if (!isRef(value)) return undefined
  const slashIndex = value.indexOf('/')
  return {
    namespace: value.slice(0, slashIndex),
    name: value.slice(slashIndex + 1)
  }
}
