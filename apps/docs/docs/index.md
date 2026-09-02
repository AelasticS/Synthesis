---
slug: /
sidebar_class_name: hidden
---

# Synthesis

Synthesis is a TypeScript environment for model-driven software engineering, developed by the [AelasticS group](https://github.com/AelasticS). Its core is the **Synthesis transformation language**, an embedded domain-specific language implemented within TypeScript, for defining metamodels, constructing model instances with JSX, and writing model-to-model transformations. Supporting libraries handle runtime type validation, reactive state management, and typed error handling. The `synth` CLI ties everything together for code generation workflows. The source code lives in the [Synthesis repository](https://github.com/AelasticS/Synthesis) on GitHub.

## Where to start

| I want to… | Go to |
|---|---|
| **Run transformations**: install the CLI, import my models, run and chain published transformations, save pipelines | [User Guide](./user-guide/index.md) |
| **Build transformations**: define metamodels, build models with JSX, write transformation rules, package and publish them | [Developer Guide](./developer-guide/index.md) |
| **See working code**: complete, installable example packages with their metamodels | [Examples](./developer-guide/examples/index.md) |

## Libraries

Everything ships under the `@aelastics` scope: the Synthesis library itself, and three foundation libraries that are independently usable in any TypeScript project:

| Library | Description |
|---|---|
| [@aelastics/synthesis](./developer-guide/index.md) | The Synthesis library: the JSX authoring runtime, core metamodel, model store, model-to-model and model-to-text engines, and configuration-based variability. Documented in the Developer Guide |
| [@aelastics/types](./types/intro.md) | Runtime type system with schemas, validation, annotations, and graph transducers; usable for defining schemas and creating validated instances with or without the rest of Synthesis |
| [@aelastics/store](./store/intro.md) | Reactive model store built on MobX with runtime type conformance |
| [@aelastics/result](./result/intro.md) | Typed success/failure result handling without exceptions |

## Ecosystem

Transformations are first-class, distributable artifacts. Authors package transformations with `synth transformation build` and publish to npm; users install with `synth transformation install` and run with `synth transformation run`. See [Packaging Transformations](./developer-guide/guides/packaging-transformations.md).

## History

The project began in March 2019 as [`dynamic-types`](https://gitlab.com/sinisa_neskovic/dynamic-types) on GitLab, a runtime type system for TypeScript inspired by [io-ts](https://github.com/gcanti/io-ts). In March 2020 it moved to the private [`aelastics`](https://github.com/AelasticS/aelastics) monorepo on GitHub, where the type system grew alongside new packages for reactive state management, model stores, and a JSX-based model transformation engine. In 2026 the libraries were extracted into this public [Synthesis](https://github.com/AelasticS/Synthesis) monorepo.
