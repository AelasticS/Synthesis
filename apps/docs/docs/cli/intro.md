---
sidebar_position: 1
---

# Synthesis CLI - synth

`synth` is the command-line tool for the Synthesis model-driven engineering
toolkit. It does three things:

1. **Manages a local workspace** of models, installed transformations, and
   saved pipelines — models are imported through a validation gate, organized
   in nested namespaces, and protected by a dependency graph on deletion.
2. **Runs transformations** — model-to-model and model-to-text, as single
   steps, ad-hoc chains, or saved pipelines — with an explicit-consent policy
   for every design decision a transformation leaves open.
3. **Builds and packages transformations** — scaffold a transformation
   project, build it, and pack or publish it as an installable package.

The CLI is not a replacement for the Synthesis libraries; it is a thin layer
that operates on the same artifacts and removes the ceremony of wiring up
imports, schemas, and a `ModelStore` by hand.

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

A **namespace** is a directory path under `models/`: the namespace
`com.example` is the directory `models/com/example/`, and namespaces nest to
any depth. A model is addressed by its **ref**, `<namespace>/<name>` — e.g.
`com.example/persons` for `models/com/example/persons.tsx`. Ref and disk
location are mechanically derivable from each other, so the ref itself is
never stored in the file and cannot drift.

## Models are code

A workspace model is a `.tsx` module — JSX that renders into a model when
executed — not a JSON data file:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@synthesis/jsx-runtime'
import type { ExprNode } from '@synthesis/jsx-runtime'
import type { ModelStore } from '@synthesis/engine'
import { EERSchema, Entity, Attribute, Domain } from '@synthesis/standard-metamodels/eer'

export const $synth = {
  kind: 'model',
  metamodel: '@synthesis/standard-metamodels/eer',
  references: {},
  author: 'Jane Doe <jane@example.org>',
  version: '0.1.0',
  description: 'Persons EER schema'
} as const

export default (store: ModelStore) => (
  <EERSchema name="Persons" MDA_level="M1" store={store}>
    <Entity name="Person">
      <Attribute name="personId" isKey={true}>
        <Domain name="number" />
      </Attribute>
    </Entity>
  </EERSchema>
)
```

Every workspace model carries an exported `$synth` header — a pure literal
constant that is **written and maintained by the tools** (`model import`,
`transformation run`, `config init`), never required from humans. A
hand-authored file without a header gets one derived at import.

| Field | Maintained by | Meaning |
|---|---|---|
| `kind` | tools | `model`, `metamodel`, `decision-model`, `binding-model`, or `configuration-model` |
| `metamodel` | tools | package of the metamodel the content instantiates |
| `references` | tools | map of workspace refs this model depends on (e.g. `sourceModel`) |
| `generatedBy` | tools | `{ tx, txVersion, config, date }` provenance when produced by a run; `null` for authored models |
| `createdAt` / `modifiedAt` | tools | ISO dates, maintained on import and write |
| `author` | you (flags) | defaults from `git config user.name` / `user.email`, override with `--author` |
| `version` | you (flags) | the model's own semver, default `0.1.0` |
| `description` | you (flags) | one line, shown in `model ls` and pickers |
| `tags` | you (flags) | string list for search and filtering |

Commands like `model ls`, `doctor`, and shell completion read the header with
a fast static parse; `model import` and `transformation run` read it
authoritatively after loading the module and cross-check it against the
rendered content (`doctor` reports disagreements, `doctor --fix` re-derives).

## Canonical names and typing aliases

Every command is `synth <resource> <verb>`. Each resource topic has a
full-word **canonical** name — the one used in help, documentation, and error
hints — and the three long ones also have a two-letter **typing alias**, a
pure shortcut with identical behavior:

| Resource | Canonical topic | Alias |
|---|---|---|
| transformation | `transformation` | `tx` |
| namespace | `namespace` | `ns` |
| pipeline | `pipeline` | `pl` |
| model | `model` | — |
| config | `config` | — |
| workspace | `workspace` | — |
| example | `example` | — |

`synth tx run` and `synth transformation run` are the same command.

## Quick start

The session below goes from an empty workspace to generated SQL. The two
transformation packages are placeholders — `synth transformation install`
accepts any npm name, git URL, local directory, or tarball that contains a
transformation package (see
[Packaging Transformations](./packaging-transformations)); here
`eer-to-relational` (model-to-model) and `rel-to-sql-ddl` (model-to-text) are
assumed to be installable from local directories.

```bash
# Create the workspace at ~/.synth
synth init

# Create a namespace and import a model through the validation gate
synth namespace mk com.example
synth model import ./persons.tsx --as com.example/persons

# Install the transformations
synth transformation install ./eer-to-relational
synth transformation install ./rel-to-sql-ddl

# See what a transformation declares (kind, metamodels, open decisions)
synth transformation show eer-to-relational

# Run EER -> relational. The transformation is decision-based, so consent
# is explicit: --default-configs accepts the generated default decisions,
# and every applied default is announced in the output.
synth transformation run eer-to-relational --in com.example/persons \
  --default-configs --out com.example/persons-rel

# Generate SQL DDL files from the relational model
synth transformation run rel-to-sql-ddl --in com.example/persons-rel \
  --default-configs --out-dir ./generated
```

The two runs also work as one **chain** — the intermediate model is handed
from step to step in memory:

```bash
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --default-configs --out-dir ./generated
```

To steer the decisions instead of accepting defaults, generate an editable
configuration model with `synth config init` and pass it with `--config` —
see [Configurations](./configurations). To give a chain a name and replay it
on other models, save it as a pipeline — see [Pipelines](./pipelines).

## Interactive by default, strict in scripts

In a terminal, `synth` helps you fill in what you left out: a bare
`synth transformation run` opens a picker over the installed transformations,
then over the models matching its source metamodel, then asks explicitly how
to handle open decisions. Piped, scripted, `--json`, `--quiet`, and CI
invocations never prompt — they fail with the same strict errors a script can
rely on. Shell completion for values (transformation names, refs, pipeline
names) is available after a one-time setup — see
[Installation](./installation#shell-completion).

## Two kinds of users

- **Consumers** — install transformations, import models, run
  transformations and pipelines against their data. Most users start here.
- **Authors** — scaffold a transformation project
  (`synth transformation init`), implement and build it, pack or publish it.
  See [Packaging Transformations](./packaging-transformations) for the
  manifest and the full workflow.

## Next

- [Installation](./installation) — tarball install, shell completion.
- [Command Reference](./commands) — every command, grouped by resource.
- [Configurations](./configurations) — the decision workflow.
- [Pipelines](./pipelines) — named, replayable transformation chains.
- [Packaging Transformations](./packaging-transformations) — authoring.
