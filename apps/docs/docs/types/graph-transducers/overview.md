---
sidebar_position: 1
title: The Traversal Protocol - From Reduce to Graph Traversal
sidebar_label: The Traversal Protocol
---

This page builds the concept of graph transducers from first principles. If you
already know functional transducers (composable reducers for arrays), you will see
exactly how the idea extends to trees and graphs. If you do not, the five steps
below start from `reduce` and arrive at the full protocol without assuming prior
knowledge.

---

## Step 1. The foundation: `reduce`

Every developer who has used JavaScript arrays knows `map` and `filter`. What is
less obvious is that both are special cases of `reduce`. A reducer is a function
with this signature:

```ts
type Reducer<Acc, Val> = (accumulator: Acc, value: Val) => Acc
```

It takes an accumulated result and the next value, and returns a new accumulated
result. Array methods like `map` and `filter` can be expressed entirely in terms
of it:

```ts
// map via reduce
const doubled = [1, 2, 3].reduce<number[]>(
  (acc, val) => [...acc, val * 2],
  []
)
// [2, 4, 6]

// filter via reduce
const evens = [1, 2, 3, 4].reduce<number[]>(
  (acc, val) => (val % 2 === 0 ? [...acc, val] : acc),
  []
)
// [2, 4]
```

`reduce` is the primitive. Everything else is a pattern built on top of it.

---

## Step 2. Functional transducers: decouple transformation from collection

Chaining `.filter().map()` creates an intermediate array between the two operations
and makes two passes over the data. For large datasets or streaming sources this is
wasteful.

A **transducer** solves this by turning a transformation into a function that
operates on a reducer rather than on a collection directly:

```ts
// A transducer is a function from reducer to reducer
type Transducer<Acc, In, Out> =
  (nextReducer: Reducer<Acc, Out>) => Reducer<Acc, In>

// map as a transducer
const mapDouble: Transducer<number[], number, number> =
  (next) => (acc, val) => next(acc, val * 2)

// filter as a transducer
const filterEven: Transducer<number[], number, number> =
  (next) => (acc, val) => val % 2 === 0 ? next(acc, val) : acc

// terminal reducer: just appends to the array
const append: Reducer<number[], number> =
  (acc, val) => [...acc, val]

// compose by nesting: mapDouble wraps filterEven wraps append
const pipeline = mapDouble(filterEven(append))

// single pass, no intermediate arrays
const result = [1, 2, 3, 4, 5].reduce(pipeline, [])
// [4, 8]
```

The key property: `mapDouble` and `filterEven` know nothing about arrays. The
same pipeline works on any source that can call a reducer — a stream, a generator,
an event emitter. The transformation logic is separated from the collection type.

Processors compose by nesting. Each transducer wraps the next one, delegates to
it when it is done with its own work, and the outermost one is called first.

---

## Step 3. The limitation of linear transducers

A reducer has a single `step` function: `(acc, value) => acc`. This works for
flat sequences where each element is independent of the others.

It does not work for **trees or graphs**. Consider summing the values of a tree:
you cannot compute the sum for a parent node until all its children have been
summed. A single step function has no way to express "wait for all children,
then combine their results."

Three separate operations are needed:

- **Before children**: set up the initial accumulator for this node's subtree.
- **After each child**: integrate that child's result into the parent's running total.
- **After all children**: produce the final result for this node.

A reducer covers only the second of these. The other two have nowhere to go.

---

## Step 4. The graph traversal protocol: three phases

`IProcessor` is the graph equivalent of a reducer. It has three methods, one for
each phase described above. The traversal is depth-first.

:::note Name history
The interface was originally named `ITransformer`. It was later renamed to
`IProcessor` to better reflect its role. Both names are exported from
`@aelastics/types`. `ITransformer` is kept only for backward compatibility with
existing code and should not be used in new code.
:::


```ts
type WhatToDo =
  | 'continue'              // proceed to the next processor in the chain
  | 'skipThisChild'         // do not descend into the current child
  | 'skipFollowingChildren' // stop visiting siblings, go straight to result
  | 'stop'                  // terminate the entire traversal immediately

interface IProcessor {
  // Called before any child of this node is visited.
  init(value: any, currNode: Node): [any, WhatToDo]

  // Called after each child has been fully processed.
  step(result: any, currNode: Node, childResult: any): [any, WhatToDo]

  // Called after all children have been processed.
  result(result: any, currNode: Node): [any, WhatToDo]
}
```

Each method returns a tuple. The first element is the value to pass forward. The
second element is a flow-control directive.

The `Node` object available in every method carries the full context of the
current position in the traversal:

| Field | Description |
|---|---|
| `type` | The type definition of the current node (e.g. `ObjectType`, `ArrayType`) |
| `role` | The role of this node: `'asRoot'`, `'asProperty'`, `'asArrayElement'`, etc. |
| `propName` | Property name, when the node is an object property |
| `index` | Array index, when the node is an array element |
| `parentType` | The type of the parent node |
| `parentInstance` | The value of the parent node |

### Call sequence for a parent with two children

```
init(initialValue, parent)           // 1. prepare parent
  init(currentResult, child1)        // 2. prepare child 1
  result(currentResult, child1)      // 3. finalize child 1
step(child1Result, parent, child1)   // 4. integrate child 1 into parent
  init(currentResult, child2)        // 5. prepare child 2
  result(currentResult, child2)      // 6. finalize child 2
step(child2Result, parent, child2)   // 7. integrate child 2 into parent
result(currentResult, parent)        // 8. finalize parent
```

If child 1 has its own children, steps 2 and 3 expand recursively before step 4
is reached. The traversal always completes the full subtree of a child before
calling `step` on the parent.

:::note
In a graph (as opposed to a tree) a node can have multiple parents. Each parent
calls `step` with the same child result. The child is still processed only once.
This prevents infinite loops in cyclic structures and avoids redundant computation.
:::

---

## Step 5. Processor chaining and dual use

Graph processors compose by wrapping, exactly like functional transducers. Each
processor receives the next one in its constructor and delegates to it after
finishing its own logic:

```ts
class MyProcessor implements IProcessor {
  constructor(private xfNext: IProcessor) {}

  init(value: any, currNode: Node): [any, WhatToDo] {
    // own logic here
    const transformed = doSomething(value, currNode)
    // delegate to the next processor
    return this.xfNext.init(transformed, currNode)
  }

  step(result: any, currNode: Node, item: any): [any, WhatToDo] {
    // own logic, then delegate
    return this.xfNext.step(result, currNode, item)
  }

  result(result: any, currNode: Node): [any, WhatToDo] {
    // own logic, then delegate
    return this.xfNext.result(result, currNode)
  }
}
```

This means multiple processors can run in a **single depth-first pass**. Validation,
serialization, and transformation can all happen together without traversing the
graph more than once.

### Two kinds of graphs

The same processor chain works on two entirely different kinds of graphs:

| Graph | What is traversed | Example operations |
|---|---|---|
| Instance graph | Values of types (objects, arrays, nested structures) | Validation, DTO conversion, transformation, creating instances |
| Type graph | Type definitions themselves (ObjectType, ArrayType, ...) | Annotation processing, code generation, schema export |

Which graph is traversed depends on what is passed to `type.transduce(processor, input)`.
Pass an instance to traverse the instance graph. Pass `undefined` to traverse the
type graph.

---

## Summary

The graph traversal protocol is three functions, each returning the same shape:

```ts
// linear reducer — one phase
(acc, value) => acc

// graph transducer — three phases, same return shape
init:   (value, node)       => [acc, ctrl]  // before children
step:   (acc,   node, item) => [acc, ctrl]  // after each child
result: (acc,   node)       => [acc, ctrl]  // after all children
```

`ctrl` is a `WhatToDo` directive that controls traversal flow.
`step` is the only phase that receives the child result (`item`).

| Concept | Linear transducer | Graph transducer |
|---|---|---|
| Protocol | `(acc, value) => acc` | `init / step / result` |
| Structure | Flat sequences | Trees and graphs (including cyclic) |
| Composition | Nest functions | Nest processor constructors via `xfNext` |
| Works on | Arrays, streams, generators | Type graphs and instance graphs |
| Multiple operations | Multiple passes or intermediate collections | Single pass |

---

## What's next

The five-step explanation above is the conceptual foundation. The next page covers
the [Transducer API](./transducer-api.md) — the fluent builder that assembles
processor chains without implementing `IProcessor` directly.
