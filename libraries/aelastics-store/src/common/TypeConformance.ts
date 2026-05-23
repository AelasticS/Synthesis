/*
 * Project: aelastics-store
 * Runtime type-conformance validation for property assignments.
 */

import * as t from "@aelastics/types"
import { ServiceError } from "@aelastics/result"
import { objectType } from "./CommonConstants"

/**
 * Validates that `value` is a store-managed object whose declared type
 * (via the `@@aelastics/type` tag) is the same as or a subtype of
 * `expectedType`.
 *
 * - `null` and `undefined` pass through (Optional handling is upstream).
 * - A value without an `@@aelastics/type` tag is rejected: it cannot have
 *   been produced by `store.deepCreate`, so we can't reason about its type.
 * - The tagged type is resolved via the universal `t.System` schema, so the
 *   check works across schemas (including subtypes defined in a different
 *   schema than the property's declared type).
 *
 * Throws `ServiceError("ValidationError", ...)` on failure.
 */
export function validateConformance(
  value: unknown,
  expectedType: t.ObjectType<any, any>,
  propertyPath: string,
): void {
  if (value === null || value === undefined) return

  const actualPath = (value as any)[objectType] as string | undefined
  if (typeof actualPath !== "string" || actualPath === "") {
    throw new ServiceError(
      "ValidationError",
      `${propertyPath}: value is not a store-managed object (missing '${objectType}' tag); cannot validate type against '${expectedType.fullPathName}'`,
    )
  }

  const actualType = t.System.getType(actualPath) as
    | t.ObjectType<any, any>
    | undefined
  if (!actualType) {
    throw new ServiceError(
      "ValidationError",
      `${propertyPath}: tagged type '${actualPath}' is not registered in the type system`,
    )
  }

  if (!actualType.isOfType(expectedType)) {
    throw new ServiceError(
      "ValidationError",
      `${propertyPath}: expected '${expectedType.fullPathName}' or a subtype, got '${actualPath}'`,
    )
  }
}
