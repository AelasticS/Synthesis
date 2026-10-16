---
sidebar_position: 4
---

# Examples

The repository ships a catalog of complete, installable transformation
packages under
[`examples/`](https://github.com/AelasticS/Synthesis/tree/main/examples).
Each one is shaped exactly like a package a
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
[`examples/tutorial/`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial),
which is the finished state of that part. All
seven companions pivot on
[`rel-tutorial-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/rel-tutorial):
the model-to-model
parts target it, and the model-to-text parts read from it. The suite's
`metamodels/` folder holds
[`eer-tutorial-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/metamodels/eer-tutorial)
(the teaching EER
stages, `basic`, `advanced`, and `name-scopes`) and
`rel-tutorial-metamodel` (the flat base plus a `name-scopes` stage).

From the [model-to-model tutorial](../tutorial/model-to-model/index.md):

| Example | Kind | What it shows |
| --- | --- | --- |
| [`examples/tutorial/eer-tutorial-basic`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-basic) | m2m | Part 1: a simple EER to relational transformation with fixed logic. |
| [`examples/tutorial/eer-tutorial-advanced`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-advanced) | m2m | Part 2: the entity rule specialized per entity subtype with `@SpecPoint` and `@SpecOption`. |
| [`examples/tutorial/eer-tutorial-configuration-based`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-configuration-based) | m2m | Part 3: the relationship mapping decided by a configuration model. |
| [`examples/tutorial/eer-tutorial-name-scopes`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/eer-tutorial-name-scopes) | m2m | Part 4: Part 1's transformation on name-scoped metamodel stages, with natural names and path references. |

From the [model-to-text tutorial](../tutorial/model-to-text/index.md):

| Example | Kind | What it shows |
| --- | --- | --- |
| [`examples/tutorial/sql-tutorial-basic`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/sql-tutorial-basic) | m2t | Part 1: a relational schema becomes one SQL DDL file. |
| [`examples/tutorial/sql-tutorial-structured`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/sql-tutorial-structured) | m2t | Part 2: named sections, and output split across two files so constraints are applied after the tables exist. |
| [`examples/tutorial/sql-tutorial-configuration-based`](https://github.com/AelasticS/Synthesis/tree/main/examples/tutorial/sql-tutorial-configuration-based) | m2t | Part 3: the file layout and identifier quoting chosen by configuration. |

## The full-example suite

Larger packages under
[`examples/advanced-eer-to-sql/`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql)
that stand on their own
rather than teaching one concept at a time. Two form a chain:
`eer-to-relational` produces exactly what `rel-to-sql-ddl` consumes.
Two diagram views bracket it: `eer-to-mermaid-er` is a sibling view
over the same EER source, and `rel-to-mermaid` draws the produced
relational schema.
The suite's `metamodels/` folder holds
[`eer-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/metamodels/eer)
(the full EER
metamodel) and
[`relational-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/metamodels/relational)
(the full relational one).

| Example | Kind | What it shows |
| --- | --- | --- |
| [`examples/advanced-eer-to-sql/eer-to-relational`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/eer-to-relational) | m2m | The full-featured EER to relational mapping: full EER semantics (aggregations with the cardinality key rule, integrity rules, user-defined domains, composite attributes, row history as a composite design option), every template kind, nine design issues, verified outputs and traces. See [the suite page](./advanced-eer-to-sql.md). |
| [`examples/advanced-eer-to-sql/rel-to-sql-ddl`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/rel-to-sql-ddl) | m2t | DDL from the rich content: named keys and constraints with referential actions, domains, trigger stubs, physical clustering, and dialects as extension-authored preset configurations. |
| [`examples/advanced-eer-to-sql/eer-to-mermaid-er`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/eer-to-mermaid-er) | m2t | The ER diagram view of the same source metamodel: Mermaid `erDiagram` text with attribute blocks for every entity kind and the identifying/non-identifying line conventions; fixed logic, run without configuration flags. |
| [`examples/advanced-eer-to-sql/rel-to-mermaid`](https://github.com/AelasticS/Synthesis/tree/main/examples/advanced-eer-to-sql/rel-to-mermaid) | m2t | The diagram of the mapping's output: Mermaid `erDiagram` text over the produced relational schema, chained after `eer-to-relational` so different configurations of the same source become [visibly different diagrams](./advanced-eer-to-sql.md#one-source-three-configurations); fixed logic, run without configuration flags. |

## The workflow suite

Packages under
[`examples/workflow/`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow):
three suite-owned metamodels
([`workflow-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/metamodels/workflow)
for block-structured workflow models, process
trees,
graph-based
[`bpmn-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/metamodels/bpmn),
and
[`org-metamodel`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/metamodels/org)
for organizational
hierarchies), a chain of two transformations over
them, a flowchart view of the source, and a parameterized
organizational example feeding the same chain, explained on
[the suite page](./workflow.md).

| Example | Kind | What it shows |
| --- | --- | --- |
| [`examples/workflow/workflow-to-mermaid`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/workflow-to-mermaid) | m2t | The flowchart view: the workflow model drawn as a classic flowchart wired start to end, decision diamonds asking the guards with labeled else edges, loop back edges, fork and join bars for parallels, subroutine boxes for invocations; fixed logic, run without configuration flags. |
| [`examples/workflow/workflow-to-bpmn`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/workflow-to-bpmn) | m2m | The workflow model flattened into a node-and-flow graph: the fragment contract (an entry and an exit per step), gateway pairs for parallels, choices, and loops, and invocations expanded as occurrence-named tasks and embedded sub-processes. |
| [`examples/workflow/bpmn-to-mermaid`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/bpmn-to-mermaid) | m2t | The graph rendered as Mermaid flowchart text, node lines by specialization, sub-processes as subgraphs. |
| [`examples/workflow/org-to-approval`](https://github.com/AelasticS/Synthesis/tree/main/examples/workflow/org-to-approval) | m2m | An approval workflow derived from an organizational hierarchy, parameterized by `--param '{"worker":...,"sensitivity":...}'` through the engine's parameter channel (recorded verbatim in the output's provenance): the worker's unit chain unfolds upward, a department approves through its manager, a board in parallel through its members. |

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
repository also provides
[`templates/transformation-template`](https://github.com/AelasticS/Synthesis/tree/main/templates/transformation-template),
a working
starter with the same shape as these examples, complementing
`synth transformation init`.
