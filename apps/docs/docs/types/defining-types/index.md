---
sidebar_position: 0
title: Defining Types
---

`@aelastics/types` lets you define data types at runtime. Those type definitions
are first-class objects; they carry enough information to validate values, convert
them to and from DTO formats, and drive custom data processing pipelines.

Types are organized into three groups based on their structure, and collected into
schemas that act as namespaces.

## What is in this section

| Page | What it covers |
|---|---|
| [Simple Types](./simple-types.md) | Predefined primitives (`string`, `number`, `boolean`, `date`, `literal`, and more), how to derive constrained subtypes, and the full list of built-in constraint methods. |
| [Objects, Entities and Subtyping](./object-types.md) | Defining object types with named properties, entity types with identity keys, structural subtyping, and inverse (bidirectional) relationships. |
| [Collections](./collections.md) | Typed arrays, maps, and sets. |
| [Tagged Union](./tagged-union.md) | Discriminated unions where a shared field identifies the active variant. |
| [Intersection Types](./intersection.md) | Combining multiple types into one. |
| [Optional Types](./optional.md) | Marking properties or standalone types as optional. |
| [Recursive and Cyclic Types](./recursive-types.md) | Using `link()` to define types that reference themselves or each other. |
| [Specifying Constraints](./constraints.md) | Attaching custom validation predicates to any type with `addValidator()`. |
| [Type Schemas](./schemas.md) | Organizing types into named, nestable schemas that act as namespaces. |
