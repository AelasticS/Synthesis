---
sidebar_position: 1
---

# Synthesis CLI - synth

:::warning Under development

`synth` is not yet implemented. This page describes the intended design and is
included here to document the planned interface. Commands shown below are not
runnable today.

:::

`synth` is the command-line tool for the Synthesis model-driven engineering
toolkit. It manages a local workspace of metamodels, models, and
transformations, and applies those transformations to produce target models or
generated text.

## Why a CLI

The Synthesis libraries (`@aelastics/types`, `@aelastics/store`, and the
transformation framework) provide programmatic APIs that assume the caller has
already wired up imports, schemas, and a `ModelStore`. The CLI removes that
ceremony for everyday tasks:

- **Run a transformation** without writing a TypeScript driver script.
- **Validate** a model against its metamodel from any shell.
- **Install** community-published transformations the same way you install a
  package.
- **Move models** between the workspace and the filesystem (upload / download).

The CLI is not a replacement for the libraries; it is a thin layer that
operates on the same artifacts.

## Installation

```bash
npm install -g @synthesis/cli
synth init
```

`synth init` creates the workspace (default `~/.synth/`) and writes a
`config.json` that records where it lives. The location can be moved later
with `synth workspace --set <path>`.

## The workspace

Everything `synth` manages lives in a single local folder, the **workspace**.
Its layout reflects the concepts of the toolkit:

```text
~/.synth/
├── config.json              # workspace settings (paths, defaults)
├── metamodels/              # installed type schemas
├── models/                  # model instances, grouped by namespace
│   └── com.example.orders/
│       ├── order-1.json
│       └── order-2.json
├── tx/                      # compiled transformations
│   └── eer-to-relational/
└── configs/                 # variability configurations
```

The `models/` directory is organized by **namespace** — folders whose names
correspond to model namespaces. A model is addressed by `<namespace>/<name>`
(its **ref**), e.g. `com.example.orders/order-1`.

## Quick example

```bash
# Install a transformation
synth tx install @aelastics/eer-to-relational

# Upload a model from the local filesystem
synth model import ./examples/library.eer.json --as com.example/library

# Validate it against its metamodel
synth model validate com.example/library

# Generate a default configuration for the transformation
synth config init eer-to-relational --for com.example/library

# Run the transformation
synth run eer-to-relational \
  --in com.example/library \
  --config com.example/library.cfg \
  --out com.example/library.rel

# Export the result back to disk
synth model export com.example/library.rel --to ./out/library.rel.json
```

## Next

See the [Command Reference](./commands) for every command, grouped by
resource.
