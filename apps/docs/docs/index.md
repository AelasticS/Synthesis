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
| [synth CLI](./cli/intro) | Run, package, install, and share transformations as npm packages |
| [@aelastics/types](./types/intro) | Runtime type system with schemas, validation, and graph transducers |
| [@aelastics/store](./store/intro) | Reactive model store built on MobX |
| [@aelastics/result](./result/intro) | Typed success/failure result handling without exceptions |

## Ecosystem

Transformations are first-class, distributable artifacts. Authors package transformations with `synth transformation build` and publish to npm; users install with `synth transformation install` and run with `synth transformation run`. See [Packaging Transformations](./cli/packaging-transformations).

## History

The project began in March 2019 as [`dynamic-types`](https://gitlab.com/sinisa_neskovic/dynamic-types) on GitLab, a runtime type system for TypeScript inspired by [io-ts](https://github.com/gcanti/io-ts). In March 2020 it moved to the private [`aelastics`](https://github.com/AelasticS/aelastics) monorepo on GitHub, where the type system grew alongside new packages for reactive state management, model stores, and a JSX-based model transformation engine. In 2026 the libraries were extracted into this public [Synthesis](https://github.com/AelasticS/Synthesis) monorepo.
