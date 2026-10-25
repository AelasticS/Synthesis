---
sidebar_position: 3
---

# Quick Start

The session below goes from an empty workspace to generated SQL. It assumes
`synth` is [installed](./installation.md). `synth transformation install`
takes a local directory containing a built transformation package (see
[Packaging Transformations](../../developer-guide/guides/packaging-transformations.md));
the two used here, `eer-to-relational` (model-to-model) and `rel-to-sql-ddl`
(model-to-text), ship in the repository under
[`examples/eer-database-suite/`](https://github.com/AelasticS/Synthesis/tree/main/examples/eer-database-suite),
and
any built example package installs the same way.

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

# Run EER -> relational. The transformation is configuration-based, so consent
# is explicit: --default-configs accepts the generated default decisions,
# and every applied default is announced in the output.
synth transformation run eer-to-relational --in com.example/persons \
  --default-configs --out com.example/persons-rel

# Generate SQL DDL files from the relational model
synth transformation run rel-to-sql-ddl --in com.example/persons-rel \
  --default-configs --out-dir ./generated
```

The two runs also work as one **chain**, where the intermediate model is handed
from step to step in memory:

```bash
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/persons --default-configs --out-dir ./generated
```

## Next

- The [Tutorial](../tutorial.md) repeats this journey end to end, with
  explanations at every step.
- To steer the decisions instead of accepting defaults, generate an editable
  configuration model with `synth config init` and pass it with `--config`;
  see [Configurations](../guides/configurations.md).
- To give a chain a name and replay it on other models, save it as a
  pipeline; see [Pipelines](../guides/pipelines.md).
- [Concepts](../concepts.md) explains the workspace, refs, and the consent
  policy behind `--default-configs`.
