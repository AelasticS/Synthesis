---
sidebar_position: 8
title: Specifying Constraints
---

Every type in `@aelastics/types` can carry validators: predicates that a value
must satisfy to be considered valid. Validators are checked by `type.validate()`,
`type.validateAndReport()`, and the `validate()` step in a transducer pipeline.

---

## Why you cannot add constraints to system types

The pre-defined instances (`string`, `number`, `boolean`, etc.) are system
types. They are shared globally and sealed. Calling `addValidator` on them
throws:

```
OperationNotAllowed: Type 'number' is a system type.
New constraints are not allowed! Define a derived type instead.
```

The solution is to derive a new type first.

---

## `derive()`: create a constrained variant

```ts
type.derive(name?, schema?)
```

Returns a new type of the same class that inherits the base type's validators.
You can then add further validators to the derived type.

```ts
import { string, number } from '@aelastics/types'

const Age = number.derive('Age')
const EmployeeName = string.derive('EmployeeName')
```

The built-in simple type classes (`NumberType`, `StringType`) expose shorthand
constraint methods that call `addValidator` internally and return `this` for
chaining. You can chain them directly on the `derive()` call:

```ts
const PositiveAge = number.derive('PositiveAge').positive.integer.lessThan(150)

const Specialization = string
  .derive('Specialization')
  .oneOf(['Surgeon', 'Cardiologist', 'Internist'])
```

---

## `addValidator()`: add a custom constraint

```ts
type.addValidator({ predicate, message })
```

Adds a validator to any non-system type. A validator is an object with two
fields:

- `predicate: (value: V) => boolean`: returns `true` when the value is valid
- `message: (value: V, label?: string) => string`: returns the error message
  when the predicate returns `false`

`addValidator` returns `this`, so multiple calls can be chained.

```ts
import { object, arrayOf, string, number, boolean } from '@aelastics/types'

const ChildArray = arrayOf(
  object({ name: string, age: number }, 'Child'),
  'ChildArray'
)

ChildArray.addValidator({
  predicate: (value) => value.length >= 3,
  message:   (v, label) => `${label}: must have at least 3 children`,
})

const Person = object(
  { name: string, age: number, male: boolean, children: ChildArray },
  'Person'
)

Person.addValidator({
  predicate: (value) => value.male ? value.children.length > 0 : true,
  message:   () => 'a male person must have at least one child recorded',
})
```

---

## Validator inheritance through `derive()`

When a type is derived, it inherits all validators from the base type. The
traversal engine checks both levels:

```ts
const Base = number.derive('Base').positive        // must be > 0
const Derived = Base.derive('Derived').lessThan(100) // must also be < 100
```

A value validated against `Derived` is checked against both `positive` and
`lessThan(100)`. All errors are collected and returned together.

---

## Running validation

```ts
const [isValid, errorObject] = Person.validateAndReport(value)

// or as a ServiceResult:
const result = Person.validate(value)
```

`validateAndReport` returns a tuple `[boolean, ErrorObject]`. `validate` returns
a `ServiceResult<boolean>` from `@aelastics/result`.

Validation traverses the full object graph, so validators on nested types
(arrays, child objects, etc.) all run in a single call.
