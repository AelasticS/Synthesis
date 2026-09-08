# sql-tutorial-basic

Companion package of the model-to-text tutorial, Part 1: a relational
schema (`rel-tutorial-metamodel`) becomes a single SQL DDL file, with
fixed logic and no decorators. Every table becomes one `CREATE TABLE`
statement, and each clause of a column line comes from one property
of the column, including an inline `REFERENCES` clause from its
`references` link. The target is `text`, the engine's document
metamodel, where one `<Doc>` becomes one file. The sample model is
exactly what `eer-tutorial-basic` generates, so the two halves of the
tutorial join up.

## Run

```bash
npm run build   # from the repository root: rush build -t sql-tutorial-basic

synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/library-rel

synth transformation install .
synth transformation run sql-tutorial-basic --in demo/library-rel --out-dir ./generated
cat generated/Library_rel.sql
```

`npm test` runs the CLI smoke: install and one real run in an
isolated workspace.

This package is the finished state of
[Part 1 of the model-to-text tutorial](https://AelasticS.github.io/aelastics/developer-guide/tutorial/model-to-text/part-1-basic),
which builds it step by step.
