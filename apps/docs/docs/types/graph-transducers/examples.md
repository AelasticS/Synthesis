---
sidebar_position: 5
title: Examples
---

# Examples

End-to-end examples showing common pipeline patterns.

---

## Validate and convert to graph DTO in one pass

Validate a `Person` instance and convert it to a graph DTO in a single traversal.
Validation errors and the conversion both happen as each node is finalized.

```ts
import { transducer, identityReducer } from '@aelastics/types'

const tr = transducer()
  .dftMap()
  .validate()
  .toDtoGraph()
  .doFinally(identityReducer())

const dto = PersonType.transduce(tr, person)
```

No second traversal is needed. All steps run in a single depth-first pass.

---

## Collect all scalar values from an object graph

Use `ProcessorBuilder` with `StepBuilder` to gather every scalar property value
into a flat array.

```ts
import {
  ProcessorBuilder,
  StepBuilder,
  transducer,
  naturalReducer
} from '@aelastics/types'

const stepHandlers = new StepBuilder()
  .onTypeCategory('Simple', (result, node, item) => {
    result.push(item)
    return [result, 'continue']
  })
  .build()

const Collector = new ProcessorBuilder()
  .onStep(stepHandlers)
  .build()

const tr = transducer()
  .dftReduce()
  .do(Collector)
  .doFinally(naturalReducer())

const values = PersonType.transduce(tr, person, [])
```

The empty array `[]` is the initial accumulator. Each simple-typed node appends
its value to it during the traversal.

---

## Count nodes in a graph

```ts
import { transducer } from '@aelastics/types'

const tr = transducer().dftReduce().count()
const total = PersonType.transduce(tr, person, 0)
```

---

## Create a new instance from a template

```ts
import { transducer, naturalReducer } from '@aelastics/types'

const tr = transducer()
  .dftMap()
  .newInstance({ name: 'unnamed', active: false })
  .doFinally(naturalReducer())

const instance = PersonType.transduce(tr, undefined)
```

Passing `undefined` as the second argument traverses the type graph rather than an
instance graph. The `newInstance` step uses the template to seed default values.
