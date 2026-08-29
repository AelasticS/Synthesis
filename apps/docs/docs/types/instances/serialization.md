---
sidebar_position: 3
title: Serialization and Deserialization
---

A natural value is the object you work with in code: nested, possibly
cyclic, held together by JavaScript references. A **graph DTO** is the same
information in a form that survives `JSON.stringify`, where every object
carries an identity and repeated objects are written once and referenced
afterwards. Two methods convert between them.

| Method | Direction |
|---|---|
| `toDtoGraph(value)` | natural value to graph DTO |
| `fromDtoGraph(dto)` | graph DTO back to natural value |

## A round trip

```ts
import * as t from '@aelastics/types'

const Address = t.object({ city: t.string, zip: t.string }, 'Address')
const Person = t.entity(
  { id: t.number, name: t.string, address: Address },
  ['id'],
  'Person'
)

const ada = { id: 1, name: 'Ada', address: { city: 'London', zip: 'NW1' } }

const dto = Person.toDtoGraph(ada)
const back = Person.fromDtoGraph(dto)
// back is { id: 1, name: 'Ada', address: { city: 'London', zip: 'NW1' } }
```

The DTO wraps every complex value in a `ref` and an `object`:

```json
{
  "ref": { "typeName": "/DefaultSchema/Person", "category": "Object", "id": 1 },
  "object": {
    "id": 1,
    "name": "Ada",
    "address": {
      "ref": { "typeName": "/DefaultSchema/Address", "category": "Object", "id": 2 },
      "object": { "city": "London", "zip": "NW1" }
    }
  }
}
```

Simple values (`id`, `name`, `city`) are written as they are. Every complex
value gets its own envelope.

## The `ref` envelope

`ref` is an `InstanceReference`, the identity card of one value inside the
graph:

| Field | Meaning |
|---|---|
| `id` | A number unique within this graph. It is assigned during conversion and is not part of your data. |
| `typeName` | The fully qualified name of the type, including its schema path, for example `/DefaultSchema/Person`. |
| `category` | The kind of value: `Object`, `Array`, and so on. |

`typeName` is what makes the DTO self-describing: when a property is declared
as a supertype and holds a subtype instance, the DTO records the concrete
type, so `fromDtoGraph` rebuilds the value as that subtype rather than the
declared one.

Arrays use the same envelope with `array` in place of `object`:

```json
"tags": {
  "ref": { "typeName": "/DefaultSchema/ArrayOf_string", "category": "Array", "id": 3 },
  "array": ["x"]
}
```

## Cycles

A cycle is where the graph format earns its name. The first time a value is
reached it is written in full. Any later encounter is written as a **`ref`
without an `object`**, pointing at the id already emitted.

Take two people who reference each other:

```ts
const ada: any = { id: 1, name: 'Ada', tags: [] }
const bob: any = { id: 2, name: 'Bob', friend: ada, tags: [] }
ada.friend = bob

const dto = PersonC.toDtoGraph(ada)
```

Ada is emitted with id 1, Bob in full inside her `friend` property with id 2,
and Bob's own `friend` back to Ada collapses to a bare reference:

```json
"friend": {
  "ref": { "typeName": "/DefaultSchema/PersonC", "category": "Object", "id": 1 }
}
```

Converting back restores real JavaScript identity, not a copy:

```ts
const back: any = PersonC.fromDtoGraph(dto)
back.friend.friend === back   // true
```

This is why `JSON.stringify` cannot replace `toDtoGraph`: it throws on
circular structures, and it has no way to record that two positions in a tree
are the same object.

## Static types for DTOs

`DtoGraphTypeOf<T>` gives the compile-time type of the graph DTO, the
counterpart of `TypeOf<T>` for natural values:

```ts
type IPerson = t.TypeOf<typeof Person>
type IPersonDto = t.DtoGraphTypeOf<typeof Person>
```

`DtoTreeTypeOf<T>` describes the tree-shaped variant, which omits the
reference envelopes and therefore cannot represent sharing or cycles. Both
are covered in [Type Inference](./type-inference.md).

## When to use which form

Use the graph DTO whenever the data leaves the process: writing to disk,
sending over a network, or storing in a document database, especially when
the data is a real graph rather than a tree. Keep working with natural values
inside your program, where JavaScript references are the more convenient
representation.
