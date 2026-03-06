---
sidebar_position: 0
title: Working with Instances
---

Once types are defined, `@aelastics/types` provides several operations on their
instances: deriving static TypeScript types for IDE support, validating values
against constraints, converting between natural and DTO representations, and
creating new instances with defaults.

## What is in this section

| Page | What it covers |
|---|---|
| [Type Inference](./type-inference.md) | Extracting static TypeScript types from dynamic type definitions using `TypeOf<T>`, `DtoGraphTypeOf<T>`, and `DtoTreeTypeOf<T>`. Covers IDE autocompletion and class implementations. |
| [Validation](./validation.md) | Running constraints with `validate()` and `validateAndReport()`. Explains how errors accumulate across the derivation chain and how the error object mirrors the data structure. |
| [Serialization](./serialization.md) | Converting between natural values and graph DTOs with `toDtoGraph()` and `fromDtoGraph()`. Explains the `InstanceReference` format and how cyclic graphs are handled. |
| [Creating Instances](./create-instance.md) | Using `createInstance()` to produce typed instances with initialized defaults. |
