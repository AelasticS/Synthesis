# sql-tutorial-structured

Companion package of the model-to-text tutorial, Part 2. The same DDL as
Part 1, reorganized to show two things about the text-document
metamodel:

- **Multiple documents become multiple files.** Every `<Doc>` in an M2T
  model is serialized to its own file under `--out-dir`, so the document
  structure is the output structure.
- **Named sections place content.** The documents declare empty sections
  (`tables`, `constraints`), and the rules that produce statements sit
  at the top level of the `<M2T>` model, each pointing at its section
  with `<SecParent $refByName=... />`. A rule no longer has to be
  written where its output ends up.

## Why two files

Foreign keys can be circular: two tables can reference each other, and a
table can reference itself. No ordering of `CREATE TABLE` statements
satisfies every inline `REFERENCES` clause, so production DDL creates
all tables first and adds the foreign keys afterwards with `ALTER
TABLE`. The split here is that deployment order made structural, not a
formatting preference.

## Try it

```bash
# Build the package (from the repository root: rush build -t sql-tutorial-structured)
npm run build

synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/library-rel

synth transformation install .
synth transformation run sql-tutorial-structured --in demo/library-rel --out-dir ./generated
cat generated/Library_rel.sql
cat generated/Library_rel-constraints.sql
```

The output is two files: `Library_rel.sql` with four `CREATE TABLE`
statements and no `REFERENCES` clauses, and
`Library_rel-constraints.sql` with the three foreign keys as `ALTER
TABLE ... ADD CONSTRAINT` statements.

## What to look at next

[sql-tutorial-configuration-based](../sql-tutorial-configuration-based/),
the Part 3 companion, turns the choice between one file, two files, and
one file per table into a decision a configuration model answers per
run.
