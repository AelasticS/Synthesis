---
sidebar_position: 10
title: Object References
---

To be written.

## Concept

An object reference in `@aelastics/types` plays the same role as a foreign key in
a relational data model. In a relational database a foreign key is a column that
holds the identifier of a row in another table rather than embedding that row's
data inline. The two tables stay separate. The relationship is represented by the
key alone.

`objectRef` works the same way at the object-graph level. Instead of nesting a
full object value inside another object, you store a reference to it. The
referenced object lives elsewhere in the graph and is identified separately. This
lets you:

- represent many-to-one and many-to-many relationships without duplicating data
- build cyclic graphs where two objects point to each other
- control which parts of a graph are serialized as embedded values versus as
  lightweight references (relevant when converting to DTO form)

The type exported as `EntityReference` (the original name `ObjectReference` is
also available as an alias) is the runtime type that wraps an `ObjectType` or
`EntityType` and marks a property as a reference rather than an inline value.

```ts
import { entity, objectRef, string, number } from '@aelastics/types'

const Department = entity({ name: string }, ['name'], 'Department')

const Employee = entity(
  {
    name: string,
    employeeNumber: number,
    department: objectRef(Department, 'DepartmentRef'),
  },
  ['employeeNumber'],
  'Employee'
)
```

In the example above, `department` holds a reference to a `Department` instance,
not an embedded copy. When the graph is converted to a DTO, each object,
whether it is a plain object or an entity, receives an auto-generated integer
`id` as part of its `ref` record. This `id` is assigned during serialization
and is local to that serialization context. It is not the entity's declared
identifier (the `['employeeNumber']` key in the example). When the same object
instance appears more than once in the graph, subsequent occurrences are
represented by just the `ref` alone, without repeating the full data. The
receiver uses the `id` to reconnect the reference to the already-serialized
object.
