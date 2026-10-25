# sql-tutorial-configuration-based

Companion package of the model-to-text tutorial, Part 3: the layout
of the generated text becomes a decision. Two global issues are on
offer, `OutputLayout` (`SingleFile`, `TablesAndConstraints`, or
`FilePerTable`) and `IdentifierQuoting` (`Unquoted` or
`DoubleQuoted`), each a `@VarPoint` closed per run by a configuration
model. The source is `rel-tutorial-metamodel`, the target `text`, and
the manifest's `parts` list the decision model, the binding model,
and the metamodel-as-model rendered into the store before every run.

## Run

```bash
npm run build   # from the repository root: rush build -t sql-tutorial-configuration-based

synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/schema
synth transformation install .

# the defaults: TablesAndConstraints, Unquoted
synth transformation run sql-tutorial-configuration-based --in demo/schema \
  --default-configs --out-dir ./generated

# choose differently: generate a configuration, edit it, run with it
synth config init sql-tutorial-configuration-based --for demo/schema
synth transformation run sql-tutorial-configuration-based --in demo/schema \
  --config demo/schema-cfg --out-dir ./generated
```

`npm test` runs the CLI smoke: install and one real run with default
configurations in an isolated workspace.

This package is the finished state of
[Part 3 of the model-to-text tutorial](https://AelasticS.github.io/Synthesis/developer-guide/tutorial/model-to-text/part-3-configuration-based),
which explains the design space and what each layout produces.
