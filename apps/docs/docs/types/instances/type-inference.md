---
sidebar_position: 1
title: Type Inference
---

## Type definitions are runtime data

A type definition in `@aelastics/types` is an ordinary JavaScript object. When
you write:

```ts
import { object, string, number } from '@aelastics/types'

const Person = object(
  { name: string, age: number },
  'Person'
)
```

`Person` is an instance of `ObjectType` — a class with methods like `validate`,
`toDtoGraph`, and `createInstance`. It exists at runtime. You can pass it
around, store it in a variable, put it in a map, and inspect it.

This is different from TypeScript interfaces or type aliases, which only exist
during compilation and are erased before the program runs.

---

## `TypeOf` — bridging data to types

Because `Person` is a runtime value, TypeScript can infer its full static type.
The `ObjectType` class carries phantom type parameters that encode the shape of
the values it represents. `TypeOf<T>` reads that shape out of the descriptor
and turns it into a usable TypeScript type:

```ts
import { TypeOf } from '@aelastics/types'

type IPerson = TypeOf<typeof Person>
// { name: string; age: number }
```

This is a TypeScript compile-time operation. `TypeOf<T>` is defined as
`T['_V']` — it accesses the phantom `_V` type slot on the descriptor class.
The TypeScript compiler resolves it at compile time using its normal type
inference, with no runtime cost.

The practical effect is that you define the shape once (as a type descriptor),
and the TypeScript compiler derives the corresponding interface automatically.
You do not write a separate `interface` or `type` alias by hand.

---

## What this enables

Because the static type follows directly from the runtime definition, the two
always stay in sync. You cannot accidentally have an interface that describes
different properties than what the type descriptor validates.

This makes several things work well:

**Typed variables and parameters**

```ts
function greet(p: IPerson) {
  console.log(`Hello, ${p.name}`)
}

const p: IPerson = { name: 'Alice', age: 30 }
```

**IDE autocompletion**

When you declare a variable as `IPerson`, the IDE offers completions for `name`
and `age`. If you add a new property to the `object(...)` call, the type
updates automatically and the IDE reflects it.

**Type-safe validation results**

```ts
const [ok, err] = Person.validateAndReport(value)
// value is IPerson — TypeScript knows its shape
```

**Class implementations**

If you model domain logic as a class, `TypeOf` gives you the interface to
implement:

```ts
class PersonRecord implements IPerson {
  constructor(
    public name: string,
    public age:  number
  ) {}
}
```

---

## `DtoGraphTypeOf` and `DtoTreeTypeOf`

The descriptor also encodes the shape of the two DTO representations used during
serialization.

```ts
import { DtoGraphTypeOf, DtoTreeTypeOf } from '@aelastics/types'

type PersonGraph = DtoGraphTypeOf<typeof Person>
type PersonTree  = DtoTreeTypeOf<typeof Person>
```

`DtoGraphTypeOf<T>` is the type of the value produced by `toDtoGraph`. For
object types it wraps properties in an `{ ref, object }` envelope that carries
identity information for handling shared references. `DtoTreeTypeOf<T>` is the
simpler tree form where each value is embedded inline.

These types are most useful when writing functions that accept or return DTO
payloads and you want the compiler to verify the shape.
