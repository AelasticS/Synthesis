import * as t from "@aelastics/types"

/*
 * Namespace-ness is a CLASSIFICATION, not a kind of element. Any
 * metamodel concept may be declared a namespace (its contained
 * elements' names are then scoped by it), independently of its place
 * in the containment hierarchy; single inheritance made a Namespace
 * supertype unable to express that. The registry lives and dies with
 * the loaded type objects: a metamodel module calls declareNamespace
 * right next to its t.subtype definition, so the declaration is
 * re-established at module load exactly like the type itself, and
 * correctness rests on the same type-identity invariant isTypeOf
 * already requires (one shared module instance per metamodel).
 */

const namespaceTypes = new WeakSet<object>()

/** Declare a metamodel concept a namespace. Call once, next to the
 * type definition, in the metamodel module. */
export const declareNamespace = (type: t.Any): void => {
  namespaceTypes.add(type as unknown as object)
}

/** True when the type, or any of its supertypes, is declared a
 * namespace. */
export const isNamespaceType = (type: t.Any | undefined): boolean => {
  for (let cur: any = type; cur !== undefined && cur !== null; cur = cur.superType) {
    if (namespaceTypes.has(cur)) return true
  }
  return false
}
