---
slug: /
sidebar_class_name: hidden
---

# Synthesis

Synthesis is a TypeScript monorepo for model-driven software engineering. It provides an embedded domain-specific language (eDSL) for defining metamodels, constructing model instances with JSX, and writing model-to-model transformations. Supporting libraries handle runtime type validation, reactive state management, and typed error handling. A CLI tool ties everything together for code generation workflows.

## Documentation

| Section | Description |
|---|---|
| [Synthesis eDSL](./synthesis/) | Developer guide for the core eDSL. Define metamodels as type schemas, build models with JSX, write transformations with typed rules and automatic tracing, configure variability with design decisions. |
| [synth CLI](./cli/intro) | Command-line tool for running transformations and generating code |
| [@aelastics/types](./types/intro) | Runtime type system with schemas, validation, and graph transducers |
| [@aelastics/store](./store/intro) | Reactive model store built on MobX |
| [@aelastics/result](./result/intro) | Typed success/failure result handling without exceptions |
