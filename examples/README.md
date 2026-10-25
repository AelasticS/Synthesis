# Synthesis examples

Complete, installable transformation packages. Each example is shaped
exactly like a package a transformation author would publish: its own
`package.json`, a `synth.json` manifest, TypeScript sources built with
plain `tsc`, and a README with its usage loop. Any example directory
can be read, copied, or extracted as a standalone starting point,
together with the metamodel packages it depends on. The catalog is
presented on the docs site as
[the examples index](https://AelasticS.github.io/Synthesis/developer-guide/examples),
which also spells out the package conventions.

## Layout

Packages are grouped by suite, because that is where metamodels are
shared: every suite owns its metamodels in a `metamodels/` folder, and
its examples depend on them like any other dependency. Each suite
folder's README lists its members.

```text
examples/
  tutorial/            the tutorial suite: metamodels/ plus the
                       eer-tutorial-* and sql-tutorial-* companions
  simple-eer-to-sql/   the compact suite: metamodels/ plus one
                       configuration-based transformation
  advanced-eer-to-sql/ the full-example suite: metamodels/ plus a
                       configuration-based chain and its diagram views
  workflow/            the workflow suite: metamodels/ plus a chain,
                       its flowchart view, and the organizational example
  smoke.mjs            the harness every example's test script runs
```

## Catalog

### The tutorial suite

Every part of both tutorials has its own complete, independent package,
the finished state of that part. See [the suite README](./tutorial/).

| Example | Kind | What it shows |
| --- | --- | --- |
| [eer-tutorial-basic](./tutorial/eer-tutorial-basic/) | m2m | Part 1: simple EER to relational with fixed logic. |
| [eer-tutorial-advanced](./tutorial/eer-tutorial-advanced/) | m2m | Part 2: the entity rule specialized with `@SpecPoint` and `@SpecOption`. |
| [eer-tutorial-configuration-based](./tutorial/eer-tutorial-configuration-based/) | m2m | Part 3: the relationship mapping decided by a configuration model. |
| [eer-tutorial-name-scopes](./tutorial/eer-tutorial-name-scopes/) | m2m | Part 4: Part 1 on name-scoped metamodel stages, natural names and path references. |
| [sql-tutorial-basic](./tutorial/sql-tutorial-basic/) | m2t | Text Part 1: a relational schema becomes one SQL DDL file. |
| [sql-tutorial-structured](./tutorial/sql-tutorial-structured/) | m2t | Text Part 2: named sections and one file per document. |
| [sql-tutorial-configuration-based](./tutorial/sql-tutorial-configuration-based/) | m2t | Text Part 3: output layout and identifier quoting decided by a configuration model. |

### The full-example suite

Larger packages that stand on their own rather than teaching one
concept at a time. See [the suite README](./advanced-eer-to-sql/).

| Example | Kind | What it shows |
| --- | --- | --- |
| [eer-to-relational](./advanced-eer-to-sql/eer-to-relational/) | m2m | The full-featured EER to relational mapping: full EER semantics, every template kind, nine design issues, a rich relational target, verified outputs and traces. |
| [rel-to-sql-ddl](./advanced-eer-to-sql/rel-to-sql-ddl/) | m2t | DDL from the rich content: named keys and constraints with referential actions, domains, trigger stubs, and dialects as preset configurations. |
| [eer-to-mermaid-er](./advanced-eer-to-sql/eer-to-mermaid-er/) | m2t | The ER diagram view of the same EER source as Mermaid `erDiagram` text; fixed logic. |
| [rel-to-mermaid](./advanced-eer-to-sql/rel-to-mermaid/) | m2t | The diagram of the mapping's output, chained after `eer-to-relational` so different configurations become visibly different diagrams; fixed logic. |

### The compact EER to relational suite

The small sibling of the full-example suite: two compact metamodels and
one configuration-based transformation with three design issues. See
[the suite README](./simple-eer-to-sql/).

| Example | Kind | What it shows |
| --- | --- | --- |
| [eer-to-relational](./simple-eer-to-sql/eer-to-relational/) | m2m | The whole configuration-based pattern at small scale: a decision model, a binding model, `@VarPoint` / `@VarOption` / `@Default` methods, a default and an edited configuration, verified outputs and traces. |

### The workflow suite

A chain from block-structured workflow models (process trees) to BPMN
graphs to Mermaid diagrams, plus a flowchart view drawing the source
directly. See [the suite README](./workflow/).

| Example | Kind | What it shows |
| --- | --- | --- |
| [workflow-to-mermaid](./workflow/workflow-to-mermaid/) | m2t | The workflow model drawn as a classic flowchart, the suite's flowchart view; fixed logic. |
| [workflow-to-bpmn](./workflow/workflow-to-bpmn/) | m2m | The workflow model flattened into a node-and-flow graph by specialization rules. |
| [bpmn-to-mermaid](./workflow/bpmn-to-mermaid/) | m2t | The graph rendered as Mermaid flowchart text, sub-processes as subgraphs. |
| [org-to-approval](./workflow/org-to-approval/) | m2m | An approval workflow derived from an organizational hierarchy, parameterized by `--param` (recorded in the output's provenance). |

The catalog grows incrementally; each suite is self-contained, so new
domains can be added at any time.

## Testing

Every example is smoke tested through the real CLI: its `test` script
runs [smoke.mjs](./smoke.mjs), which installs the package into an
isolated workspace, imports the sample models, and executes one run
(with default configurations when the package is configuration-based).
The repository's gate ladder runs every example's smoke before each
merge, so the catalog stays executable truth rather than prose.
