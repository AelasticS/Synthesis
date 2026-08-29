---
sidebar_position: 4
title: Creating Instances
---

`createInstance()` builds a value that conforms to a type, filling in every
property the type declares. Call it with nothing to get a fully defaulted
value, or with a partial object to supply the parts you know.

## Defaults for a whole structure

```ts
import * as t from '@aelastics/types'

const Address = t.object({ city: t.string, zip: t.string }, 'Address')
const Person = t.entity(
  { id: t.number, name: t.string, address: Address },
  ['id'],
  'Person'
)

const blank = Person.createInstance()
```

```json
{
  "id": 0,
  "name": "",
  "address": { "city": "", "zip": "" }
}
```

Nested object properties are created recursively, so `address` is a real
object with its own defaults rather than `undefined`. The defaults follow the
property types:

| Property type | Default |
|---|---|
| `t.number` | `0` |
| `t.string` | `""` |
| `t.boolean` | `true` |
| `t.date` | the current date and time |
| object or entity | a recursively created instance |
| `t.arrayOf(...)` | `[]` |
| `t.optional(...)` | the key exists, with no value assigned |

:::note
Booleans default to `true`, not `false`. If a flag should start out off, pass
it explicitly rather than relying on the default.
:::

## Supplying part of the value

Pass what you have, and the rest is defaulted:

```ts
const grace = Person.createInstance({ name: 'Grace' })
```

```json
{
  "id": 0,
  "name": "Grace",
  "address": { "city": "", "zip": "" }
}
```

This is the useful shape for form state, fixtures, and test data: state the
one or two fields the case is about and let the type supply a complete,
conforming value around them.

## Typing the result

`createInstance` is not generic over its return, so annotate the variable
with [`TypeOf`](./type-inference.md) to work with a typed value:

```ts
type IPerson = t.TypeOf<typeof Person>

const person: IPerson = Person.createInstance({ name: 'Grace' }) as IPerson
```

## The type tag

Created instances carry their concrete type at the `@@aelastics/type`
property:

```ts
;(grace as any)['@@aelastics/type']   // '/DefaultSchema/Person'
```

The tag is not enumerable, so it does not appear in `JSON.stringify` output
or in `Object.keys`. It is what lets subtype-aware code recognize the value
later: `@aelastics/store` uses exactly this tag to check that a value
assigned to an entity-typed property conforms to the declared type, which is
described in
[Runtime type conformance](../../store/intro.md#runtime-type-conformance).

Creating an instance from a supertype while passing values belonging to a
subtype produces an instance tagged with the **subtype**, so the concrete
type is preserved rather than widened.

## Creation is not validation

`createInstance` produces a structurally complete value; it does not run the
type's validators. A default of `0` for a number constrained to be positive
is structurally fine and semantically wrong, and nothing complains until the
value is checked. Run [`validate`](./validation.md) when the value is
finished, before acting on it.
