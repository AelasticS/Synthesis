# sql-tutorial-structured

Companion package of the model-to-text tutorial, Part 2: the same DDL
as Part 1 (`rel-tutorial-metamodel` to `text`), reorganized around
the document metamodel's structure. Multiple documents become
multiple files, and named sections place content: the documents
declare empty `tables` and `constraints` sections, and the rules that
produce statements point at their section with `<SecParent>`. The
split puts foreign keys into a second file as `ALTER TABLE`
statements, which is deployment order made structural: foreign keys
can be circular, so no ordering of inline `REFERENCES` clauses works
in general.

## Run

```bash
npm run build   # from the repository root: rush build -t sql-tutorial-structured

synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/library-rel

synth transformation install .
synth transformation run sql-tutorial-structured --in demo/library-rel --out-dir ./generated
cat generated/Library_rel.sql
cat generated/Library_rel-constraints.sql
```

`npm test` runs the CLI smoke: install and one real run in an
isolated workspace.

This package is the finished state of
[Part 2 of the model-to-text tutorial](https://AelasticS.github.io/aelastics/developer-guide/tutorial/model-to-text/part-2-structured),
which explains the sections and the two-file split.
