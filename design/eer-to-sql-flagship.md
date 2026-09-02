# The flagship eer-to-sql suite: full EER to relational

Design record for approval, drafted 2026-09-02, amended the same day
with the trace capture stage. Nothing is built; this document is the
proposal for the dedicated flagship session that the consolidation
reserved ("rich FK redesign stays reserved for the flagship session").

The flagship is a revision of the existing eer-to-sql example suite in
place, not a new suite: the relational metamodel package gains the rich
content, and both transformations are reworked against it, following the
one-transformation-revised-in-place principle from the workflow suite.
The tutorial suite (eer-tutorial and rel-tutorial metamodels) is
untouched; tutorial-simple and flagship-rich deliberately coexist.

## What the flagship must show

Agreed requirements, carried from the 2026-08-29 and 2026-09-02
sessions:

- A rich relational metamodel: real `ForeignKey` and `Index` concepts,
  composite foreign keys. The old v2 variant files are raw material
  (recover with `git show 8343883^:libraries/standard-metamodels/src/relational/REL.meta.model.type.v2.ts`
  and the matching `REL-components.v2.ts`).
- All template kinds in one transformation: plain `@E2E` rules,
  `@SpecPoint`/`@SpecOption` specialization, `@VarPoint`/`@VarOption`
  configuration issues, and the higher-order `withAuditColumns`.
- `withAuditColumns` in its confirmed zero-argument form (verbatim
  below), combined with a configuration issue so auditing is itself a
  design option.
- JPA-style inheritance decisions and index-on-foreign-key options.
- History columns are NOT in v1. `withAuditColumns` composes
  (signature-preserving, columns step in, columns step out), so a future
  `withHistoryColumns` can stack without design changes; that is the
  whole concession to history in v1.
- The trace story (agreed 2026-09-02): the decision-aware trace model
  must capture, for each rule, which configuration option was selected,
  including variability points fired inside other rules, and the CLI
  must be able to persist the trace model. Engine and CLI groundwork in
  stage 1; see the trace capture section.

## Layout (unchanged)

```text
examples/eer-to-sql/
  metamodels/
    eer/               eer-metamodel: repaired where authoring is broken
    relational/        relational-metamodel: rich content replaces legacy
  eer-to-relational/   m2m, all template kinds, six design issues
  rel-to-sql-ddl/      m2t, reworked for constraints and indexes
```

## The rich relational metamodel

Based on the v2 raw material, revised for the current authoring
conventions:

| Concept | Definition |
| --- | --- |
| `RelSchema` | subtype of `Model`, the root |
| `Table` | contains `columns: Column[]`, `foreignKeys: ForeignKey[]`, `indexes: Index[]` |
| `Column` | `type` (SQL type string), `isKey`, `isNullable`, `isAutoincrement`; inverse link `ownerTable` |
| `ForeignKey` | `referencedTable` link, `fkColumns: ForeignKeyColumn[]`, `isUnique`; inverse link `ownerTable` |
| `ForeignKeyColumn` | pairs `fkColumn` and `refColumn`, both links to `Column`; one pair per participating column, several pairs form a composite foreign key |
| `Index` | `columns` (link array to `Column`), `isUnique`; inverse link `ownerTable` |

Changes against the legacy content: `Column.isForeignKey` and
`Column.references` (string) are deleted, replaced by the real
`ForeignKey` concept. Changes against the v2 raw material: `Domain` is
dropped and `Column` keeps a plain SQL `type` string (see open decision
5); composite primary keys stay `isKey` booleans on several columns, no
separate PrimaryKey concept (the DDL generator assembles the
constraint).

Component surface, following the workflow suite's reference-component
idiom (references as JSX children, engine connection candidates with
first-available semantics):

- `Table`, `Column`, `ForeignKey`, `ForeignKeyColumn`, `Index` as
  containment tags.
- `Column` connects via candidates `["columns", "fkColumn", "refColumn"]`:
  inside a `Table` it is a contained column; inside a
  `ForeignKeyColumn` the first `Column` reference fills `fkColumn`, the
  second fills `refColumn` (the same first-available mechanics as
  `Flow.from`/`Flow.to` in bpmn-metamodel); inside an `Index` it
  appends to the link array `columns`. One component serves authoring
  and the serializer's declared-type emission alike.
- `referencedTable` is authored as a prop
  (`referencedTable={<Table $refByName=.../>}`), like `domain` on EER
  roles today. Risk checkpoint 2 verifies the serializer round-trip.
- Single links (`fkColumn`, `refColumn`, `referencedTable`) are
  type-level `t.optional` for the same creation-order reason as
  `Process.body` and `Flow.from`/`to` in the workflow suite; semantic
  mandatoriness is enforced by the transformation and checked by the
  DDL generator.

Naming conventions (element names are unique per model, not per table,
so every derived name is qualified):

| Element | Name |
| --- | --- |
| foreign key column | `<rel>_<refEntity>Id_FK` (existing convention) |
| weak entity's copy of an owner key column | `<owner>_<keyColumn>` |
| foreign key | `FK_<ownerTable>_<rel or role>` |
| foreign key column pair | `<fk name>_<n>` |
| index | `IX_<fk name>` |
| discriminator column (SingleTable strategy) | `<rootTable>_type` |
| audit columns | `<table>_createdBy`, `<table>_createdAt` (fixed by the confirmed template) |

All emitted names pass through the `NamingConvention` issue's
`applyNaming`, as today.

## The EER side

The eer-metamodel already has everything the flagship needs: `Kernel`,
`Weak` (with `WeakMapping`), `Subtype`/`Specialization` (with
`SpecializationMapping`), `Relationship` with roles, `Aggregation`.
No new concepts.

However, only the Kernel/Attribute/Relationship authoring path is
exercised by the current sample. The components file connects
`Specialization` via a parent property `"specializations"` that no type
declares, and `WeakMapping` via `undefined`; those paths have likely
never rendered. Stage 1 is therefore a repair pass: an authoring test
that renders every EER concept, with metamodel and component fixes as
needed (fix the metamodel, not the sample).

## The design space (decision model)

The decision model `RelationSchemaDesign` grows from three issues to
six. Existing issues and bindings are retained unchanged:

| Issue | Kind, bound to | Options (default first) |
| --- | --- | --- |
| `NamingConvention` | ModelIssue | `SnakeCase`, `CamelCase` (retained) |
| `PrimaryKeyStrategy` | ElementIssue on `Attribute` | `UseAutoIncrement`, `UseManualIncrement` (retained; autoincrement is suppressed by rule logic for composite keys) |
| `OneToManyStrategy` | ElementIssue on `Relationship`, 1:N condition | `JoinTable`, `ForeignKey` (retained; now emits real `ForeignKey` elements) |
| `TableAuditing` | ElementIssue on `Entity` | `AuditColumns`, `NoAuditColumns` (new; open decision 1 covers granularity and default) |
| `InheritanceStrategy` | ElementIssue on `Specialization` | `JoinedTables`, `SingleTable`, `TablePerClass` (new, JPA-style, per hierarchy) |
| `IndexOnForeignKey` | ModelIssue | `IndexAllForeignKeys`, `NoForeignKeyIndexes` (new; open decision 2 covers granularity) |

The binding model gains: `TableAuditing` bound to `Entity` (no
condition), `InheritanceStrategy` bound to `Specialization`. ModelIssues
need no binding, as with `NamingConvention` today.

## withAuditColumns, the confirmed form

Recorded verbatim as agreed on 2026-09-02 (the user re-pasted this form
as confirmation). Zero-argument steps compose Approval-style: qualifier
first, then a columns step in, a columns step out:

```tsx
withAuditColumns = (table: string) => (columns: () => ExprNode<rmT.IColumn>[]) =>
  (): ExprNode<rmT.IColumn>[] => [
    ...columns(),
    <Column name={`${table}_createdBy`} type="VARCHAR(255)" isKey={false} isNullable={false} isAutoincrement={false} />,
    <Column name={`${table}_createdAt`} type="DATE" isKey={false} isNullable={false} isAutoincrement={false} />,
  ]
```

It lives as a module-level export of the transformation package (it is
pure target-domain: only relational `Column` expressions and a name, no
source concepts), imported by the transformation class.

The combination with the configuration issue: the `TableAuditing`
VarPoint's options have identical signatures and return a columns step,
so auditing is literally a design option choosing which step builds the
table's columns:

```tsx
@E2E()
@SpecPoint()
entityToTable(e: em.IEntity): ExprNode<rmT.ITable> | undefined {
  return undefined  // pure dispatch: Kernel, Weak, Subtype options below
}

@SpecOption("entityToTable", em.Kernel)
kernelToTable(e: em.IKernel): ExprNode<rmT.ITable> {
  const kernelColumns = () => e.attributes.map((a) => this.attributeToColumn(a))
  const buildColumns = this.columnsStepFor(e, kernelColumns)
  return <Table name={this.applyNaming(e.name)}>{buildColumns()}</Table>
}

@VarPoint("TableAuditing")
columnsStepFor(e: em.IEntity, columns: () => ExprNode<rmT.IColumn>[]): () => ExprNode<rmT.IColumn>[] {
  throw new Error("Not implemented VarOptions for VarPoint TableAuditing")
}

@VarOption("columnsStepFor", Option("AuditColumns"))
auditedColumns(e: em.IEntity, columns: () => ExprNode<rmT.IColumn>[]) {
  return withAuditColumns(this.applyNaming(e.name))(columns)
}

@Default()
@VarOption("columnsStepFor", Option("NoAuditColumns"))
plainColumns(e: em.IEntity, columns: () => ExprNode<rmT.IColumn>[]) {
  return columns
}
```

(The element is the VarPoint's first argument, which is what per-element
resolution keys on. Which option is `@Default()` follows open
decision 1; `@VarPoint` and `@SpecPoint` never share a method, the
decorator guards forbid it, hence the separate `columnsStepFor` point.)

## The transformation (eer-to-relational)

`template(s)` assembles one `<RelSchema>` in fixed pass order, so grafts
always find their targets: kernels, then weak entities, then subtypes,
then relationships, then indexes.

- `entityToTable` is the specialization point (pure dispatch, engine
  feature ee98d25): options for `Kernel`, `Weak`, `Subtype`.
- Kernel: table with attribute columns through the audit step,
  `PrimaryKeyStrategy` decides autoincrement for single-column integer
  keys.
- Weak: table with copies of the owner's key columns (qualified,
  `isKey`, forming the composite primary key together with the weak
  entity's partial key) plus its own attribute columns through the audit
  step, and one composite `ForeignKey` to the owner built by the shared
  `foreignKeyTo` helper. A weak entity whose owner has a composite key
  is the composite-foreign-key showcase.
- Subtype: dispatches on the hierarchy's `InheritanceStrategy` (a
  VarPoint keyed on the `Specialization` element):
  - `JoinedTables` (default): own table with own columns; primary key
    columns are copies of the root's key that are simultaneously a
    `ForeignKey` to the root table.
  - `SingleTable`: no own table; own attributes are grafted into the
    root's table via `<Table $refByName>` as nullable columns, plus one
    discriminator column `<rootTable>_type` grafted once per hierarchy.
  - `TablePerClass`: own table with copies of the root's columns plus
    own columns; no foreign key.
- Relationships: M:N always a join table (two foreign keys,
  composite-aware); 1:N per `OneToManyStrategy` (`ForeignKey` grafts
  columns plus a `ForeignKey` element into the N-side table,
  `JoinTable` builds a join table); 1:1 as a foreign key on the
  optional side with `isUnique`. A relationship whose target is a weak
  entity produces a composite foreign key naturally.
- `foreignKeyTo(ownerTableName, refEntity, qualifier)` is the one
  helper that builds foreign keys everywhere: it emits the qualified
  fk columns (types mirroring the referenced key columns) and the
  `<ForeignKey>` element whose `ForeignKeyColumn` children pair each fk
  column with its referenced column by `$refByName` (flat name scope
  makes column references unambiguous).
- Index pass: under `IndexAllForeignKeys`, one `<Index>` per emitted
  foreign key over its fk columns, grafted into the owner table.
- Domain-to-SQL-type mapping stays the fixed `getColumnType` logic.

Everything else about the class (DecisionAwareM2M base, constructor
shape, `@M2M()`) is as today. No `isTypeOf` dispatch outside the
`template` method's element filtering; specialization and configuration
machinery carry all variability.

## Trace capture: engine and CLI groundwork

Agreed 2026-09-02 after reviewing the engine. What exists today: the
directly stacked case (`@E2E()` above `@VarPoint()`) is fully traced,
`VarPointTraceEntry` carries the rule, the chosen option, and the
per-element choices, `SpecPointTraceEntry` likewise for specialization,
and `DecisionAwareTraceModel` records which configuration model the run
used. Two gaps make that insufficient for the flagship:

- Nested resolutions are discarded by design: when a VarPoint fires
  inside a rule instead of being directly wrapped by its `@E2E`,
  `consumePointResolutions` (decorator-guards.ts) clears it and keeps
  only the wrapping rule's own resolution, and `lastVarResolution` is a
  single slot, so two nested VarPoints in one rule overwrite each
  other. Today this already loses `PrimaryKeyStrategy` and
  `NamingConvention`; in the flagship, `TableAuditing` and
  `InheritanceStrategy` both fire inside SpecOptions, so the trace
  would miss most of the design space.
- The CLI never persists the trace: the engine renders the trace model
  into the run's ephemeral store and dumps its JSX through console.log,
  then everything is discarded. There is no flag to export it.

The groundwork, stage 1 of the plan:

- Engine: per-rule resolution frames replace the single slot. `@E2E`
  pushes a frame on entry; every point resolution fired during the call
  is recorded in the innermost frame; on exit the rule's trace entry
  carries all of them (issue name, chosen option, choices). The
  directly stacked case becomes the one-resolution special case.
  Attribution is per innermost frame and therefore honest:
  `PrimaryKeyStrategy` lands on `attributeToColumn`'s entry,
  `TableAuditing` and `InheritanceStrategy` on `entityToTable`'s,
  `NamingConvention` on whichever rule called `applyNaming`.
- Trace metamodel: the base trace entry gains a `resolutions`
  containment (`VariabilityResolution`: issue name, option name,
  choices); the existing `VarPointTraceEntry` and `SpecPointTraceEntry`
  subtypes stay for the directly stacked cases.
- CLI: `transformation run --trace <ref>` writes the trace model to the
  workspace the way `--out` writes the target model, for m2m and m2t
  runs alike. The unconditional console.log dump of the trace JSX in
  abstractM2M goes away in the same change (the CLI already has to wrap
  it today).
- Engine tests for frame attribution (nested VarPoint, VarPoint inside
  SpecOption, two VarPoints in one rule), a CLI test for `--trace`,
  CHANGELOG entry, own commit, full gates.

## rel-to-sql-ddl rework

The m2t transformation follows the metamodel:

- CREATE TABLE with column lines (type, NOT NULL, AUTOINCREMENT) and a
  table-level `PRIMARY KEY (col, ...)` clause, composite-aware.
- Named foreign keys as `ALTER TABLE ... ADD CONSTRAINT <fk> FOREIGN KEY
  (cols) REFERENCES <table> (cols)` in a separate constraints section,
  because foreign keys can be circular (the lesson the m2t tutorial
  already teaches).
- `CREATE [UNIQUE] INDEX <ix> ON <table> (cols)`.
- The `IdentifierQuoting` issue is retained unchanged; no new m2t
  issues in v1.

## Samples

`library.tsx` grows into the design space's showcase (one rich sample;
final shape at build time):

- Kernels `Book`, `Author`, `Person`.
- Specialization under `Person` with subtypes `Member` and `Staff`
  (exercises `InheritanceStrategy`).
- Weak entity `BookCopy` owned by `Book` with partial key `copyNo`
  (composite primary key, composite foreign key).
- M:N `writtenBy` between `Book` and `Author` (join table).
- 1:N `borrows` between `Member` and `BookCopy` (the `OneToManyStrategy`
  playground; its target is weak, so the ForeignKey option emits a
  composite foreign key).

Plus one checked-in sample configuration model demonstrating non-default
choices (per-table auditing, one alternative inheritance strategy, the
FK option for `borrows`), run via `transformation run --config`.

Verification asserts expected output the way the workflow suite did:
for the default configuration and for the sample configuration, the
exact table list and, for representative tables, the exact column,
foreign key, and index sets, both after the m2m run and in the generated
DDL text. The trace model is asserted too, via `--trace`: the
sample-configuration run's trace must record, per rule, the selected
options (for example `AuditColumns` for `Person`, the `ForeignKey`
option for `borrows`, `JoinedTables` for the `Person` hierarchy), which
is the executable proof of the stage 1 groundwork.

## Risk checkpoints

Verified empirically before the approach is fixed, with fallbacks:

1. EER authoring of `Specialization`, `Subtype`, `WeakMapping` renders
   after the stage 1 repair pass. Fallback: adjust the eer-metamodel
   schema (undeclared parent properties, missing inverses); samples are
   never contorted around metamodel defects.
2. The serializer round-trip of the rich relational model: links are
   emitted with declared-type tags (`Column`, `Table`), so the
   components' candidate lists must satisfy both authoring and import.
   Checked in stage 2 with a hand-written rich model: render, export,
   import (the bpmn `Node` lesson). Fallback: dedicated reference tags
   (`FkColumn`, `RefColumn`) and, if `referencedTable` proves
   problematic as a prop, a reference child component for it.
3. First-available candidate connection fills `fkColumn` then
   `refColumn` in child order (same mechanics as `Flow.from`/`to`).
   Fallback as in 2.
4. `@VarPoint` resolution keyed on `Specialization` elements (the
   subtype rule passes the specialization, not the subtype, as the
   element argument): confirm per-element choices resolve. Fallback:
   key the issue on the root entity.
5. Pure-dispatch `@SpecPoint` returning grafts and arrays for the
   `SingleTable` strategy (engine already normalizes arrays in `@E2E`).
6. Persisting the trace model through the CLI write gate: every emitted
   tag must come from an exported components module, so the trace
   metamodel needs a components subpath on `@aelastics/synthesis`
   (uniform with the decision, binding, and configuration metamodels).
   Checked in stage 1 by the `--trace` CLI test. Additive surface, no
   fallback needed.
7. Per-frame resolution attribution across decorator combinations
   (nested VarPoint, VarPoint inside SpecOption, two VarPoints in one
   rule): stage 1 engine tests fix the semantics before any flagship
   rule relies on them.

## Open decisions (for approval)

1. `TableAuditing` granularity and default. Recommendation: per-element
   `ElementIssue` bound to `Entity`, as previously recommended, since a
   global boolean barely needs the machinery, and default
   `AuditColumns`, so every default-configuration gate run exercises
   the higher-order template and the sample configuration demonstrates
   per-table opt-out. Alternative: default `NoAuditColumns` (the
   conservative semantics), which pushes higher-order coverage entirely
   onto the sample-configuration run.
2. `IndexOnForeignKey` granularity. Recommendation: global `ModelIssue`
   with default `IndexAllForeignKeys`; indexing foreign keys is a
   schema-wide policy in practice, and a per-relationship issue would
   double the configuration noise for little illustrative gain.
   Alternative: `ElementIssue` on `Relationship`, mirroring
   `OneToManyStrategy`.
3. `InheritanceStrategy` granularity. Recommendation: per-element on
   `Specialization` (that is the JPA analogy: one strategy per
   hierarchy). Alternative: global.
4. Aggregation scope. Recommendation: out of v1 as a stated limitation
   (like exclusive gateways in the workflow suite); the metamodel keeps
   the concept, the sample does not use it, the transformation throws a
   clear transformation error if it meets one. Alternative: map it like
   a weak-style composite, which grows the rule set by roughly a third.
5. `Domain` in the relational metamodel. Recommendation: drop it;
   `Column.type` stays a plain SQL type string, as in the legacy content
   and the tutorial metamodel, keeping the DDL generator direct. The
   v2 raw material's `Column.domain` indirection buys no configuration
   payoff. Alternative: keep `Domain` for fidelity to classic relational
   models, at the cost of an extra concept in every rule and in the DDL
   generator.
6. Sample domain. Recommendation: extend the existing Library sample as
   sketched above, keeping continuity with the suite and the tutorial
   narrative. Alternative: a fresh domain (for example
   university or e-commerce) if Library feels overused.

## Execution order and gates

On branch `feat/eer-to-sql-flagship` in a new worktree
`/home/sinisa/Projects/Synthesis-wt-flagship`. Merge to main with
`--no-ff` when green; do not push.

Stages, each gated (rush build with the "Operations succeeded"
criterion, engine suite, CLI tests plus smoke, every example package
smoke, docs build; never pipe gates through tail without pipefail):

0. Record: this document committed on the branch; the open decisions
   are resolved in place as the user answers them (none blocks
   stage 1).
1. Trace capture groundwork (see its section): engine per-rule
   resolution frames, trace metamodel `resolutions` containment, CLI
   `--trace`, engine and CLI tests, CHANGELOG, own commit. This comes
   first because it is engine work the flagship's verification depends
   on, the same ordering the workflow suite used for pure dispatch.
2. EER repair pass: authoring test covering every EER concept,
   metamodel and component fixes, existing smokes stay green.
3. relational-metamodel rich rework: model, components with candidate
   connections, regenerated metamodel-as-model, hand-written rich model
   round-trip (risk checkpoints 2 and 3), version bump of dependents as
   needed.
4. eer-to-relational rework: decision model, binding model,
   transformation, samples, sample configuration, expected-output and
   trace verification, smoke.
5. rel-to-sql-ddl rework: constraints and indexes, chain verification
   end to end (EER model to DDL text), smoke.
6. Documentation: both package READMEs, the suite and catalog README
   rows, the variability guide's "Execution Trace" section rewritten
   against the delivered behavior (today it promises per-step choice
   capture that the engine does not deliver), docs build. Whether any
   other guide or tutorial Part 3 embeds flagship or trace material is
   a separate later discussion, as with the workflow suite.
7. Merge `--no-ff`, full gate ladder repeated on merged main.

Conventions binding for all stages: no em dashes in user-facing text;
"configuration-based", never "decision-based"; JSX notation is the
authoring style; no AI attribution; `git grep` for sweeps.
