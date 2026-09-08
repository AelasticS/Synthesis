# eer-tutorial-name-scopes

Companion package of the model-to-model tutorial, Part 4: Part 1's
fixed-logic transformation moved onto the name-scopes stages of both
tutorial metamodels (`eer-tutorial-metamodel/name-scopes` to
`rel-tutorial-metamodel/name-scopes`). The mapping rules are
unchanged, the naming world is not: `Entity` and `Table` are declared
name scopes, so the sample carries natural names (all three keys are
`id`), foreign key columns take the referenced entity's name as their
prefix (`authorId`), and references into another table's scope are
paths (`Author/id`).

## Run

```bash
npm run build   # from the repository root: rush build -t eer-tutorial-name-scopes

synth init
synth namespace mk demo
synth model import sample/library.tsx --as demo/library

synth transformation install .
synth transformation run eer-tutorial-name-scopes --in demo/library --out demo/library-rel
synth model show demo/library-rel
```

`npm test` runs the CLI smoke: install and one real run in an
isolated workspace.

This package is the finished state of
[Part 4 of the model-to-model tutorial](https://AelasticS.github.io/aelastics/developer-guide/tutorial/model-to-model/part-4-name-scopes),
which explains the scoped stages and compares the output with Part 1's.
