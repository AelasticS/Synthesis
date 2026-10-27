---
sidebar_position: 3
---

# Quick Start

The session below goes from an empty workspace to generated SQL. It assumes
`synth` is [installed](./installation.md). `synth transformation install`
takes a local directory containing a built transformation package (see
[Packaging Transformations](../../developer-guide/guides/packaging-transformations.md)).
The two used here, `eer-to-relational` (model-to-model) and
`rel-to-sql-ddl` (model-to-text), ship with `synth` together with all the
other [examples](../../developer-guide/examples/index.md), in the
`examples` folder of the installation. The sample model comes from there
too.

```bash
# Where the examples are: /usr/local/synth/examples on Linux and macOS,
# in Windows PowerShell: $EX = 'C:\synth\examples'
EX=/usr/local/synth/examples

# Create the workspace at ~/.synth
synth init

# Install the transformations first: the sample model's metamodel
# comes with them
synth transformation install $EX/eer-to-relational
synth transformation install $EX/rel-to-sql-ddl

# Create a namespace and import a model through the validation gate
synth namespace mk com.example
synth model import $EX/eer-to-relational/sample/library.eer.tsx --as com.example/library

# See what a transformation declares (kind, metamodels, decision model)
synth transformation show eer-to-relational

# Run EER -> relational. The transformation is configuration-based, so consent
# is explicit: --default-configs accepts the generated default decisions,
# and every applied default is announced in the output.
synth transformation run eer-to-relational --in com.example/library \
  --default-configs --out com.example/library-rel

# Generate SQL DDL files from the relational model
synth transformation run rel-to-sql-ddl --in com.example/library-rel \
  --default-configs --out-dir ./generated
```

The two runs also work as one **chain**, where the intermediate model is handed
from step to step in memory:

```bash
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in com.example/library --default-configs --out-dir ./generated
```

To remove a transformation later, use its name, not its path or version:

```bash
synth transformation uninstall rel-to-sql-ddl
```

The commands work the same in PowerShell. Only the line breaks differ:
write a command on one line, or end its lines with a backtick instead of
`\`.

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
