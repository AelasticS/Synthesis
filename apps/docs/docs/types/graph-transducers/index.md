---
sidebar_position: 0
title: Data Processing with Graph Transducers
---

Graph transducers are the mechanism that drives every built-in operation in
`@aelastics/types`. Validation, DTO conversion, instance creation, and annotation
processing all use the same underlying pipeline. You can also build your own
pipelines to process type definitions or instance data in a single traversal pass.

A pipeline is a chain of processing steps composed together so that data flows
through all of them in a single pass. The idea comes from functional transducers,
which are well known in languages like Java (streams with `filter`, `map`,
`reduce`, `collect`) and Clojure. In a Java stream you write
`.filter(...).map(...).collect(...)` and the stream engine runs all three
operations on each element in one pass rather than building an intermediate
collection between every step. The same principle applies here: each step in
the pipeline receives the output of the previous one, and the entire chain runs
in a single traversal.

The difference from a flat stream is that the data here is a graph, not a
sequence. Type definitions and their instances form graphs: an `ObjectType`
references other types as its properties, and an instance may reference other
instances, including cycles. One traversal mechanism handles both.

## What is in this section

| Page | What it covers |
|---|---|
| [The Traversal Protocol - From Reduce to Graph Traversal](./overview.md) | How graph transducers work. Builds the concept from `reduce` on arrays up to the three-phase traversal protocol, with code examples at each step. |
| [Transducer API](./transducer-api.md) | The fluent builder (`transducer()`) that assembles processor pipelines without implementing the protocol directly. |
| [Custom Processors](./custom-processors.md) | How to build reusable processing components with `ProcessorBuilder`, `InitBuilder`, `StepBuilder`, and `ResultBuilder`. |
| [Examples](./examples.md) | End-to-end examples showing common pipeline patterns. |

Start with [The Traversal Protocol - From Reduce to Graph Traversal](./overview.md) if this is your first
encounter with the concept. Skip to [Transducer API](./transducer-api.md) if
you already understand the protocol and want to use the fluent builder.

Annotations are covered in their own top-level section. The transducer pipeline's
`processAnnotations()` step is described there alongside the annotation system itself.
