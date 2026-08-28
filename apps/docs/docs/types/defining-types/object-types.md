---
sidebar_position: 2
title: Objects, Entities and Subtyping
---

Objects are the primary composite type. An object type is defined by a set of
named properties, each of which is another type descriptor. Object types support
identity (entity), inheritance (subtype), and bidirectional relationships
(inverse properties).

---

## `object()`: plain object type

```ts
object(props, name?, schema?)
```

Creates an object type with no identifier. Values of this type are plain
TypeScript objects.

```ts
import { object, string, number, boolean } from '@aelastics/types'

const Address = object(
  {
    street: string,
    city:   string,
    zip:    string,
  },
  'Address'
)
```

Use `TypeOf` to get the TypeScript type:

```ts
import { TypeOf } from '@aelastics/types'

type IAddress = TypeOf<typeof Address>
// { street: string; city: string; zip: string }
```

---

## `entity()`: object with an identifier

```ts
entity(props, keys, name?, schema?)
```

An entity is an object type with one or more identifier properties. The second
argument is an array of property names that together form the identity key.
Identity is used during DTO serialization to identify repeated references to
the same object in the graph.

```ts
import { entity, string, number } from '@aelastics/types'

const Department = entity(
  { name: string },
  ['name'],
  'Department'
)

const Employee = entity(
  {
    employeeNumber: number,
    name:           string,
    department:     Department,
  },
  ['employeeNumber'],
  'Employee'
)
```

An entity type exposes `.identifier` (the array of key property names) and
`.isEntity` (always `true`). Internally, `EntityType` is a type alias for
`ObjectType`; both factories produce the same class.

---

## `subtype()`: inheritance

```ts
subtype(superType, extraProps, name?, schema?)
```

Creates a new object type that inherits all properties of `superType` and adds
`extraProps` on top. The identifier is inherited from the super type.

```ts
import { entity, subtype, string, number, boolean } from '@aelastics/types'

const Person = entity(
  { name: string, age: number },
  ['name'],
  'Person'
)

const Employee = subtype(
  Person,
  { department: string, isManager: boolean },
  'Employee'
)
// Employee has: name, age, department, isManager
// identifier: ['name']
```

`subtype.allProperties` returns all properties from the full hierarchy.
Adding a property name that already exists in the super type replaces the
inherited version.

---

## `findTypeCategory()`: resolve a property's underlying category

```ts
findTypeCategory(type: Any): TypeCategory | undefined
```

Follows `LinkType` and `OptionalType` wrappers to reach the underlying type
and return its `TypeCategory` string. This is useful when processing object
properties generically to determine whether a property holds an object, an
array, a simple value, etc.

```ts
import { findTypeCategory, optional } from '@aelastics/types'

findTypeCategory(Employee.interfaceDecl.name)       // 'String'
findTypeCategory(optional(Department))               // 'Object'
```

---

## `inverseProps()`: declare a bidirectional relationship

```ts
inverseProps(firstType, firstProp, secondType, secondProp)
```

Registers a bidirectional relationship between two object types. Both
`firstType[firstProp]` and `secondType[secondProp]` must already exist as
properties, and each must reference the other type (directly, through
`optional`, through an array, or through a `link`).

```ts
import { entity, link, inverseProps, string, schema } from '@aelastics/types'

const mySchema = schema('mySchema')

const Department = entity(
  {
    name:      string,
    employees: link(mySchema, 'Employee'),
  },
  ['name'],
  'Department',
  mySchema
)

const Employee = entity(
  {
    name:       string,
    department: link(mySchema, 'Department'),
  },
  ['name'],
  'Employee',
  mySchema
)

inverseProps(Department, 'employees', Employee, 'department')
```

`inverseProps` validates the relationship at definition time and throws if the
properties do not reference the correct counterpart types. The inverse
metadata is stored on the type and is used by the graph traversal engine.
