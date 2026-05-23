/*
 * Project: aelastics-store
 * Runtime type-conformance validation for property assignments.
 */

import * as t from "@aelastics/types"
import { ServiceError } from "@aelastics/result"
import { getUnderlyingType, objectType } from "./CommonConstants"

/**
 * Derives the expected entity type that each value assigned/pushed to a
 * property must conform to. Returns `undefined` for non-entity-typed
 * properties (string, number, Map, intersection/union, etc.) — those
 * are not validated at runtime by this module.
 *
 * - For a single-valued Object/Entity property, returns the ObjectType
 *   itself (with Optional/Link wrappers stripped).
 * - For an array-of-Object property, returns the array element's
 *   ObjectType (with Optional/Link wrappers stripped on the element).
 */
export function getEntityElementType(
  prop: t.Any,
): t.ObjectType<any, any> | undefined {
  const u = getUnderlyingType(prop)
  if (u === undefined) return undefined
  if (u.typeCategory === "Array") {
    const elt = getUnderlyingType((u as t.ArrayType<any>).element)
    if (elt && elt.typeCategory === "Object") {
      return elt as t.ObjectType<any, any>
    }
    return undefined
  }
  if (u.typeCategory === "Object") {
    return u as t.ObjectType<any, any>
  }
  return undefined
}

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
