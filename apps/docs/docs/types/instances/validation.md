---
sidebar_position: 2
title: Validation
---

Every type carries its constraints with it. Validating a value means walking
the value against its type definition, running each type's validators along
the way, and collecting whatever failed. There are two entry points: one
that answers "is this valid" and one that answers "what exactly is wrong,
and where".

## The two entry points

| Method | Returns | Use it when |
|---|---|---|
| `validate(value)` | `ServiceResult<boolean>` from `@aelastics/result` | You need a pass/fail answer that composes with other result-returning code. |
| `validateAndReport(value)` | `[boolean, ErrorObject]` | You need the individual failures and the property each one belongs to. |

## `validate`: pass or fail

```ts
import * as t from '@aelastics/types'
import { isSuccess, isFailure } from '@aelastics/result'

const PositiveAge = t.number.derive('PositiveAge').positive
const Employee = t.object({ name: t.string, age: PositiveAge }, 'Employee')

const ok = Employee.validate({ name: 'Ada', age: 36 })
isSuccess(ok)   // true, ok.value is true

const bad = Employee.validate({ name: 'Ada', age: -1 })
isFailure(bad)  // true
```

The result is a `ServiceResult`, so it narrows and composes exactly like any
other result in the codebase. See
[@aelastics/result](../../result/intro.md) for the guards and helpers.

:::caution `validate` reports only top-level errors
A `Failure` returned by `validate` carries the errors recorded at the **root**
of the value. When the only problems are inside properties, as in the
`age: -1` example above, `bad.errors` is an empty array: the failure is
signalled, but the detail lives one level down. Whenever you need to know
which property failed, use `validateAndReport`.
:::

## `validateAndReport`: what failed, and where

```ts
const [valid, report] = Employee.validateAndReport({ name: 'Ada', age: -1 })
```

`valid` is `false`, and `report` mirrors the shape of the value that was
checked:

```json
{
  "@hasErrors": true,
  "@errors": [],
  "age": {
    "@hasErrors": true,
    "@errors": [
      {
        "name": "PositiveAge",
        "message": "Expected PositiveAge to be positive, got -1",
        "code": "ValidationError"
      }
    ]
  }
}
```

For a value that passes, the report is an empty object and `valid` is `true`.

## Reading the error object

The report is a tree with the same shape as the data. Two reserved keys
appear at every level that took part in validation, and every other key is a
property name leading further down.

| Key | Meaning |
|---|---|
| `@hasErrors` | `true` when this node or anything beneath it failed. |
| `@errors` | The failures recorded at this exact node, as `ServiceError` values with `name`, `message`, and `code`. |
| any other key | A property of the value, holding its own error node. |

Because `@hasErrors` propagates upward while `@errors` stays where the failure
happened, you can test the root for "did anything fail at all" and then walk
down to find each cause. Nested objects, array elements, and properties of
subtypes all appear at their natural position in this tree, so the path
through the report is the path through the data.

## Where the messages come from

A validator is a predicate plus a message function attached to a type, so the
wording is defined next to the constraint rather than at the call site:

```ts
const ChildArray = t.arrayOf(Child)

ChildArray.addValidator({
  predicate: (value) => value.length > 2,
  message: () => 'a family needs more than two children',
})
```

Built-in constraints on derived simple types (`positive`, `maxLength`, and
the rest) come with their own messages, which is where
`Expected PositiveAge to be positive, got -1` above was produced. Defining
constraints is covered in
[Specifying Constraints](../defining-types/constraints.md).

## Validating a whole schema

`TypeSchema` also has a `validate()` method, but it answers a different
question. It checks the schema's own integrity rather than a data value:
every [`link()`](../defining-types/recursive-types.md) in the schema is
resolved, and any link whose target type does not exist is reported. Run it
after defining a schema with forward or recursive references, and see
[Type Schemas](../defining-types/schemas.md).
