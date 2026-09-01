# sql-tutorial-basic

Companion package of the model-to-text tutorial, Part 1. A relational
schema becomes a single SQL DDL file, with fixed logic and no
decorators:

- Every table becomes one `CREATE TABLE` statement.
- Every column contributes one line, and each clause of that line comes
  from one property of the column: `PRIMARY KEY` from `isKey`,
  `AUTOINCREMENT` from `isAutoincrement`, `NOT NULL` from `isNullable`,
  and an inline `REFERENCES` clause from `references`.

The source metamodel is the simplified tutorial relational metamodel
(`@synthesis/standard-metamodels/rel-tutorial`), the same one the
model-to-model tutorial produces. The target is `text`: the engine's
document metamodel, where one `<Doc>` becomes one file.

The sample model is exactly what
[eer-tutorial-basic](../eer-tutorial-basic/) generates from its Library
schema, so the two halves of the tutorial join up: what the first half
produced is what this half consumes.

## Try it

```bash
# Build the package (from the repository root: rush build -t sql-tutorial-basic)
npm run build

synth init
synth namespace mk demo
synth model import sample/library-rel.tsx --as demo/library-rel

synth transformation install .
synth transformation run sql-tutorial-basic --in demo/library-rel --out-dir ./generated
cat generated/Library_rel.sql
```

The output is one file, `Library_rel.sql`, with a header comment and
four `CREATE TABLE` statements: `Book`, `Author`, `Category`, and the
`categorizedAs` join table.

## One thing to notice

A column has no back link to its table. A foreign key points at the
primary key column it references, and nothing points the other way, so
the table name a `REFERENCES` clause needs is found by searching the
schema for the table whose columns contain that column. That is model
navigation, not a workaround: the metamodel stores the fact once and
derives the rest.

## What to look at next

[sql-tutorial-structured](../sql-tutorial-structured/), the Part 2
companion, splits the output into two documents and places content into
named sections instead of relying on emission order.
