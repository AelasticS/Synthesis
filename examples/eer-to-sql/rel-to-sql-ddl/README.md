# rel-to-sql-ddl

Model-to-text over the rich relational metamodel: a relational schema
becomes SQL DDL. CREATE TABLE statements carry composite-aware
`PRIMARY KEY` clauses read from the PrimaryKey element in its order;
every foreign key becomes a named `ALTER TABLE ... ADD CONSTRAINT`
with its `ON DELETE`/`ON UPDATE` actions, in its own section, because
foreign keys can be circular and no creation order satisfies them
inline; indexes become `CREATE INDEX` statements; connect rules (and,
under trigger emulation, disconnect rules) become trigger stubs in a
separate `-triggers.sql` document, joined by an AFTER UPDATE OR
DELETE capture stub for every table whose `historyOf` link names the
base table it keeps history for. Five issues are on offer:
IdentifierQuoting, ReferentialActions (NativeDdl or TriggerEmulation),
DomainHandling (InlineTypes or EmitDomains), SqlDialect (StandardSql,
PostgreSql, Oracle), and the per-table Clustering. A dialect is a
configuration, not code: the presets under [presets/](./presets/) are
authored by extension over the compiled `rel-to-sql-ddl/presets`
vocabulary (postgres and oracle spread the standard-sql choice set and
override only what the dialect changes), and they are source-agnostic:
`--config demo/cfg-postgres` fits any input schema. The mapping rules
are explained canonically in the docs page "A full-featured EER to
SQL transformation".

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
  key whose references cross table scopes, an index, a hand-authored
  history table over the `historyOf` link), imported by the smoke on
  every run.
- [presets/](./presets/): the three dialect presets
  (standard-sql, postgres, oracle), configuration models authored by
  extension; import one with
  `synth model import presets/postgres.tsx --as demo/cfg-pg --tx rel-to-sql-ddl`.
- [scripts/verify.mjs](./scripts/verify.mjs): the suite's end-to-end
  proof: eer-to-relational then rel-to-sql-ddl on the Library sample,
  asserting the composite constraint down the weak chain, the joined
  subtype constraint, indexes, audit columns, native referential
  actions, inline and emitted domains, the trigger documents, both
  preset runs, both clustering emissions, the row-history leg (the
  derived history table, its capture stub, and the absence of
  constraints on it), and the relational membership constraints
  through `model validate`.

## Try it

```bash
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/library-db.tsx --as demo/library-db
synth transformation run rel-to-sql-ddl --in demo/library-db --default-configs --out-dir ./generated
cat generated/LibraryDb.sql
```
