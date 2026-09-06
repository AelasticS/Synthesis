/*
 * The declared-constraints traversal over a model-like structure: the
 * helper runs each element's concrete-type validators and reports
 * violations; it never judges elements without validators.
 */
import * as t from "@aelastics/types"

import { checkModelConstraints, TypeProvider } from "./check-constraints"

const S = t.schema("CheckConstraintsTestSchema")

const Node = t.object(
  {
    name: t.string,
    next: t.optional(t.link(S, "Node")),
  },
  "Node",
  S
)

// arity-style constraint: a node must not point at itself...
Node.addValidator({
  predicate: (v: unknown) => (v as { next?: unknown }) !== (v as { next?: unknown }).next,
  message: (_v: unknown, label?: string) => `${label ?? "Node"}: points at itself`,
})
// ...and walking next must terminate (acyclicity-style walker)
Node.addValidator({
  predicate: (v: unknown) => {
    const seen = new Set<unknown>()
    let cur: unknown = v
    while (cur !== undefined && cur !== null) {
      if (seen.has(cur)) return false
      seen.add(cur)
      cur = (cur as { next?: unknown }).next
    }
    return true
  },
  message: (_v: unknown, label?: string) => `${label ?? "Node"}: cyclic next chain`,
})

const Plain = t.object({ name: t.string }, "Plain", S)

const provider: TypeProvider = {
  getTypeOf: (el: unknown) => ((el as { kind?: string }).kind === "plain" ? Plain : Node),
}

interface TestNode {
  kind?: string
  name: string
  path?: string
  next?: TestNode
}

const model = (...elements: TestNode[]) => ({ kind: "plain", name: "m", elements })

describe("checkModelConstraints", () => {
  it("returns no violations for a terminating chain", () => {
    const b: TestNode = { name: "b" }
    const a: TestNode = { name: "a", next: b }
    expect(checkModelConstraints(provider, model(a, b))).toEqual([])
  })

  it("reports each violated constraint with the element and message", () => {
    const a: TestNode = { name: "a", path: "//m" }
    const b: TestNode = { name: "b", path: "//m" }
    a.next = b
    b.next = a
    const violations = checkModelConstraints(provider, model(a, b))
    expect(violations).toHaveLength(2)
    expect(violations[0]).toMatchObject({ element: "a", type: "Node" })
    expect(violations[0].message).toContain("cyclic next chain")
    expect(violations[1].element).toBe("b")
  })

  it("ignores elements whose types declare no validators", () => {
    const p: TestNode = { kind: "plain", name: "p" }
    expect(checkModelConstraints(provider, model(p))).toEqual([])
  })
})
