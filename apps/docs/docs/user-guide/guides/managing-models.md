---
sidebar_position: 1
---

# Managing Models

This guide covers the lifecycle of models in the workspace: what a model
file is, how models enter through the import gate, how to inspect and
validate them, and how deletion is protected by the dependency graph. Exact
flags for every command are in the
[Command Reference](../reference/commands.md#models).

## Models are code

A workspace model is a `.tsx` module (JSX that renders into a model when
executed), not a JSON data file:

```tsx
/** @jsx createExprNode */

import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import type { ModelStore } from '@aelastics/synthesis/store'
import type { SynthHeaderInput } from '@aelastics/synthesis/envelope'
import { EERSchema, Entity, Attribute, Domain } from 'eer-metamodel'

export const $synth = {
  kind: 'model',
  metamodel: 'eer-metamodel',
  references: {},
  author: 'Jane Doe <jane@example.org>',
  version: '0.1.0',
  description: 'Persons EER schema'
} as const satisfies SynthHeaderInput

export default (store: ModelStore) => (
  <EERSchema name="Persons" store={store}>
    <Entity name="Person">
      <Attribute name="personId" isKey={true}>
        <Domain name="number" />
      </Attribute>
    </Entity>
  </EERSchema>
)
```

Every workspace model carries an exported `$synth` header, a pure literal
constant that is **written and maintained by the tools** (`model import`,
`transformation run`, `config init`), never required from humans. A
hand-authored file without a header gets one derived at import.

The header's shape is published as shared TypeScript types by the library's
`@aelastics/synthesis/envelope` subpath. `SynthHeaderInput` is the authored
form: only `kind` and `metamodel` are required, every other field is
optional and defaulted at import. Author the header as
`as const satisfies SynthHeaderInput` with a type-only import, as in the
snippet above; the compiler then checks field names, field types, and the
allowed `kind` values while the literal keeps its exact type. The import is
type-only, so it is erased at compile time and never affects rendering, and
the tools keep both the import and the `satisfies` clause when they stamp
the file. `SynthHeader`, from the same subpath, is the normalized full form
the tools maintain in the workspace copy.

| Field | Authored | Maintained by | Meaning |
|---|---|---|---|
| `kind` | required | tools | one of `model`, `metamodel`, `decision-model`, `binding-model`, `configuration-model` |
| `metamodel` | required | tools | package of the metamodel the content instantiates |
| `references` | optional | tools | map of workspace refs this model depends on (e.g. `sourceModel`) |
| `generatedBy` | optional | tools | `{ tx, txVersion?, config?, param?, date }` provenance when produced by a run; `null` for authored models |
| `createdAt` / `modifiedAt` | optional | tools | ISO dates, maintained on import and write |
| `author` | optional | you (flags) | defaults from `git config user.name` / `user.email`, override with `--author` |
| `version` | optional | you (flags) | the model's own semver, default `0.1.0` |
| `description` | optional | you (flags) | one line, shown in `model ls` and pickers |
| `tags` | optional | you (flags) | string list for search and filtering |
| `license` | optional | you | license string, or `null` when unset |
| `custom` | optional | you | free-form object for your own metadata |

Commands like `model ls`, `doctor`, and shell completion read the header with
a fast static parse; `model import` and `transformation run` read it
authoritatively after loading the module and cross-check it against the
rendered content (`doctor` reports disagreements, `doctor --fix` re-derives).

## Importing: the validation gate

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

## Inspecting and validating

```bash
synth model ls                    # all models with header metadata
synth model ls --ns com.example   # filtered to one namespace
synth model show com.example/persons       # header and file location
synth model validate com.example/persons   # render for real, check metamodel
```

`model validate` also runs the metamodel's declared constraints: a
metamodel may attach semantic rules to its concepts (an aggregation
relates at least two participants, a relationship is binary,
identification dependencies such as weak ownership, aggregation
participation, and subtyping must not cycle, even combined), and
validation reports each violation with the rule's own message. A model can import fine and still fail here,
because importing only proves the model renders, while constraints
judge the finished content. `model validate` also accepts
`--against <metamodel>` to assert the header declares a specific
metamodel. Configuration models reference their
transformation's decision and binding models, which live in the installed
package rather than the workspace; pass `--tx <name>` so the validation
render pre-loads the package's parts.

`synth doctor` re-checks the import-gate invariant workspace-wide;
`doctor --fix` re-derives missing or unparseable headers through the same
code path as `model import`.

## Organizing with namespaces

```bash
synth namespace ls                # list all namespaces
synth namespace mk com.example    # create (dot-separated segments)
synth namespace rm com.example    # remove; must be empty unless --force
```

`namespace rm --cascade` additionally deletes every model **outside** the
namespace that transitively references a model inside it (implies
`--force`).

## Exporting

`synth model export <ref> [--to <file>]` writes a model out to disk,
verbatim, header included: the counterpart of `model import` for sharing a
model outside the workspace.

Export is also how you read the content of a model, for example one a
transformation generated: `model show` prints only the header, so export the
model and open the file:

```bash
synth model export com.example/persons-rel --to ./persons-rel.tsx
```

## Deleting and the dependency graph

Deletion is protected by the reverse-dependency graph built from `$synth`
headers: `synth model rm <ref>` is **refused** while any other model
transitively references the target, and the refusal lists the dependent
models. `--cascade` deletes the target together with every model that
transitively references it. `config rm` has the same semantics for
configuration models.

## Next

- [Configurations](./configurations.md): configuration-based transformations and
  the configuration models that steer them.
- [Pipelines](./pipelines.md): naming and replaying transformation chains.
