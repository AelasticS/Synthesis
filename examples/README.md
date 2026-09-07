# Synthesis examples

Complete, installable transformation packages. Each example is shaped
exactly like a package a transformation author would publish: its own
`package.json`, a `synth.json` manifest, TypeScript sources built with
plain `tsc`, and a README explaining what it demonstrates and how to run
it with the `synth` CLI.

The examples are Rush projects (built against the workspace by the
repository gate), but they deliberately carry no monorepo tooling
beyond that: no heft,
no rigs. Any example directory can be read, copied, or extracted as a
standalone starting point, together with the metamodel packages it
depends on.

## Layout

Packages are grouped by suite, because that is where metamodels are
shared: every suite owns its metamodels in a `metamodels/` folder, and
its examples depend on them like any other dependency.

```text
examples/
  tutorial/            the tutorial suite
    metamodels/
      eer-tutorial/    package eer-tutorial-metamodel: the teaching EER stages (basic, advanced, name-scopes)
      rel-tutorial/    package rel-tutorial-metamodel: the simple relational model, the tutorial's pivot (flat base plus a name-scopes stage)
    eer-tutorial-*     model-to-model tutorial companions
    sql-tutorial-*     model-to-text tutorial companions
  eer-to-sql/          the full-example suite, a chain and its diagram views
    metamodels/
      eer/             package eer-metamodel: the full EER metamodel
      relational/      package relational-metamodel: the full relational metamodel
    eer-to-relational/
    rel-to-sql-ddl/
    eer-to-mermaid-er/
    rel-to-mermaid/
  workflow/            the workflow suite, a chain and its structure view
    metamodels/
      workflow/        package workflow-metamodel: process trees (block-structured)
      bpmn/            package bpmn-metamodel: simplified graph-based BPMN
    workflow-to-mermaid/
    workflow-to-bpmn/
    bpmn-to-mermaid/
  smoke.mjs            the harness every example's test script runs
```

A metamodel package owns all its facets under one convention: the bare
package exports the JSX components, `/model` the type schemas, and
`/as-model` the metamodel-as-model factory that manifests reference in
`parts`. Manifest `source`/`target.metamodel` strings are these package
specifiers, and they are what the CLI's chain type-check compares.

## Catalog

### Tutorial suite

Every part of the tutorials has its own complete, independent package.
Each one is the finished state of that part, so it doubles as the answer
key while you follow along. The model-to-text tutorial picks up where
the model-to-model one leaves off: its sample model is what
eer-tutorial-basic generates, and all seven companions pivot on
rel-tutorial-metamodel.

| Example | Kind | Shows |
| --- | --- | --- |
| [eer-tutorial-basic](./tutorial/eer-tutorial-basic/) | m2m | Part 1: simple EER to relational with fixed logic |
| [eer-tutorial-advanced](./tutorial/eer-tutorial-advanced/) | m2m | Part 2: entity rule specialization with `@SpecPoint` and `@SpecOption` |
| [eer-tutorial-configuration-based](./tutorial/eer-tutorial-configuration-based/) | m2m | Part 3: relationship mapping decided by a configuration model |
| [eer-tutorial-name-scopes](./tutorial/eer-tutorial-name-scopes/) | m2m | Part 4: Part 1 on name-scoped metamodel stages, natural names and path references |
| [sql-tutorial-basic](./tutorial/sql-tutorial-basic/) | m2t | Text Part 1: relational schema to one SQL DDL file |
| [sql-tutorial-structured](./tutorial/sql-tutorial-structured/) | m2t | Text Part 2: named sections and one file per document |
| [sql-tutorial-configuration-based](./tutorial/sql-tutorial-configuration-based/) | m2t | Text Part 3: output layout and identifier quoting decided by a configuration model |

### Full-example suite

Larger packages that stand on their own rather than teaching one concept
at a time. Two form a chain: eer-to-relational produces exactly what
rel-to-sql-ddl consumes. Two diagram views bracket it:
eer-to-mermaid-er is a sibling view over the same EER source, and
rel-to-mermaid draws the produced relational schema.

| Example | Kind | Shows |
| --- | --- | --- |
| [eer-to-relational](./eer-to-sql/eer-to-relational/) | m2m | The full-featured EER to relational mapping: full EER semantics (aggregations with the cardinality key rule, integrity rules, user-defined domains, composite attributes, row history as a composite design option), every template kind, nine design issues, a rich relational target with first-class keys, verified outputs and traces |
| [rel-to-sql-ddl](./eer-to-sql/rel-to-sql-ddl/) | m2t | DDL from the rich content: named keys and constraints with referential actions, domains, trigger stubs, physical clustering, and dialects as extension-authored preset configurations |
| [eer-to-mermaid-er](./eer-to-sql/eer-to-mermaid-er/) | m2t | The ER diagram view of the same source metamodel: Mermaid erDiagram text with attribute blocks for every entity kind and the identifying/non-identifying line conventions; fixed logic, run without configuration flags |
| [rel-to-mermaid](./eer-to-sql/rel-to-mermaid/) | m2t | The diagram of the mapping's output: Mermaid erDiagram text over the produced relational schema, chained after eer-to-relational so different configurations of the same source become visibly different diagrams; fixed logic, run without configuration flags |

### Workflow suite

The documentation's workflow domain, executable: a chain from process
trees (block-structured) to BPMN graphs to Mermaid diagrams, plus a
structure view drawing the tree itself. See
[the suite README](./workflow/).

| Example | Kind | Shows |
| --- | --- | --- |
| [workflow-to-mermaid](./workflow/workflow-to-mermaid/) | m2t | The process tree drawn as a Mermaid flowchart of nested subgraphs, one per composite activity; the suite's structure view |
| [workflow-to-bpmn](./workflow/workflow-to-bpmn/) | m2m | The process tree flattened into a node-and-flow graph by specialization rules |
| [bpmn-to-mermaid](./workflow/bpmn-to-mermaid/) | m2t | The graph rendered as Mermaid flowchart text, sub-processes as subgraphs |

Further examples (text generation from EER models,
TypeScript declarations, pipeline composition) are under discussion and
will be added as they are agreed. The catalog grows incrementally; each
suite is self-contained, so new domains can be added at any time.

## Conventions

- `synth.json` at the package root is the transformation manifest, the
  only supported location.
- `entry` points into `dist/` (the `tsc` output); `files` lists `dist`
  and `synth.json` so a published package stays installable.
- Dependencies on `@aelastics/*` packages and on metamodel packages use
  `workspace:*` ranges; on extraction to a standalone repository these
  become version ranges.
- An example that needs an input model ships one under `sample/`,
  importable via `synth model import`.
- Every example is smoke tested through the real CLI: its `test` script
  runs [smoke.mjs](./smoke.mjs), which installs the package into an
  isolated workspace, imports the sample models (after the install, so
  the metamodel packages resolve through the installed transformation),
  and executes one run (with default configurations when the package is
  configuration-based). The repository's gate ladder runs every
  example's smoke before each merge, so the catalog stays executable
  truth rather than prose.
