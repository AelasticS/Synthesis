# The flagship eer-to-sql suite: full EER to relational

Design record, drafted 2026-09-02, substantially amended 2026-09-04
after the design discussion (outcome-shaped trace model, the rule
granularity principle, the namespace feature, metamodel-core hygiene,
platform alignment). Nothing is built beyond this record; stage 0 is
this document on branch feat/eer-to-sql-flagship. The consolidation
reserved this session ("rich FK redesign stays reserved for the
flagship session").

The flagship is a revision of the existing eer-to-sql example suite in
place, not a new suite: the relational metamodel package gains the rich
content, and both transformations are reworked against it, following the
one-transformation-revised-in-place principle from the workflow suite.
The tutorial suite (eer-tutorial and rel-tutorial metamodels) is
untouched; tutorial-simple and flagship-rich deliberately coexist.

## What the flagship must show

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
- The trace story (agreed 2026-09-03): the trace model records
  OUTCOMES: one entry per executed rule, and every resolved
  configuration option is recorded, always. The CLI can persist the
  trace model. See the trace section.

## Layout (unchanged)

```text
examples/eer-to-sql/
  metamodels/
    eer/               eer-metamodel: repaired where authoring is broken
    relational/        relational-metamodel: rich content replaces legacy
  eer-to-relational/   m2m, all template kinds, seven design issues
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
dropped and `Column` keeps a plain SQL `type` string (open decision 5);
composite primary keys stay `isKey` booleans on several columns, no
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
  second fills `refColumn` (the `Flow.from`/`to` mechanics); inside an
  `Index` it appends to the link array `columns`.
- `referencedTable` is authored as a prop
  (`referencedTable={<Table $refByName=.../>}`). Risk checkpoint 2
  verifies the serializer round-trip.
- Single links (`fkColumn`, `refColumn`, `referencedTable`) are
  type-level `t.optional` for the creation-order reason established by
  `Process.body` and `Flow.from`/`to`; semantic mandatoriness is
  enforced by the transformation and checked by the DDL generator.
- Under open decision 7, `Table` is declared a namespace
  (`declareNamespace(Table)`), so column names are unique per table,
  not per model.

### Column naming for copies and foreign keys

Naming is collision-driven and itself a design option (the
`ForeignKeyColumnNaming` issue), not an accumulating convention:

- `ShortNames` (default under namespaces): a copied or foreign key
  column keeps its source column's name; a prefix appears only where it
  is the meaning (`A.id` arriving in `B` becomes `a_id`, once), and
  further hops copy the name as it stands. When one table would receive
  two equally named columns (two foreign keys to the same target, a
  diamond), a deterministic numbered suffix disambiguates (`a_id_1`,
  `a_id_2`, in role order); relationship foreign keys additionally
  carry the relationship name, as today. `ShortNames` is only sound
  with per-table name scopes, so it presupposes decision 7.
- `TablePrefixed`: every hop prefixes the owner table's name; unique by
  construction in a flat model, verbose (`b_a_id`). The only sound
  default if decision 7 defers namespaces.

Fixed names either way: audit columns per the confirmed template;
discriminator column `<rootTable>_type` under SingleTable. All emitted
names pass through the `NamingConvention` issue's `applyNaming`.
The uniqueness invariant: the store enforces uniqueness per scope
(duplicate name error), the transformation disambiguates
deterministically, never silently.

## The EER side

The eer-metamodel already has everything the flagship needs: `Kernel`,
`Weak` (with `WeakMapping`), `Subtype`/`Specialization` (with
`SpecializationMapping`), `Relationship` with roles, `Aggregation`.
Per decision 8 (resolved), `Entity` additionally carries `isAbstract`
(optional boolean, a domain fact; flagship metamodel only).

Only the Kernel/Attribute/Relationship authoring path is exercised by
the current sample. The components file connects `Specialization` via a
parent property no type declares, and `WeakMapping` via `undefined`;
those paths have likely never rendered. The EER repair stage is
therefore an authoring test covering every concept, with metamodel and
component fixes as needed (fix the metamodel, not the sample).

## The design space (decision model)

`RelationSchemaDesign` grows from three issues to seven:

| Issue | Kind, bound to | Options (default first) |
| --- | --- | --- |
| `NamingConvention` | ModelIssue | `SnakeCase`, `CamelCase` (retained) |
| `PrimaryKeyStrategy` | ElementIssue on `Attribute` | `UseAutoIncrement`, `UseManualIncrement` (retained; autoincrement suppressed by rule logic for composite keys) |
| `OneToManyStrategy` | ElementIssue on `Relationship`, 1:N condition | `JoinTable`, `ForeignKey` (retained; now emits real `ForeignKey` elements) |
| `TableAuditing` | ElementIssue on `Entity` | `AuditColumns`, `NoAuditColumns` (new; open decision 1 covers granularity and default) |
| `InheritanceStrategy` | ElementIssue on `Specialization` | `JoinedTables`, `SingleTable`, `TablePerClass` (new, JPA-style, per hierarchy) |
| `IndexOnForeignKey` | ModelIssue | `IndexAllForeignKeys`, `NoForeignKeyIndexes` (new; open decision 2 covers granularity) |
| `ForeignKeyColumnNaming` | ModelIssue | `ShortNames`, `TablePrefixed` (new; defaults per decision 7, see naming section) |

The binding model gains: `TableAuditing` bound to `Entity` (no
condition), `InheritanceStrategy` bound to `Specialization`.
ModelIssues need no binding.

## The granularity principle (convention)

The trace records rule executions plus the configuration options that
selected them. Trace detail is therefore the AUTHOR'S dial: behavior
factored into rules is recorded; behavior inlined into a rule's
template is not. Choices that produce model elements should be
rule-shaped (a stacked `@E2E` `@VarPoint`), so their entries carry real
targets; choices that return plain values (booleans, strings) cannot be
rules and are covered by the recording safety net (see the trace
section). The flagship deliberately factors fine-grained rules, being
the detail showcase.

## withAuditColumns, the confirmed form, applied as a rule pair

The confirmed zero-argument form, recorded verbatim as agreed
2026-09-02 (qualifier first, then a columns step in, a columns step
out):

```tsx
withAuditColumns = (table: string) => (columns: () => ExprNode<rmT.IColumn>[]) =>
  (): ExprNode<rmT.IColumn>[] => [
    ...columns(),
    <Column name={`${table}_createdBy`} type="VARCHAR(255)" isKey={false} isNullable={false} isAutoincrement={false} />,
    <Column name={`${table}_createdAt`} type="DATE" isKey={false} isNullable={false} isAutoincrement={false} />,
  ]
```

It lives as a module-level export of the transformation package (pure
target-domain), used inside the audited option of a rule pair, per the
granularity principle: the audited and plain column building are RULES
selected by the configuration, so the choice has its own trace entry
with real targets:

```tsx
@E2E()
@VarPoint("TableAuditing")
tableColumns(e: em.IEntity): ExprNode<rmT.IColumn>[] {
  throw new Error("Not implemented VarOptions for VarPoint TableAuditing")
}

@VarOption("tableColumns", Option("AuditColumns"))
auditedColumns(e: em.IEntity) {
  const base = () => e.attributes.map((a) => this.attributeToColumn(a))
  return withAuditColumns(this.applyNaming(e.name))(base)()
}

@Default()
@VarOption("tableColumns", Option("NoAuditColumns"))
plainColumns(e: em.IEntity) {
  return e.attributes.map((a) => this.attributeToColumn(a))
}
```

Note under decision 7: the template's `table` qualifier argument exists
only because of the flat name scope; with `Table` as a namespace the
audit columns can be plain `created_by`/`created_at` and the qualifier
becomes unnecessary. The confirmed form is NOT changed without the
user's explicit re-confirmation of a simplified form.

## The transformation (eer-to-relational)

### The partition

There is no rule engine and no rule priority: rules run when the
template calls them, so authority conflicts are dissolved at the
composition site by partitioning the source elements. Every element
belongs to exactly one pass:

```tsx
const entities = els.filter((el) =>
  store.isTypeOf(el, em.Entity) && !store.isTypeOf(el, em.Subtype))
const hierarchies = els.filter((el) => store.isTypeOf(el, em.Specialization))
const relationships = els.filter((el) => store.isTypeOf(el, em.Relationship))
```

"Every entity becomes a table" is really "every entity the template
routes to the entities pass becomes a table": kernels and weak
entities, hierarchy roots included. Every Subtype belongs exclusively
to its hierarchy's rule. The partition is machine-checked:
`entityToTable`'s pure-dispatch SpecPoint declares options ONLY for
`Kernel` and `Weak`, and dispatch is total, so a leaked Subtype fails
loudly.

### Emission order: topological sort over units

Units are the table-producing rule invocations: `entityToTable(e)` per
kernel and weak, `hierarchyToTables(h)` per specialization. Edges: a
weak entity's unit depends on its owner's unit; a hierarchy's unit
depends on its root's unit; transitively this covers weak-of-weak,
weak-owned-by-subtype, and any depth. `template` orders the units with
a plain Kahn sort (repeatedly emit a unit with no unprocessed
dependencies; a leftover with none is a cycle, reported as a clear
transformation error naming the cycle; ties broken by source order for
deterministic output). This is a small pure ordering helper feeding
direct JSX composition, the same category as `baseOf` in
workflow-to-bpmn, not a planning phase. The relationships pass runs
after all units, the index pass last; neither needs internal ordering.

### The rules

- `entityToTable`: pure-dispatch SpecPoint, options `kernelToTable` and
  `weakToTable`. Both build their columns through the `tableColumns`
  rule pair (auditing) and `attributeToColumn` (per attribute,
  `PrimaryKeyStrategy` inside).
- Weak: copies of the owner's key columns (named per the
  `ForeignKeyColumnNaming` issue, `isKey`, forming the composite
  primary key with the partial key), own attribute columns, and one
  composite `ForeignKey` to the owner via `foreignKeyTo`.
- `hierarchyToTables`: stacked `@E2E` `@VarPoint("InheritanceStrategy")`
  whose SOURCE ELEMENT is the Specialization, so the strategy
  resolution rides a real entry with real targets. It delegates per
  subtype to traced sub-rules. Attribute accounting per strategy, the
  invariant being that every source attribute is MAPPED by exactly one
  rule and anything further is a copy created by the hierarchy rule:

| Strategy | Root's attributes | Subtype's attributes |
| --- | --- | --- |
| `JoinedTables` (default) | Mapped once by the root's rule into the root table; the hierarchy copies only the KEY columns into each subtype table (PK plus FK to the root) | Mapped into the subtype's own table |
| `SingleTable` | Mapped once by the root's rule, which stays ignorant of the hierarchy | Grafted by the hierarchy rule into the root's table as nullable columns, plus one discriminator column; subtypes get NO tables |
| `TablePerClass` | Mapped once by the root's rule AND copied into each subtype table | Mapped into the subtype's own table |

  Copies come from their own small rule (`copiedColumn`), never by
  re-invoking `attributeToColumn` (whose name derives from the
  attribute alone and would collide); the trace then shows original
  mapping and copies as distinct entries. Under SingleTable the
  hierarchy rule produces grafts into the root's table via
  `<Table $refByName>`, the same cooperation mechanism the FK rule
  uses; pass order guarantees the target exists. Under open decision 8,
  an abstract root gets no own table under TablePerClass (one more
  exclusion in the entities filter).
- Relationships: M:N always a join table (two foreign keys,
  composite-aware); 1:N per `OneToManyStrategy`; 1:1 as a foreign key
  on the optional side with `isUnique`. A relationship targeting a weak
  entity produces a composite foreign key naturally.
- `tableFor(entity)`: the shared helper resolving "the table that holds
  this entity's rows": own table for kernels and weaks; for a subtype,
  whatever its hierarchy's strategy dictates (own table, or the root's
  under SingleTable). `foreignKeyTo` and the topological edges are both
  expressed against `tableFor`, so a strategy choice reroutes foreign
  keys and dependencies consistently.
- `foreignKeyTo(ownerTable, refEntity, qualifier)`: emits the fk
  columns (types mirroring the referenced key columns, names per the
  naming issue) and the `<ForeignKey>` element whose
  `ForeignKeyColumn` children pair fk and referenced columns by
  reference.
- Index pass: under `IndexAllForeignKeys`, one `<Index>` per emitted
  foreign key over its fk columns, grafted into the owner table.
- Domain-to-SQL-type mapping stays the fixed `getColumnType` logic.

Auditing composes: `tableColumns` is consulted once per table-producing
rule with that table's entity as the element; SingleTable subtypes are
never consulted (no table). Scope notes: v1 assumes concrete hierarchy
roots except where decision 8 adds the abstract case; v1 samples keep
hierarchies one level deep (mixing strategies across nested hierarchies
is a stated limitation, like Aggregation per open decision 4).

## The trace model, outcome-shaped

Agreed 2026-09-03, superseding the first amendment's frame-based
proposal. The trace records outcomes, not execution mechanics: nothing
about how dispatch selected a rule, no entries for abstract points,
no repetition of a choice per consulting call site.

What exists today, for the record: the directly stacked case (`@E2E`
over `@VarPoint`) is traced with option and choices; nested resolutions
are deliberately discarded (`consumePointResolutions`), the resolution
slot is single, the recorded option name is the option METHOD name, and
the CLI never persists the trace (rendered into the run's ephemeral
store, dumped through console.log).

### The shape

- ONE entry kind. An entry: source element, `rule` (the executed
  concrete method, e.g. `kernelToTable`, `joinedHierarchy`; that an
  abstract point dispatched there is not recorded, the name is the
  record), targets (the rule's returned roots), and `Resolution`
  children. `VarPointTraceEntry`, `SpecPointTraceEntry`, and `ruleType`
  are retired.
- `Resolution`: issue name and option name in DECISION-MODEL language
  (`Option("...")` carries its declared name into the registration), a
  reference to the configuration's Choice element or `byDefault: true`,
  and an OPTIONAL element reference for consultations scoped to an
  element other than the entry's source.
- Attribution: a resolution (issue, element) rides the entry whose
  source is that element when one exists; otherwise it sits at model
  level with an explicit element reference. Global (ModelIssue)
  resolutions are recorded once, at model level. Design guidance: bind
  each ElementIssue to an element some rule transforms and the trace
  stays fully regular (the flagship achieves this via
  `hierarchyToTables`).
- The two-tier guarantee: every resolved option is recorded, always.
  Tier one, rule-shaped choices (like `tableColumns`) carry their
  resolution on their own entry with real targets. Tier two, non-rule
  choices (`PrimaryKeyStrategy` a boolean, `NamingConvention` a
  string): each VarPoint firing records one fact (issue, element or
  global, option, choice or default) into a per-run map, deduplicated
  (resolution is deterministic per issue and element), attached at
  trace assembly per the attribution rule. This replaces today's
  silent discard.
- Trace references are FULL PATHS derived from the actual created
  elements (never reconstructed as model path plus name), which also
  makes them namespace-correct under decision 7.

### Forward compatibility for incremental transformation

The trace's second purpose (user requirement): supporting future
incremental transformation, per the design notes now merged to main at
`design/synchronizing-transformations/` (MobX-inspired; the store is
already MobX-observable end to end, so automatic per-rule read-set
tracking is feasible later with no rule-code changes). The outcome
trace is the right spine but not sufficient alone (cross-element and
collection-membership reads are invisible), so v1 includes now, at
near-zero cost:

- stable entry identity: (executed rule name, source element path), not
  timestamps;
- the `Resolution` element reference and `byDefault` as above;
- model-level slots: configuration reference (exists), source model
  reference plus version/hash slot, transformation name plus version;
- a RESERVED, empty-by-default `readSet` containment on the entry
  (elements, properties, entry references, consulted issues), so tier
  1/2 dependency data lands later without a metamodel migration;
- optionally `parentRule` (the render walker knows the enclosing
  entry).

Full read-set capture is future work, not v1.

### Per-element decision matching: suspected bug DISPROVED, matcher hardened

Correction, stage 1 (2026-09-04): the suspected id bug does not exist.
aelastics-store's `Repository.deepCreate` passes a uuid generator into
the types layer's `newInstance`, so every created element carries a
generated `id` and per-element matching works correctly (the earlier
claim came from a truncated search that saw only the immutable store
branch). The outcome-trace test now pins the behavior (two elements,
two element decisions, divergent choices). The matcher was hardened
anyway: object identity first, id equality only when both sides carry
one. Consequence for the hygiene stage: if `id` is dropped from
metamodel-core, matching must move fully to identity/path in the same
change, since `id` is its only current mechanism.

### CLI: persisting the trace

`transformation run --trace <ref>` writes the trace model to the
workspace the way `--out` writes the target model, m2m and m2t alike.
The trace metamodel gains a components subpath on `@aelastics/synthesis`
(`./metamodels/trace`, uniform with decision/binding/configuration) so
the write gate accepts its tags. With `--default-configs` the
configuration is synthesized per run and the trace's config reference
would dangle; recommendation: persist the effective configuration next
to the trace. The engine's unconditional console.log dump of the trace
JSX goes away in the same change.

## The namespace feature (open decision 7)

Analysis 2026-09-04 (recorded in memory; key evidence): hierarchical
namespaces are HALF-BUILT. The store's name registry is keyed by full
path, duplicate detection is path-scoped, the context has a working
namespace stack; flatness comes from one commented-out renderer branch
(element.ts:339-341, only Models are pushed). design/engine-follow-ups.md
already records activation as a planned, deliberate decision.
Difficulty medium, cleanly opt-in per concept.

Settled semantics (user, 2026-09-04):

- A reference is internally always a full path: a bare or relative
  `$refByName` is canonicalized against the current namespace stack;
  when not found under the innermost scope, resolution probes
  progressively shorter prefixes outward to the model (each probe one
  map lookup); innermost match wins, deterministic shadowing, no
  ambiguity error needed. Absolute `//` references unchanged.
- Namespace-ness is declared by CLASSIFICATION, not subtyping
  (aelastics has single inheritance; `Entity` subtypes `ERConcept` and
  could never also subtype a Namespace type): a helper in
  metamodel-core, `declareNamespace(Type)`, registers the type in a
  module-private WeakSet; the predicate `isNamespaceType(type)` walks
  the supertype chain. Declared once, next to the type definition, in
  the metamodel module (which already imports
  `@aelastics/synthesis/metamodel`); nothing on instances, nothing
  serialized, re-established at module load exactly like the types
  themselves; correctness rests on the type-identity invariant the CLI
  loader already enforces.
- Consequently the `Namespace` TYPE is removed entirely (see hygiene):
  `declareNamespace(Model)` in core is the only base declaration.

If adopted for the flagship: `Table` is declared a namespace (columns
unique per table, natural SQL names, `ShortNames` naming default), the
`Entity` declaration on the EER side is optional (sub-decision), and
the confirmed `withAuditColumns` qualifier becomes unnecessary pending
the user's re-confirmation of a simplified form. If deferred: the
flagship ships flat with `TablePrefixed` naming, and namespaces become
their own later workstream.

## Metamodel-core hygiene

Agreed in substance 2026-09-04 (property-by-property usage analysis in
memory). The core shrinks to what is actually load-bearing:

```ts
export const ModelElement = t.entity({
  name: NameType,
  label: t.optional(t.string),
  description: t.optional(DescriptionType),
  path: t.optional(t.string),
  parentModel: t.optional(t.link(ModelSchema, "Model")),
}, ['name'] as const, "ModelElement", ModelSchema)

export const Model = t.subtype(ModelElement, {
  elements: t.arrayOf(ModelElement),
}, "Model", ModelSchema)
declareNamespace(Model)
```

Dropped, with rationale:

- `Namespace` type: replaced by classification (above); `elements`
  moves to `Model`; `newNamespace` folds into element creation guarded
  by the predicate; `INamespace` becomes `IModelElement`; behavior
  neutral because nothing outside core ever subtyped it.
- `RepositoryObject` chain (`ownerRepository`, `ownerPackage`,
  `category`, `objectClassification`): zero readers; the fossil of
  baking artifact management into the element type (see platform
  alignment). The vestigial `objectClassification = "Model"` stamp in
  the decision metamodel goes too.
- `content` (mandatory, max 65535): zero readers; samples pass
  `content=""` as pure ballast. Artifact serialization is envelope
  content, not element data.
- `MDA_level`: zero readers; superseded at the artifact level by the
  conformsTo relationship (a model's level is its position in the
  conformsTo chain, recorded between artifacts, not on elements).
- `diagrams` plus diagram.type.ts: zero users; also on the wrong side
  of the platform's model/diagram boundary (a diagram references model
  elements from outside; the element graph does not contain diagrams).
- `namespace` link on ModelElement: zero users; `path` serves.
- `id`: dropped from the semantic core now (nothing assigns it; its
  only consumer is the broken decision matching, fixed by
  identity/path). Element identity legitimately returns later as a
  STORAGE-ASSIGNED contract at the persistence boundary (platform
  diagrams reference elements by id), never hand-authored.

Kept: `name` (identity), `label` (store backfills the pre-normalization
name; m2t displays it), `description` (used by decision models),
`path`, `elements`/`parentModel` (ownership pair).

Migration is mechanical: delete `content=""` and `MDA_level="M1"` from
samples, fixtures, and tutorial snippets (docs build catches
stragglers); rebuild through the gates.

## Platform alignment

Context recorded 2026-09-04: Synthesis is to be hosted by the user's
agentic platform (platform-core repo; authoritative decision
ADR-015-MODELS-AS-DMS-SUBTYPE.md, revised 2026-07-02). The ADR's base
stance converges exactly with the cleaned core: "the base concept is
the modeling element, and a model is a subtype of it (a composite
element containing others)"; model is NOT a document; a model's
serialized form lives in the models domain's own storage
(model-per-row, a content column); diagrams are documents referencing
elements from outside; the metamodel is data; the models domain
reserves a transformation/generation seam that Synthesis is shaped to
occupy.

Binding rule going forward, the ENVELOPE rule: the semantic core
describes what is INSIDE a model; everything about a model as an
ARTIFACT (conformance, version, ownership, storage, relationships
between models) lives in the envelope: today the `$synth` model header
and `synth.json` manifest, tomorrow the models-domain row and registry
edges. Nothing artifact-level returns to metamodel-core.

Consequences noted for later, none blocking the flagship:

- The CLI is one host, not the product: the load-bearing seam (loader
  with type-identity preservation, renderModel, execute pipeline)
  migrates from apps/cli into a documented library host API; the
  platform backend becomes the second client. This is the named
  successor of "publishing prep" in the deferred work list.
- The type-identity invariant becomes a service contract: one loaded
  metamodel module instance per metamodel version, versions pinned in
  the envelope (the ADR's install discipline maps to versioned
  metamodel packages).
- The metamodel's dual representation (code module for execution,
  metamodel-as-model for the registry) becomes a contract; the
  namespace classification should eventually be expressible in
  metamodel-as-model so the data form is complete.
- Traces and configurations are models; the platform repository mints
  the versions the incremental design needs (see trace section).

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
  composite foreign key; its source is a subtype, so `tableFor`
  reroutes per the hierarchy's strategy).

Plus one checked-in sample configuration model demonstrating
non-default choices (per-table auditing, one alternative inheritance
strategy, the FK option for `borrows`), run via
`transformation run --config`.

Verification asserts expected output the way the workflow suite did:
for the default configuration and for the sample configuration, the
exact table list and, for representative tables, the exact column,
foreign key, and index sets, after the m2m run and in the generated
DDL text. The trace model is asserted too, via `--trace`: the
sample-configuration run's trace must record `AuditColumns` for
`Person` on the `tableColumns` entry, `JoinedTables` on the hierarchy's
entry, the `ForeignKey` option on the `borrows` entry, and the correct
`byDefault` resolutions, which is the executable proof of the trace
groundwork.

## Risk checkpoints

Verified empirically before the approach is fixed, with fallbacks:

1. EER authoring of `Specialization`, `Subtype`, `WeakMapping` renders
   after the repair pass. Fallback: fix the metamodel, never the
   sample.
2. Serializer round-trip of the rich relational model: links are
   emitted with declared-type tags, so the components' candidate lists
   must satisfy authoring and import alike. Checked with a hand-written
   rich model: render, export, import. Fallback: dedicated reference
   tags (`FkColumn`, `RefColumn`); a reference child component for
   `referencedTable` if the prop form proves problematic.
3. First-available candidate connection fills `fkColumn` then
   `refColumn` in child order. Fallback as in 2.
4. Per-element decision matching: verified working in stage 1 (the
   suspected id bug was disproved; ids are store-generated); matcher
   hardened to identity-first. The hygiene stage must move matching
   fully to identity/path before dropping `id`.
5. Pure-dispatch SpecPoint returning grafts and arrays for the
   SingleTable strategy (E2E already normalizes arrays).
6. Persisting the trace model through the CLI write gate needs the
   `./metamodels/trace` components subpath; checked by the `--trace`
   CLI test. Additive surface.
7. Namespace slices (if decision 7 adopts): renderer push/pop is
   behavior-neutral for the existing corpus (nothing outside core is
   declared a namespace until opt-in); reference canonicalization and
   the hygiene removal of the Namespace type carry engine tests
   (coexisting `//model/A/id` and `//model/B/id`, relative and
   absolute refs, the `git grep -w Namespace` sweep).

## Open decisions

1. `TableAuditing` granularity and default. Recommendation: per-element
   ElementIssue on `Entity`, default `AuditColumns` so every
   default-configuration gate run exercises the higher-order template.
   Alternative: default `NoAuditColumns`.
2. `IndexOnForeignKey` granularity. Recommendation: global ModelIssue,
   default `IndexAllForeignKeys`. Alternative: per-element on
   `Relationship`.
3. `InheritanceStrategy` granularity. Recommendation: per-element on
   `Specialization` (the JPA analogy). Alternative: global.
4. Aggregation scope. Recommendation: out of v1 as a stated limitation;
   the transformation throws a clear error if it meets one.
   Alternative: map it, growing the rule set by roughly a third.
5. `Domain` in the relational metamodel. Recommendation: drop it;
   `Column.type` stays a plain SQL type string. Alternative: keep the
   v2 `Column.domain` indirection.
6. Sample domain. Recommendation: extend the Library sample as
   sketched. Alternative: a fresh domain.
7. Namespaces in the flagship. RESOLVED 2026-09-04: ADOPTED per the
   recommendation (engine slices in the hygiene/groundwork stages,
   `Table` declared a namespace, `ShortNames` naming default). Still
   pending inside this decision: declare `Entity` on the EER side too
   or not (settle by stage 3), and the user's re-confirmation of the
   simplified `withAuditColumns` form (settle by stage 5; the confirmed
   qualified form remains authoritative until then).
8. `isAbstract` on EER `Entity`. RESOLVED 2026-09-04: ADOPTED as a
   metamodel fact with fixed strategy logic (TablePerClass skips the
   abstract root's table), on the FLAGSHIP eer-metamodel only. The
   user's accompanying directive, binding for the whole plan: the
   tutorial metamodels (eer-tutorial, rel-tutorial) stay deliberately
   simple and structurally UNCHANGED; the only tutorial updates allowed
   are those the namespace feature enables (declaring the tutorial's
   relational Table a namespace and adopting the more convenient
   naming), handled in the documentation stage.

Resolved during the discussion: bare-reference canonicalization
semantics, full-path trace references, the classification mechanism,
the FK naming rule set, the metamodel-core drop list (the user noted
`MDA_level` "probably alright" to drop given the conformsTo argument),
and the merge of design/synchronizing-transformations to main (done,
1895b95).

## Execution order and gates

On branch `feat/eer-to-sql-flagship` in the worktree
`/home/sinisa/Projects/Synthesis-wt-flagship` (run `rush update` once
before the first build). Merge to main with `--no-ff` when green; do
not push. Stages, each gated (rush build with the "Operations
succeeded" criterion, engine suite, CLI tests plus smoke, every example
package smoke, docs build; never pipe gates through tail without
pipefail):

0. Record: this document on the branch (done); open decisions resolved
   in place as the user answers them.
1. Trace groundwork: outcome trace model (one entry kind, Resolution,
   two-tier recording, retirements), decision-language option names,
   full-path trace references, the per-element matching fix (id bug,
   failing test first), forward-compatibility slots (identity,
   versions, reserved readSet), CLI `--trace` with effective-config
   persistence, removal of the console.log dump, engine and CLI tests,
   CHANGELOG, own commit.
2. Metamodel-core hygiene: `declareNamespace` classification +
   predicate, `Namespace` type removal, `Model` re-base, the drop
   list, decision-model stamp removal, sample/fixture/docs ceremony
   sweep, engine tests. If decision 7 adopts namespaces: renderer
   push/pop activation and reference canonicalization land here with
   their tests.
3. EER repair pass: authoring test covering every EER concept,
   metamodel and component fixes; `isAbstract` if decision 8 confirms.
4. relational-metamodel rich rework: model, components with candidate
   connections, regenerated metamodel-as-model, hand-written rich
   model round-trip; `declareNamespace(Table)` if decision 7 adopts.
5. eer-to-relational rework: decision model (seven issues), binding
   model, partitioned template with Kahn-ordered units, the rule set
   (tableColumns pair, hierarchyToTables, copiedColumn, tableFor,
   foreignKeyTo), samples, sample configuration, expected-output and
   trace verification, smoke.
6. rel-to-sql-ddl rework: composite PRIMARY KEY clauses, named FK
   constraints via ALTER TABLE (order-independent by construction, no
   topological sort needed in m2t), CREATE INDEX, `IdentifierQuoting`
   retained, chain verification end to end, smoke.
7. Documentation and tutorial namespace adoption: package READMEs,
   suite and catalog rows, the variability guide's "Execution Trace"
   section rewritten against delivered behavior; the tutorial's
   rel-tutorial `Table` declared a namespace, with the companion
   transformations and tutorial pages adopting the more convenient
   naming (tutorial metamodels stay structurally unchanged otherwise,
   per decision 8's directive); docs build. Further guide embedding is
   a separate later discussion.
8. Merge `--no-ff`, full gate ladder repeated on merged main.

Deferred work recorded here so no session resurrects it ad hoc: full
read-set capture for incremental transformation (see
design/synchronizing-transformations/); the execution-seam extraction
(library host API; the CLI becomes one host, the platform backend the
second), which is the named successor of publishing prep; namespace
representation in metamodel-as-model; `withHistoryColumns`.

Conventions binding for all stages: no em dashes in user-facing text;
"configuration-based", never "decision-based"; JSX notation is the
authoring style; no AI attribution; `git grep` for sweeps.

## Status

Stage 1 (trace groundwork) COMPLETE 2026-09-04, all gates green on the
branch: rush build, synthesis library 78 tests (baseline 70 plus the
outcome-trace suite; one pre-existing pending test), CLI 441 tests
(baseline 438 plus three --trace tests) and 86 smoke checks, all eleven
example and template smokes, docs build. Delivered exactly per the
trace section: outcome entries, two-tier resolution recording,
decision-language option names, retirements, full-path references,
forward-compatibility slots, context.traceJsx, CLI --trace with
effective-config persistence, console.log dumps removed. Deviations
from the drafted design, both recorded in place above: the suspected
per-element id-matching bug was disproved (matcher hardened instead),
and the trace file is written directly rather than through the
self-contained import gate, carrying its run's models in the header
references map. Next: stage 2, metamodel-core hygiene with the
namespace activation (decision 7 adopted).

Stage 2 (metamodel-core hygiene and namespace activation) COMPLETE
2026-09-04, all gates green: rush build, library 84 tests (plus the six
namespace-scope tests), CLI 441 and 86 smoke, all eleven example and
template smokes, docs build. Delivered: the five-property semantic core
(ModelElement re-based, RepositoryObject and diagram types deleted, the
Namespace TYPE removed with INamespace kept as a deprecated alias),
declareNamespace/isNamespaceType classification with Model declared in
core, the renderer push/pop activation, outward-probing reference
canonicalization (innermost wins), the store corner fixes
(auto-generated names get paths; getNameWithPath never sees undefined),
and the repo-wide ceremony sweep (content="" and MDA_level="M1" gone
from samples, fixtures, transformations, and docs, including the two
prose passages that taught them). Next: stage 3, the EER repair pass
(decision 8 open: isAbstract).

Stage 3 (EER repair pass) COMPLETE 2026-09-04, all gates green.
Exactly two authoring paths were broken, both in the components:
Specialization (undeclared parent property) and Subtype (no way to
nest in its hierarchy); everything else, weak mappings and
aggregations included, rendered once exercised, so no metamodel type
changes were needed. The all-concepts sample
eer-to-relational/sample/rich-library.tsx guards every authoring path
on each suite smoke. Decision 8 resolved and applied: Entity carries
isAbstract (flagship metamodel only, Person is abstract in the
sample); the tutorial metamodels stay structurally unchanged, with
the namespace naming upgrade assigned to stage 7. Next: stage 4, the
rich relational metamodel with declareNamespace(Table).
