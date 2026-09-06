/*
 * The declared-constraints traversal: run every element's type
 * validators (addValidator predicates) over a finished model. Kept
 * apart from rendering on purpose: while a model renders it is
 * legitimately incomplete (a weak entity exists before its mapping,
 * arrays grow one element at a time), so declared constraints are
 * judgments about the finished model, executed at a validation point
 * such as the CLI's `model validate`, never during authoring.
 */
import * as t from "@aelastics/types"

export interface ConstraintViolation {
  /** the violating element's name */
  element: string
  /** the violating element's scope path (empty when unavailable) */
  path: string
  /** the concrete type whose validator failed */
  type: string
  /** the validator's message */
  message: string
}

interface ElementLike {
  name?: unknown
  path?: unknown
}

interface ModelLike extends ElementLike {
  elements?: unknown[]
}

/** Anything that can name an element's concrete type (a ModelStore). */
export interface TypeProvider {
  getTypeOf(el: unknown): t.Any
}

const checkElement = (provider: TypeProvider, el: unknown, out: ConstraintViolation[]): void => {
  let type: t.Any | undefined
  try {
    type = provider.getTypeOf(el)
  } catch {
    return
  }
  if (type === undefined || type === null) return
  const res = type.checkValidators(el) as { type: string; errors?: Array<{ message?: string }> }
  if (res.type !== "failure") return
  const e = el as ElementLike
  for (const err of res.errors ?? []) {
    out.push({
      element: String(e.name ?? "?"),
      path: String(e.path ?? ""),
      type: type.name,
      message: String(err.message ?? "constraint violated"),
    })
  }
}

/**
 * Check the model and every element against the validators their
 * concrete types declare. Returns the violations in element order;
 * an empty array means every declared constraint holds.
 */
export function checkModelConstraints(provider: TypeProvider, model: ModelLike): ConstraintViolation[] {
  const out: ConstraintViolation[] = []
  checkElement(provider, model, out)
  for (const el of model.elements ?? []) {
    checkElement(provider, el, out)
  }
  return out
}
