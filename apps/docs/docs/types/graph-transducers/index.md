---
sidebar_position: 0
title: Graph Transducers
---

Graph transducers are the mechanism that drives every built-in operation in
`@aelastics/types`. Validation, DTO conversion, instance creation, and annotation
processing all use the same underlying pipeline. You can also build your own
pipelines to process type definitions or instance data in a single traversal pass.

In this library, both type definitions and their instances are represented as
graphs. A type like `ObjectType` references other types for each of its properties.
An instance of that type may reference other instances, including cyclic references.
One traversal mechanism handles both.

## What is in this section

| Page | What it covers |
|---|---|
| [Overview](./overview.md) | How graph transducers work. Builds the concept from `reduce` on arrays up to the three-phase traversal protocol, with code examples at each step. |
| [Transducer API](./transducer-api.md) | The fluent builder (`transducer()`) that assembles processor pipelines without implementing the protocol directly. |
| [Custom Processors](./custom-processors.md) | How to build reusable processing components with `ProcessorBuilder`, `InitBuilder`, `StepBuilder`, and `ResultBuilder`. |

Start with [Overview](./overview.md) if this is your first encounter with the
concept. Skip to [Transducer API](./transducer-api.md) if you already understand
the protocol and want to use the fluent builder.

Annotations are covered in their own top-level section. The transducer pipeline's
`processAnnotations()` step is described there alongside the annotation system itself.
