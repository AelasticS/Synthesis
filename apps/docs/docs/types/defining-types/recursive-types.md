---
sidebar_position: 7
title: Recursive and Cyclic Types
---

TypeScript and JavaScript objects can reference themselves: a tree node that
has children of the same type, or two entity types that reference each other.
Defining such types naively creates a circular dependency: `Child` needs
`Person` before `Person` is defined, and vice versa.

`link()` solves this by creating a lazy reference. Instead of embedding the
type descriptor directly, a link stores a schema path and resolves it when
traversal starts.

---

## `link()`: lazy type reference

```ts
link(schema, path, name?, owner?)
```

- `schema`: the `TypeSchema` that contains the target type
- `path`: the name (or path) of the target type within that schema
- `name`: optional name for the link type itself
- `owner`: the schema that owns this link type (defaults to `schema`)

The link is not resolved at definition time. Resolution happens during schema
traversal (validation, DTO conversion, instance creation). If the schema has
never been validated and the target type cannot be found, the library throws.

---

## Self-referential type

A tree node that contains children of the same type:

```ts
import { object, arrayOf, optional, link, string, number, schema } from '@aelastics/types'

const mySchema = schema('mySchema')

const TreeNode = object(
  {
    value:    number,
    label:    string,
    children: arrayOf(link(mySchema, 'TreeNode'), 'TreeNodeArray', mySchema),
  },
  'TreeNode',
  mySchema
)
```

`link(mySchema, 'TreeNode')` refers back to `TreeNode` by name within
`mySchema`. The type does not exist yet when `link` is called; the reference
is resolved lazily when traversal starts.

---

## Mutually recursive types

Two types that reference each other:

```ts
import { object, optional, link, string, number, schema } from '@aelastics/types'

const mySchema = schema('mySchema')

const Child = object(
  {
    name:   string,
    age:    number,
    parent: optional(link(mySchema, 'Person')),
  },
  'Child',
  mySchema
)

const Person = object(
  {
    name:     string,
    age:      number,
    children: arrayOf(Child, 'ChildArray', mySchema),
  },
  'Person',
  mySchema
)
```

`Child` uses `link(mySchema, 'Person')` to reference `Person`, which has not
been defined yet at that point. When traversal runs on a `Person` instance, the
link resolves to the `Person` type in `mySchema`.

---

## Cyclic instance graphs

A linked property can point to a value that is already part of the current
graph, for example `child.parent` pointing back to the `Person` instance that
contains `child`. The traversal engine tracks visited nodes and will not recurse
into the same instance twice, so cyclic structures are handled without infinite
loops.
