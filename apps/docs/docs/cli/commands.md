---
sidebar_position: 2
---

# Command Reference

:::warning Under development

`synth` is not yet implemented. The commands below describe the intended
interface only.

:::

Every command operates on a **resource**: the workspace, models, namespaces,
transformations, or configurations. The general form is:

```bash
synth <resource> <verb> [arguments] [flags]
```

A few operations (`init`, `run`, `m2t`) act on the workspace as a whole and
omit the resource prefix.

## Workspace

The workspace is the local folder that holds all installed metamodels,
models, and transformations. See [Introduction](./intro#the-workspace) for
the layout.

| Command | Description |
|---|---|
| `synth init [--path <dir>]` | Create a new workspace (default `~/.synth/`). |
| `synth workspace` | Print the active workspace path and a summary. |
| `synth workspace --set <path>` | Switch the active workspace. |
| `synth doctor` | Check workspace integrity: missing files, broken references. |

## Namespaces

Folders under `models/` whose names correspond to model namespaces. Every
model belongs to exactly one namespace.

| Command | Description |
|---|---|
| `synth ns ls` | List all namespaces in the workspace. |
| `synth ns mk <namespace>` | Create an empty namespace. |
| `synth ns rm <namespace>` | Remove a namespace (must be empty unless `--force`). |

## Models

A **model** is an instance of a metamodel, stored as a JSON file under
`models/<namespace>/<name>.json`. The address `<namespace>/<name>` is called
a **ref**.

| Command | Description |
|---|---|
| `synth model ls [--ns <namespace>]` | List all models, optionally filtered by namespace. |
| `synth model show <ref>` | Print a model's metadata and element summary. |
| `synth model import <file> [--as <ref>]` | Copy a JSON file from disk into the workspace. The ref defaults to the file's namespace+name. |
| `synth model export <ref> [--to <file>]` | Write a model from the workspace to a file on disk. Default location is `./<name>.json`. |
| `synth model rm <ref>` | Delete a model from the workspace. |
| `synth model validate <ref> [--against <metamodel>]` | Check the model against its metamodel. Without `--against`, uses the metamodel recorded in the model's header. |

## Transformations

A **transformation** is a compiled model-to-model mapping installed as a
package under `tx/`. Once installed, it can be run repeatedly against any
matching source model.

| Command | Description |
|---|---|
| `synth tx ls` | List installed transformations with versions. |
| `synth tx install <package>` | Install from an npm package name, a git URL, or a local directory. |
| `synth tx uninstall <name>` | Remove an installed transformation. |
| `synth tx show <name>` | Print the transformation's source metamodel, target metamodel, and any variability points. |

## Configurations

A **configuration** records the design choices made at each variability
point of a transformation, for one specific source model.

| Command | Description |
|---|---|
| `synth config init <tx> --for <model> [--out <ref>]` | Generate a default configuration. Each variability point is set to its declared default. The result is stored as a config ref. |
| `synth config ls [--for <tx>]` | List configurations, optionally filtered by transformation. |
| `synth config show <ref>` | Print the current value of every binding in a configuration. |
| `synth config edit <ref>` | Open the configuration in `$EDITOR`. |
| `synth config rm <ref>` | Delete a configuration. |

## Running transformations

Two commands apply different kinds of generators:

- **`run`** — model-to-model. Produces another model in the workspace.
- **`m2t`** — model-to-text. Produces files on disk.

### Model-to-model

```bash
synth run <tx> --in <model-ref> [--config <config-ref>] [--out <ref>]
```

| Flag | Description |
|---|---|
| `--in <ref>` | Source model to transform. Required. |
| `--config <ref>` | Configuration to resolve variability points. If omitted, defaults are used. |
| `--out <ref>` | Where to store the result. Defaults to `<source-namespace>/<source-name>.<target-suffix>`. |
| `--overwrite` | Replace the target model if a ref already exists at `--out`. |

### Model-to-text

```bash
synth m2t <model-ref> --template <spec> --out <dir>
```

| Flag | Description |
|---|---|
| `--template <spec>` | Path or installed name of the M2T template. Required. |
| `--out <dir>` | Output directory on disk. Required. |
| `--dry-run` | Print the files that would be written, without writing them. |

## Global flags

These apply to every command.

| Flag | Description |
|---|---|
| `--workspace <path>` | Override the active workspace for this invocation. |
| `--json` | Emit machine-readable JSON instead of formatted text. |
| `--quiet` | Suppress informational output. |
| `--verbose` | Print debug-level logs. |
| `--help` | Show usage for the current command. |
| `--version` | Print the CLI version. |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | Generic failure (unhandled error, invalid arguments). |
| `2` | Validation failure (one or more model errors reported). |
| `3` | Resource not found (model, transformation, or namespace). |
| `4` | Workspace not initialized or unreadable. |
