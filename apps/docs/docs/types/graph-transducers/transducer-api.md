---
sidebar_position: 2
title: Transducer API
---

# Transducer API

The `Transducer` class is a fluent builder that assembles processor chains without
requiring you to implement `IProcessor` directly. Most data processing tasks can be
expressed entirely through this API.

---

## Creating a transducer

```ts
import { transducer } from '@aelastics/types'

const tr = transducer()
```

`transducer()` returns a new `Transducer` builder. You chain pipeline steps onto it,
then call a terminator to get the final `IProcessor`.

---

## Pipeline steps

Each method below returns `this`, so you can chain them freely. Steps run in the order
they are added. The `recurse()` step drives depth-first traversal and must appear in
the chain for any operation that needs to visit child nodes.

### `recurse(mode)`

Drives depth-first graph traversal.

```ts
transducer().recurse('makeItem')
transducer().recurse('accumulate')
```

| Mode | Behaviour |
|---|---|
| `'makeItem'` | Builds the output bottom-up. Each node's result is derived from its children's results. Use this for conversions and transformations. |
| `'accumulate'` | Accumulates into an existing structure passed as `initObj`. Use this for collecting values (counts, lists, sums). |

### `map(f)`

Transforms the value at each node.

```ts
transducer()
  .recurse('makeItem')
  .map((item, node) => ({ ...item, label: node.propName }))
```

`f` receives the current node value and the `Node` context object.

### `filter(f)`

Skips nodes where `f` returns `false`. The node is excluded from the output.

```ts
transducer()
  .recurse('makeItem')
  .filter((item, node) => item !== null)
```

### `validate()`

Attaches validation errors to each node. The output mirrors the input structure with
`@hasErrors` and `@errors` fields added where validation fails.

```ts
transducer().recurse('makeItem').validate()
```

### `newInstance(initValues?, generateID?)`

Creates a new typed instance, optionally seeded with `initValues` as a template.
Pass a `generateID` function to control how identifiers are assigned.

```ts
transducer().recurse('makeItem').newInstance({ name: 'default' })
```

### `toDtoGraph()`

Converts a typed instance to the graph DTO format — a flat, reference-based
representation suitable for serialization or transport.

```ts
transducer().recurse('makeItem').toDtoGraph()
```

### `fromDtoGraph()`

Converts a graph DTO back into a typed instance.

```ts
transducer().recurse('makeItem').fromDtoGraph()
```

### `processAnnotations(annot)`

Applies an annotation during traversal. The annotation is invoked at each node
that carries the relevant annotation metadata.

```ts
transducer().recurse('makeItem').processAnnotations(myAnnotation)
```

### `do(Ctor, ...args)`

Attaches any custom `IProcessor` constructor to the chain.

```ts
transducer().recurse('makeItem').do(MyProcessor, extraArg)
```

`Ctor` must have signature `new (xfNext: IProcessor, ...args: any[]): IProcessor`.
See [Custom Processors](./custom-processors.md) for how to build one.

### `doIf(condition, Ctor, ...args)`

Conditionally attaches a processor. If `condition` is `false`, the step is skipped
entirely and the chain continues unchanged.

```ts
transducer()
  .recurse('makeItem')
  .doIf(process.env.NODE_ENV !== 'production', DebugLogger)
```

---

## Terminators

A terminator ends the pipeline and returns an `IProcessor` ready to pass to
`type.transduce()`. Call exactly one terminator per pipeline.

### `doFinally(processor)`

Composes all pipeline steps and attaches `processor` as the terminal reducer.
This is the most common terminator.

```ts
const tr = transducer()
  .recurse('makeItem')
  .validate()
  .doFinally(naturalReducer())
```

### `reduce(stepFn, initValue)`

Builds a custom terminal reducer from a plain step function.

```ts
const tr = transducer()
  .recurse('accumulate')
  .reduce((acc, node, item) => acc + item.value, 0)
```

### `count()`

Returns a processor that counts the number of nodes visited.

```ts
const tr = transducer().recurse('accumulate').count()
```

### `sum()`

Returns a processor that sums numeric node values.

```ts
const tr = transducer().recurse('accumulate').sum()
```

---

## Built-in reducers

These are passed as arguments to `doFinally()`.

| Reducer | Behaviour |
|---|---|
| `naturalReducer()` | Builds an output that mirrors the input structure. Use for transformations where the shape is preserved. |
| `identityReducer()` | Returns the last processed value as-is. Use when the final processor already produces the complete result (e.g. `toDtoGraph`). |
| `stepperReducer()` | Accumulates results into a flat list. Use for collection-style operations. |

```ts
import { naturalReducer, identityReducer, stepperReducer } from '@aelastics/types'
```

---

## Running the pipeline

```ts
type.transduce(processor, input, initObj?)
```

| Parameter | Description |
|---|---|
| `processor` | The `IProcessor` returned by a terminator. |
| `input` | The value to traverse. Pass `undefined` to traverse the type graph instead of an instance. |
| `initObj` | Optional initial accumulator, used in `'accumulate'` mode. |

---

For end-to-end usage examples see [Examples](./examples.md).
