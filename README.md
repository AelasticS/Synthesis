# Synthesis

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

Synthesis is a TypeScript monorepo for **model-driven software engineering**. It
provides an embedded domain-specific language for defining metamodels, building
model instances with JSX, and writing model-to-model transformations.
Supporting libraries handle runtime type validation, reactive state management,
and typed error handling. A CLI tool ties everything together for code
generation workflows.

## Documentation

The full documentation site lives at
**[AelasticS.github.io/aelastics](https://AelasticS.github.io/aelastics/)**.

| Section | Description |
|---|---|
| [Synthesis eDSL](https://AelasticS.github.io/aelastics/docs/synthesis/) | Define metamodels, build models with JSX, write transformations, configure variability with design decisions |
| [synth CLI](https://AelasticS.github.io/aelastics/docs/cli/intro) | Run, package, install, and share transformations |
| [@aelastics/types](https://AelasticS.github.io/aelastics/docs/types/intro) | Runtime type system with schemas, validation, and graph transducers |
| [@aelastics/store](https://AelasticS.github.io/aelastics/docs/store/intro) | Reactive model store built on MobX |
| [@aelastics/result](https://AelasticS.github.io/aelastics/docs/result/intro) | Typed success/failure handling without exceptions |

## Installing the CLI

The `synth` CLI ships as platform tarballs on
[GitHub Releases](https://github.com/AelasticS/Synthesis/releases) — no Node
runtime required on the user's machine. See
**[Installation](https://AelasticS.github.io/aelastics/docs/cli/installation)**
for step-by-step instructions for Linux, macOS, Windows, and building from
source.

## Repository layout

```text
Synthesis/
├── libraries/
│   ├── aelastics-result/      # Result/error handling utilities
│   ├── aelastics-types/       # Runtime type system + transducers
│   ├── aelastics-store/       # Reactive model store (MobX-based)
│   ├── jsx-runtime/           # JSX runtime for model construction
│   ├── metamodel-core/        # Repository / Model / ModelElement base types
│   ├── standard-metamodels/   # Reusable metamodels (BPM, EER, REL, types)
│   ├── engine/                # Transformation engine + ModelStore
│   ├── runner/                # Transformation runner registry
│   ├── decision-framework/    # Variability and design-decision support
│   └── examples/              # End-to-end example pipelines
├── apps/
│   ├── cli/                   # synth CLI (oclif)
│   └── docs/                  # Docusaurus documentation site
├── common/                    # Rush shared configuration
├── .github/workflows/         # CI: docs deploy, CLI release
└── rush.json                  # Rush workspace definition
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, branch strategy,
commit conventions, testing rules, and the CLI release workflow.

## History

The project began in March 2019 as
[`dynamic-types`](https://gitlab.com/sinisa_neskovic/dynamic-types) on GitLab,
a runtime type system for TypeScript inspired by
[io-ts](https://github.com/gcanti/io-ts). In March 2020 it moved to the private
[`aelastics`](https://github.com/AelasticS/aelastics) monorepo on GitHub, where
the type system grew alongside new packages for reactive state management,
model stores, and a JSX-based model transformation engine. In 2026 the
libraries were extracted into this public
[Synthesis](https://github.com/AelasticS/Synthesis) monorepo.

## License

[Apache License 2.0](LICENSE).
