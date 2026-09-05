---
sidebar_position: 1
---

# 1. The scoped metamodel stages

## The rule you have been living under

Everything in Parts 1 to 3 obeyed one naming rule: element names are
unique across the whole model. Part 1's source model page introduced
it, and the duplicate-name error you may have met is its enforcement:

```text
newModelElement: Duplicate name "//www.aelastics.org/Library/number"
```

That rule is why the sample attributes were called `bookId` and
`authorName` rather than `id` and `name`: three entities cannot each
have an `id` when all names share one pool. It is a perfectly workable
convention, and the tutorial metamodels keep it by default. But it is
a convention forced by the naming world, not chosen by the modeler,
and real schemas do not follow it: in SQL, every table has its own
`id`.

## One line changes the world

A metamodel may declare any of its concepts a *name scope*. The model
itself is always a scope; a declared concept becomes a nested one:

```ts
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel"

export const Entity = t.subtype(
  ModelElement,
  {
    attributes: t.arrayOf(Attribute),
  },
  "Entity",
  EERTutorialNameScopes_TypeSchema
)

// An entity scopes its attributes' names.
declareNamespace(Entity)
```

Under this declaration, an element's full path nests through its
scope: `Book`'s key is `//Library/Book/id`, `Author`'s is
`//Library/Author/id`, and the two coexist. Names must still be unique
*inside* a scope: one entity cannot carry two attributes named `id`.

References follow the scopes. A bare `$refByName` is resolved against
the nearest enclosing scope first, then probed outward to the model,
innermost match winning. A reference into a *sibling* scope, which a
bare name can never reach, is written as a path such as `Author/id`.
The [building-models guide](../../../guides/building-models.md#name-scopes)
is the reference description.

## The two new stages

The tutorial keeps its promise that the metamodels stay deliberately
simple, so the scoped variants are *additional stages*, exactly the
pattern the EER package already uses for `basic` and `advanced`. The
flat stages you used in Parts 1 to 3 are untouched, and so are the
models and packages built on them.

The EER package gains `eer-tutorial-metamodel/name-scopes`:
structurally identical to `basic`, plus `declareNamespace(Entity)`.
The relational package gains `rel-tutorial-metamodel/name-scopes`:
structurally identical to the base stage, plus
`declareNamespace(Table)`. Everything the base stage deliberately
excludes, composite foreign keys, constraint elements, indexes, stays
excluded; scopes are a naming upgrade, not a structural one.

## One component learns a second context

The scoped world moves the domain vocabulary to the model level, as
the next page shows, and that surfaces a small authoring question: the
`Domain` tag now appears in two positions. Declared at the top of the
schema, it must connect into the model's `elements`; nested under an
`Attribute`, it must connect into the attribute's `attrDomain`. The
stage's components file says exactly that, with an ordered candidate
list in place of a single property name:

```ts
// In the scoped world a Domain appears in two contexts: declared once as
// model-level vocabulary (a direct child of the schema connects into
// `elements`) or referenced from an attribute (a child of an Attribute
// connects into `attrDomain`). Ordered candidates with first-available
// semantics pick the right one per context.
export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, defaultConnectionInfo(["attrDomain", "elements"]))
}
```

The engine tries the candidates in order and connects through the
first property that exists on the parent and is free to take the
element. Under an `Attribute`, that is `attrDomain`; under the schema,
which has no `attrDomain`, it is `elements`. Every other component is
copied from the stage you already know.

## Where you are

Two stage modules, one `declareNamespace` line each, one component
with a second connection context. Nothing else in either package
changed. The next page rewrites the Library sample in the naming world
these stages create.
