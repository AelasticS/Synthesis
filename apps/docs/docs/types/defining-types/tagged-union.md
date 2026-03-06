---
sidebar_position: 4
title: Tagged Union
---

A tagged union is a type that can hold a value of exactly one of several object
types, where a single string property on the value identifies which type it
currently holds. This is also known as a discriminated union.

---

## `taggedUnion()` — factory

```ts
taggedUnion(elements, discriminator, name?, schema?)
```

- `elements` — a record of object types keyed by their discriminator value
- `discriminator` — the name of the property on each member type that holds
  the identifying string

Each member type must be an `ObjectType` that already has a property matching
the `discriminator` name. The factory validates this at definition time and
throws if any member type does not have the discriminator property.

```ts
import { object, taggedUnion, string, boolean, literal } from '@aelastics/types'

const DoctorType = object(
  {
    profession:     literal('Doctor'),
    specialization: string,
  },
  'DoctorType'
)

const LawyerType = object(
  {
    profession:   literal('Lawyer'),
    masterDegree: boolean,
    worksAt:      string,
  },
  'LawyerType'
)

const EmployeeType = taggedUnion(
  {
    Doctor: DoctorType,
    Lawyer: LawyerType,
  },
  'profession',
  'EmployeeType'
)
```

---

## TypeScript inference

The TypeScript type of a tagged union value is the union of all member value
types:

```ts
import { TypeOf } from '@aelastics/types'

type IEmployee = TypeOf<typeof EmployeeType>
// { profession: 'Doctor'; specialization: string }
// | { profession: 'Lawyer'; masterDegree: boolean; worksAt: string }
```

TypeScript narrows the type automatically when you check the discriminator
property:

```ts
declare const e: IEmployee

if (e.profession === 'Doctor') {
  console.log(e.specialization)  // OK — TypeScript knows this is DoctorType
}
```

---

## How dispatch works at runtime

When the graph traversal engine visits a tagged union value, it reads the
discriminator property from the value, looks up the matching key in `elements`,
and continues traversal with that specific member type. If the discriminator
value is absent or does not match any key, an error is thrown.

This means the discriminator property must be present on every actual value
passed to `validate`, `toDtoGraph`, or any other type operation.

---

## Using `literal` for the discriminator

The cleanest pattern is to type the discriminator property as a `literal` on
each member type. This gives TypeScript precise string literal inference and
makes the value self-describing:

```ts
const DoctorType = object(
  { profession: literal('Doctor'), specialization: string },
  'DoctorType'
)
```

The string `'Doctor'` passed to `literal` must match the key name used in the
`elements` record passed to `taggedUnion`.
