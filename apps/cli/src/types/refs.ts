/**
 * A Ref is a model address in the form `namespace/name`.
 * Example: `com.example.orders/order-1`
 *
 * Parsing and validation live in `support/refs.ts` (`parseRef`), the
 * single source of truth for the ref grammar.
 */
export type Ref = `${string}/${string}`
