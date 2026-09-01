---
sidebar_position: 3
---

# Concepts

`synth` is the command-line tool for the Synthesis model-driven engineering
toolkit. It does three things:

1. **Manages a local workspace** of models, installed transformations, and
   saved pipelines. Models are imported through a validation gate, organized
   in nested namespaces, and protected by a dependency graph on deletion.
2. **Runs transformations**, model-to-model and model-to-text, as single
   steps, ad-hoc chains, or saved pipelines, with an explicit-consent policy
   for every design decision a transformation leaves open.
3. **Builds and packages transformations**: scaffold a transformation
   project, build it, and pack or publish it as an installable package.

The CLI is not a replacement for the Synthesis libraries; it is a thin layer
that operates on the same artifacts and removes the ceremony of wiring up
imports, schemas, and a `ModelStore` by hand.

This page defines the handful of concepts every other page builds on.

## The workspace

Everything `synth` manages lives in one local folder, the **workspace**,
created by `synth init` (default `~/.synth/`, movable with
`synth workspace --set <path>`):

```text
~/.synth/
├── config.json          # workspace settings, installed-transformation registry
├── models/              # .tsx model files in a nested namespace tree
│   └── com/
│       └── example/
│           └── persons.tsx      # ref: com.example/persons
├── transformations/     # installed transformation packages
└── pipelines/           # saved pipelines, one <name>.json per pipeline
```

## Namespaces and refs

A **namespace** is a directory path under `models/`: the namespace
`com.example` is the directory `models/com/example/`, and namespaces nest to
any depth. A model is addressed by its **ref**, `<namespace>/<name>`, e.g.
`com.example/persons` for `models/com/example/persons.tsx`. Ref and disk
location are mechanically derivable from each other, so the ref itself is
never stored in the file and cannot drift.

## Models are code

A workspace model is a `.tsx` module (JSX that renders into a model when
executed), not a JSON data file. Every workspace model carries an exported
`$synth` header, a pure literal constant that records what the model is
(its kind and metamodel), what it depends on, and where it came from. The
header is **written and maintained by the tools**, never required from
humans; a hand-authored file without a header gets one derived at import.

Because models are code, nothing enters the workspace unchecked:
`model import` renders the file for real and validates it against its
metamodel before copying it in. The invariant this buys: **everything in the
workspace was loadable when it entered.**

The full story (the header fields, the import gate, and the
dependency-graph protection on deletion) is in
[Managing Models](./guides/managing-models.md).

## Transformations, chains, and pipelines

A **transformation** is an installed package whose manifest declares its
kind, model-to-model (the result is a new workspace model) or
model-to-text (the result is generated files), plus its source and target
metamodels and any open design decisions. `synth transformation show <name>`
prints all of it without running anything.

Several transformations can run as a **chain**: step N's output model feeds
step N+1 in memory. Before anything executes, the chain is type-checked from
the manifests: step N's target metamodel must equal step N+1's source
metamodel. Only the last step may be model-to-text.

A **pipeline** is a chain with a name: an ordered list of steps saved in the
workspace and replayed with `synth pipeline run <name> --in <ref>`. A
pipeline stores steps only, with no input model, no configuration, and no
consents, so every run names its own data. See [Pipelines](./guides/pipelines.md).

## Decisions and configurations

Many transformations are **configuration-based**: they leave design decisions
open (say, a naming convention) and declare defaults. `synth` never applies
defaults silently: a configuration-based run must either name a reviewed
**configuration model** (`--config <ref>`) or accept the generated defaults
explicitly (`--default-configs`), and every applied default is announced in
the output. With neither, the run aborts before any engine work. The full
workflow is in [Configurations](./guides/configurations.md).

## Canonical names and typing aliases

Every command is `synth <resource> <verb>`. Each resource topic has a
full-word **canonical** name, the one used in help, documentation, and error
hints, and the three long ones also have a two-letter **typing alias**, a
pure shortcut with identical behavior:

| Resource | Canonical topic | Alias |
|---|---|---|
| transformation | `transformation` | `tx` |
| namespace | `namespace` | `ns` |
| pipeline | `pipeline` | `pl` |
| model | `model` | (none) |
| config | `config` | (none) |
| workspace | `workspace` | (none) |

`synth tx run` and `synth transformation run` are the same command.

## Interactive by default, strict in scripts

In a terminal, `synth` helps you fill in what you left out: a bare
`synth transformation run` opens a picker over the installed transformations,
then over the models matching its source metamodel, then asks explicitly how
to handle open decisions. Piped, scripted, `--json`, `--quiet`, and CI
invocations never prompt; they fail with the same strict errors a script can
rely on. Shell completion for values (transformation names, refs, pipeline
names) is available after a one-time setup; see
[Installation](./getting-started/installation.md#shell-completion).

## Two kinds of users

- **Consumers**: install transformations, import models, run
  transformations and pipelines against their data. Most users start here;
  this guide is for you.
- **Authors**: scaffold a transformation project
  (`synth transformation init`), implement and build it, pack or publish it.
  The [Developer Guide](../developer-guide/index.md) covers authoring;
  [Packaging Transformations](../developer-guide/guides/packaging-transformations.md)
  documents the manifest and the full workflow.
