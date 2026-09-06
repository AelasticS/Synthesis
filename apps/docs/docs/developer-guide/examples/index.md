---
sidebar_position: 4
---

# Examples

The repository ships a catalog of complete, installable transformation
packages under `examples/`. Each one is shaped exactly like a package a
transformation author would publish: its own `package.json`, a
`synth.json` manifest, TypeScript sources built with plain `tsc`, a
sample input model, and a README that walks through what it
demonstrates and how to run it. Every example is smoke tested through
the real CLI by the repository's gate ladder before each merge, so the
catalog stays executable truth rather than prose.

Packages are grouped by suite, because that is where metamodels are
shared: every suite owns its metamodels in a `metamodels/` folder, and
its examples depend on them like any other dependency. A metamodel
package owns all its facets under one convention: the bare package
exports the JSX components, `/model` the type schemas, and `/as-model`
the metamodel-as-model factory that manifests reference in `parts`.

## The tutorial suite

Each part of both tutorials has its own complete package under
`examples/tutorial/`, which is the finished state of that part. All
seven companions pivot on `rel-tutorial-metamodel`: the model-to-model
parts target it, and the model-to-text parts read from it. The suite's
`metamodels/` folder holds `eer-tutorial-metamodel` (the teaching EER
stages, `basic`, `advanced`, and `name-scopes`) and
`rel-tutorial-metamodel` (the flat base plus a `name-scopes` stage).

From the [model-to-model tutorial](../tutorial/model-to-model/index.md):

| Example | Kind | What it shows |
| --- | --- | --- |
| `examples/tutorial/eer-tutorial-basic` | m2m | Part 1: a simple EER to relational transformation with fixed logic. |
| `examples/tutorial/eer-tutorial-advanced` | m2m | Part 2: the entity rule specialized per entity subtype with `@SpecPoint` and `@SpecOption`. |
| `examples/tutorial/eer-tutorial-configuration-based` | m2m | Part 3: the relationship mapping decided by a configuration model. |
| `examples/tutorial/eer-tutorial-name-scopes` | m2m | Part 4: Part 1's transformation on name-scoped metamodel stages, with natural names and path references. |

From the [model-to-text tutorial](../tutorial/model-to-text/index.md):

| Example | Kind | What it shows |
| --- | --- | --- |
| `examples/tutorial/sql-tutorial-basic` | m2t | Part 1: a relational schema becomes one SQL DDL file. |
| `examples/tutorial/sql-tutorial-structured` | m2t | Part 2: named sections, and output split across two files so constraints are applied after the tables exist. |
| `examples/tutorial/sql-tutorial-configuration-based` | m2t | Part 3: the file layout and identifier quoting chosen by configuration. |

## The full-example suite

Larger packages under `examples/eer-to-sql/` that stand on their own
rather than teaching one concept at a time. The two form a chain:
`eer-to-relational` produces exactly what `rel-to-sql-ddl` consumes.
The suite's `metamodels/` folder holds `eer-metamodel` (the full EER
metamodel) and `relational-metamodel` (the full relational one).

| Example | Kind | What it shows |
| --- | --- | --- |
| `examples/eer-to-sql/eer-to-relational` | m2m | The flagship: full EER semantics (aggregations with the cardinality key rule, integrity rules, user-defined domains, multivalued and composite attributes), every template kind, seven design issues, verified outputs and traces. See [the mapping rules](./flagship-mapping-rules.md). |
| `examples/eer-to-sql/rel-to-sql-ddl` | m2t | DDL from the rich content: named keys and constraints with referential actions, domains, trigger stubs, physical clustering, and dialects as extension-authored preset configurations. |

## Running an example

Every example follows the same loop, spelled out in its README. For the
Part 1 companion:

```bash
cd examples/tutorial/eer-tutorial-basic

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-basic --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

## Conventions

- `synth.json` at the package root is the transformation manifest, the
  only supported location.
- Manifest `entry` points into `dist/` (the `tsc` output) with a
  package-relative path; `files` ships `dist` and `synth.json`. In
  `parts`, the transformation's own decision and binding models are
  `dist/` paths too, while metamodel-as-model entries are the metamodel
  packages' `as-model` subpaths.
- Metamodel packages are declared as ordinary dependencies of the
  examples that use them, which is how the CLI resolves them at run
  time.
- Sample input models live under `sample/`, importable with
  `synth model import`.
- Each example's `test` script runs the shared smoke harness
  (`examples/smoke.mjs`), which installs the package into an isolated
  workspace and executes a real run.

The catalog grows incrementally, and `examples/README.md` in the
repository is its index. For starting a package of your own, the
repository also provides `templates/transformation-template`, a working
starter with the same shape as these examples, complementing
`synth transformation init`.
