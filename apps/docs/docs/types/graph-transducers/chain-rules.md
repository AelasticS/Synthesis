---
sidebar_position: 3
title: Pipeline Chain Rules
---

# Pipeline Chain Rules

The `Transducer` builder composes steps into a pipeline. This page explains how
that composition works, what order means, and which chain structures are valid.

---

## How the chain is composed

When you call `doFinally(terminal)` (or any terminator such as `reduce`,
`count`, or `sum`), the builder composes all accumulated steps right-to-left
around the terminal, then stores the result as `reducer`:

```
steps:     [A,  dftMap,  B]
terminal:  T

composed:  A( dftMap( B(T) ) )
```

Data flows **left to right**: A receives the input first, passes its output to
`dftMap`, which passes its output to B, which passes to T.

The composed chain is stored as `reducer` on the `Transducer` object itself.
`dftMap` and `dftReduce` hold a reference to the whole `Transducer`, so when
they drive child traversal they re-enter the pipeline **from the beginning**
(from A, not from B). This is what makes the traversal recursive and depth-first.

---

## What position in the chain means

Because child traversal re-enters from the top:

- Steps **before** `dftMap` / `dftReduce` run on each node's input before
  descending into children.
- Steps **after** `dftMap` / `dftReduce` run on each node's result after all
  children have been processed.

```ts
transducer()
  .filter(...)   // runs on every node before descending
  .dftMap()      // drives depth-first traversal
  .map(...)      // runs on the built result of each node, bottom-up
  .doFinally(naturalReducer())
```

In `dftMap` mode, the `map` after the traversal step sees the fully constructed
child result, not the raw input. This is the natural place for bottom-up
transformations.

In `dftReduce` mode, the steps after `dftReduce` see the accumulated value
after each node's subtree has been processed.

---

## Use exactly one traversal step

`dftMap` and `dftReduce` both use `this.transducer.reducer` to recursively
process child nodes. That field is the fully composed pipeline. Adding two
traversal steps creates a chain where each non-leaf node is visited twice:

```ts
// Invalid: double traversal
transducer()
  .dftMap()
  .dftMap()     // child nodes are traversed again here
  .doFinally(naturalReducer())
```

The inner `dftMap` processes children using the full composed chain. When
control returns to the outer `dftMap`, it processes the same children a second
time. Results are incorrect.

Use exactly one of `dftMap()` or `dftReduce()` per pipeline.

---

## Chains without a traversal step

A pipeline without `dftMap` or `dftReduce` is valid. It processes only the root
node; there is no descent into children:

```ts
// Flat processing: root node only
transducer()
  .map((item, node) => ({ ...item, processed: true }))
  .doFinally(naturalReducer())
```

This is useful when you already have a flat value and want to apply a
transformation without traversal.

Without a terminator (`doFinally`, `reduce`, `count`, `sum`), `reducer` is
`undefined`. If a traversal step is present, it will silently skip child
processing because it checks `this.transducer.reducer` before descending.

---

## Valid chain patterns

| Chain | What it does |
|---|---|
| `dftMap → doFinally(naturalReducer())` | Standard bottom-up construction |
| `dftReduce → reduce(fn, init)` | Standard accumulation |
| `filter → dftMap → map` | Gate subtree entry, transform built results |
| `dftMap → validate → toDtoGraph` | Validate then serialize in one pass |
| `dftMap → doIf(cond, Proc)` | Conditionally attach a processor |
| `map → dftMap` | Transform input before descending (pre-processing) |
| `dftReduce → do(Collector)` | Custom collection logic after each subtree |

---

## Invalid patterns

| Chain | Why it breaks |
|---|---|
| `dftMap → dftMap` | Double traversal of all child nodes |
| `dftReduce → dftReduce` | Same as above |
| `dftMap → dftReduce` | Two traversal steps; children visited twice with mixed semantics |
| Traversal step without a terminator | `reducer` is `undefined`; child descent is silently skipped |

---

## Mixing `dftMap` and `dftReduce`

These two modes are not interchangeable within the same pipeline. `dftMap`
passes the constructed child result as the new `item` (bottom-up construction).
`dftReduce` threads the accumulator through the traversal. They have different
call signatures in `step` and produce incompatible results when combined. Use one
or the other for a given pipeline.
