# Row history: withHistoryTable and the RowHistory design space

The row-versioning policy agreed in the 2026-09-06 discussion and
recorded as the first deferred item of design/eer-to-relational-v2.md,
now executed. A table the configuration marks as versioned gets a
second table that keeps every past state of its rows: the base table
holds current rows, the history table holds everything that ever was.

## The agreed shape (binding)

Three decisions from the discussion govern everything below.

**Identification, not existence.** The history table is identified
like a weak entity: its primary key is the base table's key plus a
temporal discriminator. It is deliberately NOT existence-dependent:
history outlives the deletion of the base row, so there is no
cascading foreign key back to the base table. In fact the history
table carries no foreign keys at all: its rows are snapshots of past
states, and enforcing current referential constraints on past states
would reject exactly the rows history exists to keep.

**One granularity above the audit step.** withAuditColumns is a
columns step in, columns step out. withHistoryTable takes a
TABLE-producing step and returns a table-SET step: the base table
plus its history table. It is pure target-domain: it derives the
history table by introspecting the base table's expression node, so
it composes with whatever produced that node. Stacking is now
demonstrated for real: the audit columns are appended inside the
wrapped step, so a versioned audited table's history captures
createdBy and createdAt like any other column.

**A composite option opening a sub-issue.** The design space is a
RowHistory ElementLevelIssue: NoHistory (default) or HistoryTable, where
HistoryTable is a CompositeOption opening the HistoryDiscriminator
sub-issue (ValidFromTimestamp default, or VersionCounter). The
nesting is design-space structure ONLY: configurations stay flat
choice lists, dispatch resolves the sub-issue like any issue, and the
conditionality polices itself at run time. This is exactly the shape
the variability guide already documents; the engine fact that makes
it sound is verified: a consulted variation point without a matching
choice falls back to its @Default option
(var-decorators.ts selectVarOption), and an unconsulted one is simply
never asked.

## The transformer

`history.tsx` in eer-to-relational, beside `audit.tsx`:

```tsx
export const withHistoryTable = (discriminator: () => ExprNode<rmT.IColumn>) =>
  (table: () => ExprNode<rmT.ITable>) =>
    (): ExprNode<rmT.ITable>[] => [base, derivedHistoryTable]
```

Derivation rules, all from the base node: every real column (a Column
child without $refByName) is copied by name, type, and nullability,
with autoincrement stripped (history rows arrive with their values)
and domain references re-referenced; foreign keys and indexes are not
copied; the primary key is rebuilt as the base key columns in plan
order plus the discriminator column; the table is named
`<base>_history` and carries `historyOf={<Table $refByName={base}/>}`.
The discriminator step is passed in, so the transformer knows nothing
about the sub-issue: ValidFromTimestamp yields
`valid_from TIMESTAMP NOT NULL`, VersionCounter yields
`version INTEGER NOT NULL` (hardcoded idiomatic names, the
singleTableHierarchy `type` precedent).

Dispatch in the transformation: the entities pass calls a new
`@E2E() @VarPoint("RowHistory") entityToTables(e)` where the NoHistory
option returns `[this.entityToTable(e)]` and the HistoryTable option
returns `withHistoryTable(() => this.historyDiscriminator(e))(() =>
this.entityToTable(e))()`. The discriminator is its own variation
point, `@VarPoint("HistoryDiscriminator") historyDiscriminator(e)`.
A second value-answering point on the RowHistory issue,
`keepsHistory(e)` (the strategyOf precedent), serves the graft sites
below.

## Late grafts are mirrored (an addition beyond the discussed shape)

The discussion settled the transformer's granularity; building it
surfaced an ordering fact the record must own. Two rule families add
columns to already-emitted tables via $refByName grafts AFTER the
entities pass: the relationships pass under the ForeignKey option
(and the fixed 1:1 rule), and the SingleTable hierarchy option (the
discriminator and subtype columns land in the root's table). A
history table derived only from the entity's own node would silently
miss those columns, and a versioned row's foreign keys are part of
its state.

So every graft site consults `keepsHistory(entity)` for the table it
grafts into and, when true, emits a second graft that mirrors the new
COLUMNS (copies by name, type, nullability, autoincrement stripped)
into `<table>_history`. Foreign keys are not mirrored (the history
table carries none) and the primary key is untouched. The mirror is
built by introspecting the just-built graft node, so no rule runs
twice and the trace stays honest.

## Scope

Versioning applies to the entities pass: kernel, weak, and
aggregation tables. Hierarchy subtype tables (joined and
table-per-class) and relationship join tables are not versionable in
v1 and are recorded as deferred; a SingleTable hierarchy IS
versionable through its root, which the graft mirror makes correct.

## The relational metamodel

Table gains `historyOf`, an optional self-link, the declarative fact
the DDL layer needs (the Column.domain precedent: optional, no
inverse). The metamodel-as-model mirror gains the matching
`tableHistoryOf` property if the one-definition self-reference
renders; if it does not, the mirror omits it with the same recorded
honesty as ForeignKey.referencedTable. No new declared constraints:
what a history table must structurally be is the transformation's
contract, not a metamodel law.

## The DDL layer

History is maintained by the stage 4 trigger machinery, as agreed:
for every table with `historyOf`, the triggers document gains a
capture stub, unconditional like the connect rules (no dialect has a
declarative form; SQL:2011 system versioning is a deferred dialect
opportunity):

```sql
-- row history capture for book: every update or delete writes the previous row state to book_history
CREATE TRIGGER trg_book_history_capture
  AFTER UPDATE OR DELETE ON book
  FOR EACH ROW EXECUTE PROCEDURE synth_book_history_capture();
```

Filling the discriminator (CURRENT_TIMESTAMP, or the next version
number per key) belongs to the procedure body, which is a stub by
design; the comment names the contract. The history table itself is
an ordinary CREATE TABLE through the existing rule; dialects,
quoting, and clustering apply to it like to any table.

## Decision model, binding model

The decision model gains the RowHistory issue exactly as the
variability guide's composite-options section sketches it (same
option and tag names, ValidFromTimestamp marked default). The binding
model binds RowHistory to Kernel, Weak, and Aggregation (the
TableAuditing precedent, plus the aggregation the entities pass also
owns). HistoryDiscriminator is NOT bound: a sub-issue attaches
through its parent option, not through the binding model, which is
what keeps default configurations quiet about it while NoHistory
rules.

## The generator improvement

`SourceModelToDefaultConfigurationModel` learns to traverse into
chosen composite options: whenever a generated choice selects an
option whose optionType is composite, choices for that option's
sub-issues are generated in the same decision context, recursively.
With NoHistory as the default nothing changes for the flagship's
generated configurations; the improvement matters the moment a
composite option is anyone's default, and it is tested in the
library with a purpose-built decision model whose default IS
composite. The variability guide's tooling note ("config init
enumerates the model's top-level issues") is rewritten to describe
the new behavior.

## Samples and verification

The flagship verification's patched run additionally chooses
HistoryTable for Book with an explicit VersionCounter choice (a
hand-written sub-issue choice passing structural validation), and
HistoryTable for BookCopy with no discriminator choice (the run-time
default fallback, recorded byDefault in the trace). Under that run's
ForeignKey option the borrows relationship grafts into book_copy, so
the mirror is exercised: book_copy_history must carry the grafted
member key copy. Asserted: both history tables with their keys
((id, version) and (book_id, no, valid_from)), historyOf references,
absence of foreign keys on history tables, audit columns captured,
and the trace resolutions. rich-db gains a hand-authored history
table (the authoring path for historyOf). The DDL suite verification
adds a chain run with a patched step 1 configuration and asserts the
history CREATE TABLE, its PRIMARY KEY, the capture trigger stub in
the triggers document, and that no ALTER TABLE constraint targets the
history table.

## Documentation

The mapping-rules page gains a row-history rule family section (the
identification-without-existence-dependency rationale, the capture
triggers, the two design-space rows added to the issue table). The
variability guide's composite-options section now points at the
flagship as the live example and its tooling note describes the
traversal. Suite READMEs get one line each; CHANGELOG carries the
entries; the stale `withHistoryColumns` mention in audit.tsx's
comment becomes the delivered withHistoryTable.

## Deferred

Versioning for hierarchy subtype tables and join tables; SQL:2011
system-versioned tables as a dialect-native emission (a future preset
would replace capture triggers with PERIOD/system-versioning DDL
where the dialect owns it); structured retention policies (how long
history is kept is operations, not schema); the v2 deferrals stand.

## Execution

Worktree Synthesis-wt-history, branch feat/row-history off main
c73508f. Stages, each on a full green ladder (rush build,
libraries/synthesis and apps/cli npm test, apps/cli npm run smoke,
every example package npm test, apps/docs npm run build at the docs
stage and at merge):

1. Generator traversal + library test (libraries/synthesis).
2. Relational metamodel historyOf + mirror + rich-db.
3. eer-to-relational: history.tsx, dispatch, discriminator, graft
   mirror, decision and binding models, verification.
4. rel-to-sql-ddl: capture stubs, chain verification.
5. Documentation and CHANGELOG.

Merge --no-ff to main, ladder repeated on merged main, no push.

## Delivery notes (2026-09-06)

All five stages delivered as planned; three facts surfaced by the
build are recorded here.

**The CLI's decision-model index is containment-first now.** The
rendered graph creates a composite option's whole subtree BEFORE the
option itself (props render first), so the CLI's document-order
attribution would have filed HistoryTable under its own sub-issue,
corrupting announcements, serialized issue references, and coverage
checks. The index now walks the materialized containment
(decisionModel.issues, possibleOptions, subIssues), indexing
sub-issues like issues; the document-order walk remains as the
fallback for models without containment. The old claim that the
rendered graph does not materialize the containment was stale: the
library's own generator has always depended on it.

**The verification exercises every new path.** The flagship's patched
run versions Book (explicit VersionCounter sub-issue choice, passing
structural validation and traced with its choice reference) and
BookCopy (discriminator defaulted at run time, traced byDefault);
under that run's ForeignKey option the borrows graft into book_copy
is mirrored, so book_copy_history carries the member key copy. The
SingleTable mirror was probe-verified (person_history gains `type`
and the subtype columns) but is not a standing verification run. The
DDL leg runs the history configuration through a PERSISTED
intermediate, which also proves historyOf round-trips the workspace
file; a single chain invocation with a step-1 configuration plus
generated defaults for step 2 was not used and remains a
packaged-chains question.

**Serialized grafts stay fragments.** The m2m serializer keeps
after-the-fact grafts as separate `<Table $refByName>` fragments
rather than merging them into the named table block; the mirror
assertions read those fragments.

## Status

Drafted 2026-09-06 after the user's go; committed as stage 0 on the
branch. DELIVERED the same day on feat/row-history: stage 1
(generator traversal + containment-first index, bdb99b6), stage 2
(Table.historyOf + mirror + rich-db, e7d366f), stage 3
(withHistoryTable, the RowHistory/HistoryDiscriminator design space,
graft mirrors, verification, b32b475), stage 4 (capture stubs + the
DDL history leg, 041825d), stage 5 (docs and CHANGELOG). Full ladder
green at every stage; merged to main with --no-ff and the ladder
repeated there; not pushed.
