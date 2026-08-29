---
sidebar_position: 1
---

# Command Reference

Every command operates on a **resource** and has the form:

```bash
synth <resource> <verb> [arguments] [flags]
```

An argument's resource type is always determined by the topic it was typed
under: `transformation run`'s arguments are always transformations,
`pipeline run`'s argument is always a pipeline; nothing is guessed from what
happens to exist in the workspace. The `transformation`, `namespace`, and
`pipeline` topics have the typing aliases `tx`, `ns`, and `pl` (see
[the alias table](../concepts.md#canonical-names-and-typing-aliases)); a few
workspace-wide operations (`init`, `doctor`, `cd`, `workspace`) omit the
resource prefix.

## Global flags

These apply to every `synth` command.

| Flag | Description |
|---|---|
| `--workspace <path>` | Override the active workspace for this invocation. |
| `--ns <namespace>` | Namespace context override (otherwise resolved from config). |
| `--json` | Emit machine-readable JSON instead of formatted text. |
| `-q`, `--quiet` | Suppress informational output. |
| `-v`, `--verbose` | Print debug-level logs. |

## Exit codes and `--json`

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | Generic failure (unhandled error, invalid arguments). |
| `2` | Validation failure (model errors, chain mismatch, missing configuration consent, import-gate rejection). |
| `3` | Resource not found (model, transformation, pipeline, or namespace). |
| `4` | Workspace not initialized or unreadable. |

The `--json` contract is uniform: on failure a command prints a
machine-readable error object as its only stdout:

```json
{ "error": "Transformation 'no-such-tx' not found." }
```

It **also** exits non-zero with the same code as the human-readable mode. No
command ever prints an `error` object with exit 0.

In a terminal session (stdin and stdout are TTYs, no `--json`, no `--quiet`,
`CI` unset), the commands `transformation run`, `pipeline run`, and
`config init` prompt for missing values instead of failing. Every other
session (pipes, scripts, CI, machine output) gets the strict errors below,
unchanged.

## Workspace

| Command | Description |
|---|---|
| `synth init [--path <dir>]` | Create a new workspace (default `~/.synth/`): `config.json`, `models/`, `transformations/`, `pipelines/`. |
| `synth workspace` | Print the active workspace path. |
| `synth workspace --set <path>` | Switch the active workspace. |
| `synth doctor [--fix]` | Check workspace integrity. |
| `synth cd [<namespace>]` | Change the current namespace; without an argument, show it. |

`synth doctor` re-checks the import-gate invariant workspace-wide: every
model file must parse, its `$synth` header must agree with the rendered
content, its declared references must resolve, and every saved pipeline must
pass the same static checks as `pipeline mk` (schema, steps installed, chain
compatibility; pipeline problems are warnings and never block the
workspace). `doctor --fix` re-derives and writes missing or unparseable model
headers through the same code path as `model import`.

## Namespaces

Namespaces are nested directories under `models/`; `com.example` is
`models/com/example/` and may contain both models and deeper namespaces.

| Command | Description |
|---|---|
| `synth namespace ls` | List all namespaces in the workspace. |
| `synth namespace mk <namespace>` | Create an empty namespace (segments: letters, digits, hyphen, underscore, dot-separated). |
| `synth namespace rm <namespace>` | Remove a namespace; must be empty unless `--force`. |

`namespace rm --cascade` additionally deletes every model **outside** the
namespace that transitively references a model inside it (implies
`--force`). This is the same reverse-dependency reasoning as
`model rm --cascade`, applied to the whole subtree.

## Models

A model is a `.tsx` file at `models/<namespace path>/<name>.tsx`, addressed
by its ref `<namespace>/<name>` (see [Models are code](../guides/managing-models.md#models-are-code)).

| Command | Description |
|---|---|
| `synth model import <file>` | Validate a `.tsx` model file and copy it into the workspace. |
| `synth model export <ref> [--to <file>]` | Write a model out to disk, verbatim, header included. |
| `synth model ls` | List models with their header metadata (`--ns` filters to a namespace). |
| `synth model show <ref>` | Show a model's header and file location. |
| `synth model validate <ref>` | Render the model for real and check it against its metamodel. |
| `synth model rm <ref>` | Delete a model, guarded by the dependency graph. |

### `model import`: the validation gate

Everything enters the workspace through `model import <file> --as <ref>`:

1. The file is transpiled and rendered into a throwaway store, giving full
   structural validation. Broken JSX, an unresolvable metamodel, or a
   dangling `$refByName` reject the import.
2. The model's references are checked against the workspace; a missing
   dependency is an error naming it (in a terminal session, `synth` offers
   to import it first).
3. The `$synth` header is derived or verified and written; authorship fields
   are stamped (`--author`, `--description`, `--tags`, defaults from
   `git config`).
4. The file is copied into the namespace tree. `--force` overwrites an
   existing target.

The invariant this buys: **everything in the workspace was loadable when it
entered**. That is why run time is strict: `--in` accepts workspace refs,
never file paths.

Configuration models reference their transformation's decision and binding
models, which live in the installed package rather than the workspace; pass
`--tx <name>` so the validation render pre-loads the package's parts. The
same applies to `model validate` on a configuration model.

`model validate` also accepts `--against <metamodel>` to assert the header
declares a specific metamodel.

### `model rm` and the dependency graph

Deletion is protected by the reverse-dependency graph built from `$synth`
headers: `model rm <ref>` is **refused** (exit 2) while any other model
transitively references the target, and the refusal lists the dependent
models. `--cascade` deletes the target together with every model that
transitively references it. `config rm` has the same semantics for
configuration models.

## Transformations

Transformations are installed packages (see
[Packaging Transformations](../../developer-guide/guides/packaging-transformations.md)); the manifest
declares everything the CLI needs (kind, metamodels, entry point, decision
and binding model parts) without loading code.

| Command | Description |
|---|---|
| `synth transformation install <package>` | Install from an npm name, git URL, local directory, or tarball; the manifest's claims are verified against the loaded transformation class. |
| `synth transformation uninstall <name>` | Remove an installed transformation. Refused (exit 2) while any saved pipeline lists it as a step; update or `pipeline rm` those pipelines first. |
| `synth transformation ls` | List installed transformations with versions. |
| `synth transformation show <name>` | Print kind, source/target metamodels, and, for configuration-based transformations, every issue with its options and defaults (loaded from the package's decision model). |
| `synth transformation run <tx> [<tx> ...]` | Run one transformation or a chain; see below. |
| `synth transformation init <name>` | Scaffold a new transformation project (`package.json`, `synth.json`, `tsconfig.json`, `src/index.ts`). |
| `synth transformation build` | Build the transformation project in the current directory. |
| `synth transformation test` | Run the project's test fixtures. |
| `synth transformation pack` | Produce a distributable tarball. |
| `synth transformation publish` | Publish to npm (`--access`, `--tag`, `--dry-run`). |

### `transformation run`

```bash
synth transformation run <tx> [<tx> ...] --in <ref> [flags]
```

Whether a run is model-to-model or model-to-text is decided by the
manifest's `kind`, never by the command name.

| Flag | Description |
|---|---|
| `--in <ref>` | Source model ref the first step transforms. Required. |
| `--out <ref>` | Destination for the final result model (last step m2m only; default `<namespace>/<name>-<last-tx>` derived from `--in`). |
| `--out-dir <dir>` | Output directory for generated files (last step m2t only). |
| `--config <ref>` | Configuration model for step 1 (configuration-based only). |
| `--default-configs` | Explicitly accept generated default configurations for every configuration-based step not covered by `--config`. |
| `--save-config <ref>` | Persist the generated default configuration as a workspace model (single step, only with `--default-configs`). |
| `--keep-intermediates` | Also write every intermediate chain result as a workspace model at `<namespace>/<name>-<step-tx>`. |
| `--save-as <name>` | After a successful run, save the steps as a pipeline (see [Pipelines](../guides/pipelines.md)). |
| `--overwrite` | Replace existing targets (final and intermediate models, `--save-config` target, `--save-as` pipeline). |

An m2m result is written back into the workspace as a model file with a
provenance header (`generatedBy: { tx, txVersion, config, date }`) and passes
back through the same import gate as any other model. An m2t result generates
files under `--out-dir`. Existing targets are only replaced with
`--overwrite`.

### The consent policy: decisions are never applied implicitly

Many transformations are **configuration-based**: they leave design decisions
open (say, a naming convention) and declare defaults. `synth` never applies
those defaults silently. A configuration-based run must carry exactly one of:

- `--config <ref>`: run on a reviewed, editable configuration model
  (created with `synth config init`, see [Configurations](../guides/configurations.md));
- `--default-configs`: explicitly accept generated defaults; every applied
  choice is announced in the output, e.g. `NamingConvention -> SnakeCase (default)`.

With neither, the run aborts (exit 2) **before any engine work**, and the
error teaches both paths:

```text
Transformation 'eer-to-relational' is configuration-based. Provide --config <ref>
(create one with: synth config init eer-to-relational --for com.example/persons)
or accept generated defaults explicitly with --default-configs.
```

The policy is uniform: it applies identically to single steps, ad-hoc
chains, and saved pipelines; a pipeline is convenience, never a bypass.

### Chains

Several transformation names run as a chain: step N's output model feeds
step N+1 in memory. Before anything executes, the chain is type-checked
from the manifests: step N's target metamodel must equal step N+1's source
metamodel, and a mismatch names the incompatible pair. Only the last step
may be m2t (text is terminal); a last m2t step requires `--out-dir`,
otherwise `--out` applies.

Configuration consent in a chain: `--config` binds to **step 1 only**;
an explicit configuration cannot exist for a model that is only produced
mid-run. Every other configuration-based step (and step 1 without `--config`)
requires `--default-configs`. To configure a later step explicitly, run
stepwise: keep the intermediate with `--keep-intermediates`, then
`config init` against it and run the next step with `--config`; the full
sequence is in [Configurations](../guides/configurations.md#configuring-a-chain-stepwise).

```bash
# One chain, defaults accepted for both steps
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --default-configs --out-dir ./generated

# Reviewed configuration for step 1, defaults for the rest
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --config com.example/persons-cfg \
  --default-configs --out-dir ./generated
```

## Configurations

Configuration models record the decisions for one transformation on one
specific source model. They live in the models tree like any other model;
the `config` topic filters and contextualizes them. The full workflow is in
[Configurations](../guides/configurations.md).

| Command | Description |
|---|---|
| `synth config init <tx> --for <model>` | Generate the default configuration model as an editable workspace model (default ref `<namespace>/<name>-cfg`, override with `--out`; `--overwrite` replaces). |
| `synth config ls [--for <tx>]` | List configuration models, optionally only those generated by one transformation. |
| `synth config show <ref>` | Render a configuration and print every decision it records (`--tx` supplies the context for hand-written configurations). |
| `synth config edit <ref>` | Open the configuration in `$EDITOR`; re-check afterwards with `model validate <ref> --tx <name>`. |
| `synth config rm <ref>` | Delete a configuration model (`model rm` semantics: dependency check, `--cascade`). |

## Pipelines

A pipeline is a **named process**: an ordered list of transformation steps
stored as plain JSON at `pipelines/<name>.json`, with no data bindings and no
stored consents. Every run names its own data. Full guide:
[Pipelines](../guides/pipelines.md).

| Command | Description |
|---|---|
| `synth pipeline mk <name> <tx...>` | Create a pipeline; validation is static and manifest-driven, nothing executes (`--description`, `--overwrite`). |
| `synth pipeline run <name> --in <ref>` | Run a saved pipeline through the identical request path as `transformation run` with those steps; `--in` is always required. |
| `synth pipeline ls` | List saved pipelines with steps and description. |
| `synth pipeline show <name>` | Show every field of a pipeline. |
| `synth pipeline rm <name>` | Delete a pipeline (nothing references pipelines, so no dependency check). |
| `synth pipeline edit <name>` | Edit the JSON in `$EDITOR`; afterwards the file is re-validated like `pipeline mk` and problems are reported as warnings. |

## Examples

Bundled, self-contained showcases that run without any workspace content.

| Command | Description |
|---|---|
| `synth example ls` | List the bundled examples. |
| `synth example describe <id>` | Show full details of one example. |
| `synth example run <id> [--out <dir>]` | Execute an example and write its artifacts to disk (default `./out/<id>`). |

```bash
synth example ls
synth example run eer-to-rel-to-text --out ./generated
```

## Shell completion

`synth autocomplete` prints the one-time setup instructions for command and
flag completion; a second, dynamic layer completes **values**
(transformation names, model and configuration refs, pipeline names,
namespaces), context-aware (after `transformation run eer-to-relational`,
TAB on `--in` offers only models matching its source metamodel). Setup for
both layers is in [Installation](../getting-started/installation.md#shell-completion).
