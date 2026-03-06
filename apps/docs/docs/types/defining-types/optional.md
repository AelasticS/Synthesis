---
sidebar_position: 6
title: Optional Types
---

An optional type wraps any other type and allows `undefined` as an additional
valid value. Use it to mark a property as not required.

---

## `optional()` — factory

```ts
optional(type, name?, owner?)
```

Wraps `type` so that `undefined` is accepted alongside the base type's values.
The wrapped value is `TypeOf<T> | undefined` at the TypeScript level.

```ts
import { object, optional, string, number } from '@aelastics/types'

const Person = object(
  {
    name:        string,
    age:         number,
    middleName:  optional(string),
    phoneNumber: optional(string),
  },
  'Person'
)
```

```ts
import { TypeOf } from '@aelastics/types'

type IPerson = TypeOf<typeof Person>
// { name: string; age: number; middleName: string | undefined; phoneNumber: string | undefined }
```

---

## Pre-defined optional instances

The library exports three ready-made optional types for the most common cases:

```ts
import { optionalString, optionalNumber, optionalBoolean } from '@aelastics/types'
```

These are equivalent to `optional(string)`, `optional(number)`, and
`optional(boolean)`.

---

## Behaviour at runtime

When the graph traversal engine encounters an optional property whose value is
`undefined`, it skips that property and does not descend into it. When the
value is present, the traversal continues as if the property had its base type
directly — the `OptionalType` wrapper is transparent to the traversal.

This means validators on the base type only run when a value is present. No
validator runs for an absent optional property.

---

## Nested optional types

`optional` can wrap any type descriptor, including object types, arrays, and
links:

```ts
import { optional, arrayOf, link, schema } from '@aelastics/types'

const mySchema = schema('mySchema')

const Team = object(
  {
    name:    string,
    manager: optional(link(mySchema, 'Person')),
    members: optional(arrayOf(link(mySchema, 'Person'), 'PersonArray', mySchema)),
  },
  'Team',
  mySchema
)
```
