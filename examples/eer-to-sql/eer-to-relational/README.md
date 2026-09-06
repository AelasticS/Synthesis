# eer-to-relational

The flagship configuration-based transformation: a full-semantics EER
schema (aggregations with the cardinality key rule, weak chains,
JPA-style hierarchies, user-defined domains with checks,
composite attributes, connect/disconnect integrity rules) becomes
a rich relational schema (first-class primary and foreign keys,
composite capable, referential actions, wired domains, indexes; a
table is a name scope for its columns). Every design question without
a single right answer is an explicit decision closed per run by a
configuration model. The mapping rules are explained canonically in
the docs page "The flagship: EER to relational mapping rules"
(developer guide, Examples section); this README stays with what the
package is and how to run it. Seven issues are on offer:

- TableAuditing (per entity, on by default): whether a table carries
  `createdBy`/`createdAt` columns. The audited option applies the
  higher-order `withAuditColumns` template ([src/audit.tsx](./src/audit.tsx)):
  a columns step in, a columns step out, so further policies can stack.
- InheritanceStrategy (per specialization hierarchy, JPA-style):
  JoinedTables, SingleTable (discriminator plus grafted columns), or
  TablePerClass (root columns copied; an abstract root gets no table).
- OneToManyStrategy (per 1:N relationship): a foreign key on the many
  side, or a join table.
- IndexOnForeignKey (whole model): one index per foreign key, or none.
- ForeignKeyColumnNaming (whole model): ShortNames keeps a referenced
  column's meaningful name and prefixes only where the prefix is the
  meaning; TablePrefixed prefixes on every hop.
- PrimaryKeyStrategy (per attribute): auto increment or manual keys.
- NamingConvention (whole model): camelCase or snake_case identifiers.

## The package anatomy

- [src/transformation.tsx](./src/transformation.tsx): the transformation
  class, every template kind in one place. `entityToTable` dispatches on
  the entity's kind (`@SpecPoint`); subtypes belong exclusively to their
  hierarchy's rule; emission order is a topological sort over the
  table-producing units, so a weak chain's composite keys always find
  their owners; one key-plan mechanism drives weak entities, joined
  subtypes, and relationship keys.
- [src/audit.tsx](./src/audit.tsx): the higher-order audit template in
  its zero-argument form, pure target-domain.
- [src/decision-model.tsx](./src/decision-model.tsx): the design space as
  data (issues, options, defaults).
- [src/binding-model.tsx](./src/binding-model.tsx): connects issues to
  the metamodel concepts they apply to, optionally narrowed by a
  condition (only 1:N relationships raise OneToManyStrategy).
- [synth.json](./synth.json): the manifest; its `parts` render the EER
  metamodel-as-model, the decision model, and the binding model into the
  store before every run.
- [sample/library.tsx](./sample/library.tsx): the Library, covering the
  whole design space: kernels, an abstract `Person` hierarchy, a weak
  chain down to `Reservation` (composite keys), an M:N and a
  strategy-routed 1:N relationship.
- [sample/rich-library.tsx](./sample/rich-library.tsx): the authoring
  pass over every EER concept, imported by the smoke on every run.
- [scripts/verify.mjs](./scripts/verify.mjs): asserts exact tables,
  keys, indexes, audit columns, and persisted trace resolutions for the
  default and a patched configuration.

## Try it

```bash
synth init
synth namespace mk demo
synth transformation install .
synth model import sample/library.tsx --as demo/library

# defaults: JoinedTables, JoinTable, auditing on, indexes on, snake_case
synth transformation run eer-to-relational --in demo/library --default-configs \
  --out demo/library-rel --trace demo/library-trace
synth model show demo/library-rel
synth model show demo/library-trace
```

The trace records, per executed rule, which option produced each table:
`joinedSubtypeTable` entries carry the hierarchy's strategy, every
`tableColumns` entry its auditing choice, the model its global naming.

## Choosing differently

```bash
synth config init eer-to-relational --for demo/library --out demo/library-cfg
# edit: TablePerClass for the hierarchy, ForeignKey for borrows
synth transformation run eer-to-relational --in demo/library --config demo/library-cfg --out demo/library-rel2
```

Under TablePerClass the abstract `person` table disappears and `member`
carries the copied root columns; under ForeignKey the `borrows` join
table is replaced by a key grafted into `book_copy`, aimed at wherever
the hierarchy strategy put a member's rows. Same source, same
transformation, different architecture.

## The chain

[rel-to-sql-ddl](../rel-to-sql-ddl/) consumes exactly what this
transformation produces:

```bash
synth transformation run eer-to-relational rel-to-sql-ddl \
  --in demo/library --default-configs --out-dir ./generated
```
