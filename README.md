# Synthesis

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/AelasticS/Synthesis/blob/main/LICENSE)

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
| [User Guide](https://AelasticS.github.io/aelastics/user-guide) | Install the `synth` CLI, import models, run transformations, chains, and pipelines |
| [Developer Guide](https://AelasticS.github.io/aelastics/developer-guide) | The Synthesis transformation language: define metamodels, build models with JSX, write transformations, configure variability with design decisions |
| [@aelastics/types](https://AelasticS.github.io/aelastics/types/intro) | Runtime type system with schemas, validation, and graph transducers |
| [@aelastics/store](https://AelasticS.github.io/aelastics/store/intro) | Reactive model store built on MobX |
| [@aelastics/result](https://AelasticS.github.io/aelastics/result/intro) | Typed success/failure handling without exceptions |

## Installing the CLI

The `synth` CLI ships as platform tarballs on
[GitHub Releases](https://github.com/AelasticS/Synthesis/releases); no Node
runtime is required on the user's machine. See
**[Installation](https://AelasticS.github.io/aelastics/user-guide/getting-started/installation)**
for step-by-step instructions for Linux, macOS, Windows, and building from
source.

## Repository layout

```text
Synthesis/
├── libraries/
│   ├── aelastics-result/      # Result/error handling utilities
│   ├── aelastics-types/       # Runtime type system + transducers
│   ├── aelastics-store/       # Reactive model store (MobX-based)
│   └── synthesis/             # @aelastics/synthesis: JSX runtime, core
│                              #   metamodel, model store, m2m and m2t
│                              #   engines, configuration-based variability
├── apps/
│   ├── cli/                   # @aelastics/synthesis-cli: the synth CLI (oclif)
│   └── docs/                  # Docusaurus documentation site
├── examples/
│   ├── tutorial/              # tutorial suite + its metamodel packages
│   └── eer-to-sql/            # full-example suite + its metamodel packages
├── templates/
│   └── transformation-template/  # starter transformation package
├── common/                    # Rush shared configuration
├── .github/workflows/         # CI: docs deploy, CLI release
└── rush.json                  # Rush workspace definition
```

The package structure, the export surface of `@aelastics/synthesis`, and
the rules behind them are documented in
[design/architecture.md](https://github.com/AelasticS/Synthesis/blob/main/design/architecture.md).

## Contributing

See [CONTRIBUTING.md](https://github.com/AelasticS/Synthesis/blob/main/CONTRIBUTING.md)
for development setup, branch strategy, commit conventions, testing rules, and
the CLI release workflow.

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

[Apache License 2.0](https://github.com/AelasticS/Synthesis/blob/main/LICENSE).
