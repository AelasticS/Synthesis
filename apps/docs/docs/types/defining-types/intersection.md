---
sidebar_position: 5
title: Intersection Types
---

An intersection type combines multiple object types into one. A value of an
intersection type must satisfy every member type simultaneously. Properties from
all members are merged into a single flat object.

---

## `intersectionOf()`: factory

```ts
intersectionOf(elements, name?, schema?)
```

- `elements`: an array of `ObjectType` instances
- All elements must be object types. Passing a non-object type throws at
  definition time.

```ts
import { object, intersectionOf, string, number, boolean } from '@aelastics/types'

const Named = object(
  { name: string },
  'Named'
)

const Aged = object(
  { age: number },
  'Aged'
)

const Employed = object(
  { department: string, isManager: boolean },
  'Employed'
)

const Employee = intersectionOf(
  [Named, Aged, Employed],
  'Employee'
)
```

---

## TypeScript inference

The TypeScript type of an intersection value is the intersection of all member
value types:

```ts
import { TypeOf } from '@aelastics/types'

type IEmployee = TypeOf<typeof Employee>
// { name: string } & { age: number } & { department: string; isManager: boolean }
// which is equivalent to:
// { name: string; age: number; department: string; isManager: boolean }
```

---

## How merging works at runtime

When the traversal engine processes an intersection value, it visits the value
once per member type. Each member type sees the full merged object and processes
the properties it declares. When building an output (for example, during
`createInstance` or `toDtoGraph`), each member's result is merged into the
parent object using `Object.assign`.

Property names must not conflict between member types. If two member types
declare a property with the same name, the later member's value overwrites the
earlier one during merging.
