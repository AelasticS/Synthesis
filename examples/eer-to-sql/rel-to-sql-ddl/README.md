# rel-to-sql-ddl

Model-to-text over the rich relational metamodel: a relational schema
becomes SQL DDL. CREATE TABLE statements carry composite-aware
`PRIMARY KEY` clauses; every foreign key becomes a named
`ALTER TABLE ... ADD CONSTRAINT` in its own section, because foreign
keys can be circular and no creation order satisfies them inline;
indexes become `CREATE INDEX` statements. One configuration issue is on
offer: IdentifierQuoting (verbatim or double-quoted identifiers).

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): three `@E2E`
  rules (tables, constraints, indexes) over the document metamodel; an
  incomplete foreign key or index is a clear error.
- [src/decision-model.tsx](./src/decision-model.tsx) and
  [src/binding-model.tsx](./src/binding-model.tsx): the quoting issue.
- [sample/library-db.tsx](./sample/library-db.tsx): a small rich schema
  with a real foreign key and an index.
- [sample/rich-db.tsx](./sample/rich-db.tsx): the authoring pass for the
  rich relational metamodel (short per-table names, a composite foreign
  key whose references cross table scopes, an index), imported by the
  smoke on every run.
- [scripts/verify.mjs](./scripts/verify.mjs): the suite's end-to-end
  proof: eer-to-relational then rel-to-sql-ddl on the Library sample,
  asserting the composite constraint down the weak chain, the joined
  subtype constraint, indexes, and audit columns in the generated SQL.

## Try it

```bash
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/library-db.tsx --as demo/library-db
synth transformation run rel-to-sql-ddl --in demo/library-db --default-configs --out-dir ./generated
cat generated/LibraryDb.sql
```
