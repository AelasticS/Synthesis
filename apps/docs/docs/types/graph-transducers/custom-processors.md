---
sidebar_position: 4
title: Custom Processors
---

# Custom Processors

The fluent `Transducer` API covers most use cases. When you need fine-grained
control — conditional dispatch based on type or type category, multiple independent
handlers per phase, or reusable processor classes — use `ProcessorBuilder` instead.

---

## When to use each approach

| Use the fluent `Transducer` API when... | Use `ProcessorBuilder` when... |
|---|---|
| You need a quick pipeline for a single operation | You need different logic for different node types |
| Built-in steps (`map`, `filter`, `validate`, etc.) are sufficient | You want to register multiple independent handlers per phase |
| You are composing existing processors | You are building a reusable processor class for `.do()` |

---

## `ProcessorBuilder`

`ProcessorBuilder` constructs an `IProcessorConstructor` by registering handler
functions for each of the three phases: `init`, `step`, and `result`.

```ts
import { ProcessorBuilder } from '@aelastics/types'

const MyProcessor = new ProcessorBuilder()
  .onInit(initHandler)
  .onStep(stepHandler)
  .onResult(resultHandler)
  .build()
```

The result is an `IProcessorConstructor` that can be passed directly to
`transducer().do()`.

### `.onInit(f | f[])`

Registers one or more `init` phase handlers. Handlers run in registration order.
If any handler returns a directive other than `'continue'`, subsequent handlers
in the same phase are skipped and the value is returned immediately.

```ts
builder.onInit((value, node) => {
  const prepared = prepareForNode(value, node)
  return [prepared, 'continue']
})
```

### `.onStep(f | f[])`

Registers one or more `step` phase handlers, called after each child is processed.

```ts
builder.onStep((result, node, childResult) => {
  result.total += childResult.value
  return [result, 'continue']
})
```

### `.onResult(f | f[])`

Registers one or more `result` phase handlers, called after all children of a
node have been processed.

```ts
builder.onResult((result, node) => {
  return [finalize(result, node), 'continue']
})
```

### `.build()`

Composes all registered handlers and returns an `IProcessorConstructor`.

```ts
const MyProcessor = builder.build()

const tr = transducer()
  .dftMap()
  .do(MyProcessor)
  .doFinally(naturalReducer())
```

---

## Conditional handler builders

`InitBuilder`, `StepBuilder`, and `ResultBuilder` let you build arrays of
conditional handlers that dispatch based on the current node's type or category.
Pass the resulting array to the corresponding `onInit` / `onStep` / `onResult`
call on `ProcessorBuilder`.

```ts
import { InitBuilder, StepBuilder, ResultBuilder } from '@aelastics/types'
```

All three classes expose the same three methods:

### `.onPredicate(predicate, handler)`

Runs `handler` only when `predicate` returns `true`. When the predicate is `false`,
the value passes through unchanged with `'continue'`.

```ts
const steps = new StepBuilder()
  .onPredicate(
    (result, node, item) => item > 0,
    (result, node, item) => [result + item, 'continue']
  )
  .build()
```

### `.onType(type, handler)`

Runs `handler` only when the current node's type is exactly the given type.

```ts
const steps = new StepBuilder()
  .onType(AddressType, (result, node, item) => {
    result.addresses.push(item)
    return [result, 'continue']
  })
  .build()
```

### `.onTypeCategory(category, handler)`

Runs `handler` when the current node's type category matches. Supported categories:
`'Object'`, `'Array'`, `'Map'`, `'Graph'`, `'Intersection'`, `'Union'`, `'Tagged'`,
`'Simple'` (a convenience alias that matches all simple/scalar types).

```ts
const steps = new StepBuilder()
  .onTypeCategory('Simple', (result, node, item) => {
    result.push(item)
    return [result, 'continue']
  })
  .build()
```

### `.build()`

Returns the array of conditional handlers. Pass this array to `ProcessorBuilder`.

---

## Full example: collect all string values from an object graph

```ts
import {
  ProcessorBuilder,
  StepBuilder,
  transducer,
  naturalReducer
} from '@aelastics/types'

// Build step handlers that collect values only from simple (scalar) nodes
const stepHandlers = new StepBuilder()
  .onTypeCategory('Simple', (result, node, item) => {
    result.push(item)
    return [result, 'continue']
  })
  .build()

// Build the processor constructor
const Collector = new ProcessorBuilder()
  .onStep(stepHandlers)
  .build()

// Assemble and run the pipeline
const tr = transducer()
  .dftReduce()
  .do(Collector)
  .doFinally(naturalReducer())

const values = PersonType.transduce(tr, person, [])
// values is a flat array of all scalar property values in the person graph
```

The empty array `[]` passed as `initObj` is the accumulator that each `step` handler
appends to. The `dftReduce` mode passes this object through the traversal rather
than building a new output bottom-up.
