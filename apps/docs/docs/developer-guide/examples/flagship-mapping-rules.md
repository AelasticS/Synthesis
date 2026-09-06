---
sidebar_position: 2
title: "The flagship: EER to relational mapping rules"
---

# The flagship: EER to relational mapping rules

This page is the canonical explanation of the mapping the flagship
suite (`examples/eer-to-sql`) implements: what each EER construct
becomes in the relational model, why, and which decisions a
configuration closes. The package READMEs stay deliberately short and
point here; every rule described below is enforced by the suite's
executable verification on every merge.

Two doctrine points shape the whole mapping. Relationships are
strictly binary: relating more than two entities (and sometimes two)
is modeled as an Aggregation, and the transformation refuses other
arities with a message that says exactly that. And a fact lives in
one place: key-ness is membership in a table's `PrimaryKey` element
(there is no `isKey` mark on columns), a column is a foreign key
exactly when a `ForeignKey` pair names it, and semantic completeness
rules are declared constraints on the metamodel, run by
`synth model validate`.

## Entities

A kernel becomes a table: one column per leaf attribute, a
`PrimaryKey` element over the key attributes, audit columns when the
per-table `TableAuditing` issue says so (the default), and natural
names throughout, because entities scope their attributes and tables
scope their columns.

A weak entity's table copies its owner's key columns in front of its
own: the copies plus the own key attributes form the composite
`PrimaryKey`, and a foreign key over the copies points at the owner.
The copied names take the owner table's name as a prefix exactly when
the copied name carries no qualifier of its own (`book_id`, but a
second hop keeps `book_id` and prefixes only the ambiguous parts:
`book_copy_no`), which is the `ForeignKeyColumnNaming` issue's
ShortNames default.

## Aggregations and the key rule

An aggregation relates at least two participants (a declared
constraint and a transformation guard). Its table copies participant
keys, and the primary key follows the cardinalities:

- A participant involved **at most once** functionally determines the
  aggregation, so that participant's copied key IS the primary key.
  Every other participant becomes an ordinary foreign key, UNIQUE
  when that participant is also at-most-once, so surplus candidate
  keys survive as relational facts.
- With no such participant, the primary key is the **composite** of
  all participants' copied keys, and each participant's slice doubles
  as its foreign key.

In the Library sample, each copy is on at most one Loan, so the
loan's key is the copy's composite key `(book_id, book_copy_no)`,
and the member is a plain nullable foreign key.

## Hierarchies

A specialization maps per the `InheritanceStrategy` issue, decided
per hierarchy: JoinedTables (the default; subtype tables carry the
root key as primary and foreign key), SingleTable (subtype columns
graft into the root table, with a NOT NULL `type` discriminator
column), or TablePerClass (subtype tables copy the root columns; an
abstract root gets no table of its own). Foreign keys that target a
subtype follow the strategy: under SingleTable they land on the root
table, under TablePerClass on the subtype's own table.

## Relationships

Binary, by doctrine. M:N becomes a join table with one foreign key
per role. 1:N is the genuinely open decision (`OneToManyStrategy`):
a join table by default, or a foreign key grafted into the N side's
table. 1:1 becomes a UNIQUE foreign key on the optional side. A
relationship carries no attributes; a relationship that needs data is
an aggregation.

## Attributes

Cardinality is one modeling fact with two consequences: a lower bound
of `0` makes the column nullable (the default `(1,1)` is NOT NULL),
and an upper bound of `M` makes the attribute **multivalued**: it
leaves the entity's table entirely and becomes its own table (owner
key copies plus one value column, all of them the primary key, with a
cascading foreign key back to the owner). A **composite** attribute
(one level of components) flattens into prefixed columns:
`address_street`, `address_city`. Autoincrement applies only to
single-column INTEGER keys, judged by the table's key plan, never to
parts of composite keys.

## Domains

The primitive names (`number`, `string`, ...) resolve through one
mapping into SQL types. A **user-defined domain** (`baseType`,
`check`, `defaultValue`) is emitted once as a relational `Domain`
element, and every column typed by it carries the resolved SQL type
plus a link to the domain, so nothing downstream breaks when domains
are inlined. The DDL renders domains per the `DomainHandling` issue:
`InlineTypes` (default) puts `DEFAULT` and `CHECK` on each column
with `VALUE` replaced by the column identifier; `EmitDomains` writes
`CREATE DOMAIN` statements and types columns by domain name.

## Integrity rules: connect and disconnect

Every mapping in the EER metamodel carries a pair of rules over the
association it represents: `cn`, the CONNECT rule (the association is
established: the referencing row inserted or its foreign key set),
and `dcn`, the DISCONNECT rule (the association is broken: the row
deleted or the key changed). The letters are R (restrict), C
(cascade), N (set null), D (set default).

For every emitted foreign key, the governing pair is the one guarding
the REFERENCED end:

| Foreign key | Governing pair |
| --- | --- |
| weak table to its owner | the WeakMapping's `cnWeakOwner`/`dcnWeakOwner` |
| joined subtype table to its root | the Subtype's `cnSupertype`/`dcnSupertype` |
| relationship foreign keys (1:N, 1:1, join tables) | the referenced role's `cnMapp`/`dcnMapp` |
| aggregation participant | the AggregationMapping's `cnAggrOwner`/`dcnAggrOwner` |

The disconnect rule becomes the declarative `onDelete` and `onUpdate`
actions (Restrict is the SQL default and is omitted). The connect
rule has no declarative form in ANY SQL dialect, so a non-Restrict
`cn` becomes `onConnect` on the foreign key, and the DDL layer emits
a BEFORE INSERT OR UPDATE trigger stub for it, always. Under the
`ReferentialActions` issue's TriggerEmulation option (for dialects
without action clauses), the disconnect rules join the triggers
document as AFTER DELETE OR UPDATE stubs instead of clauses. Two
pairs have no foreign-key form and are not mapped in v2: the
SpecializationMapping's own `cnMapp`/`dcnMapp` and the Subtype's
`cnSubtype`/`dcnSubtype` (rules over subtype-row events).

## Dialects are configurations, not code

The DDL generator declares emission issues; a dialect is a shipped
configuration model closing them all: `IdentifierQuoting`,
`ReferentialActions`, `DomainHandling`, `SqlDialect`, and the
per-table `Clustering`. The three presets under
`rel-to-sql-ddl/presets/` are authored **by extension**: the choice
vocabulary and the standard-sql choice set are package exports, and
the postgres and oracle presets spread that set and override only
what the dialect changes, so the diff IS the dialect's definition.
Presets declare no source model reference, which makes them
source-agnostic: `transformation run --config` accepts them for any
input.

Physical design lives here too. The per-table `Clustering` choice
(`ClusterPrimaryKey`) emits a one-time `CLUSTER ... USING <pk>`
statement under PostgreSql (which has no maintained clustered
indexes) and `ORGANIZATION INDEX` on the CREATE TABLE under Oracle
(which maintains them continuously): one logical decision, two
dialect-true emissions.

## Validation

The metamodels declare their doctrine as constraints: binary
relationships, aggregation arity, weak-mapping presence, the
schema-level acyclicity of identification dependencies (weak
ownership, aggregation participation, and subtyping in ONE graph, so
mixed cycles are caught), and on the relational side key/index/
foreign-key column membership in the right tables.
`synth model import` admits what renders; `synth model validate`
additionally runs the declared constraints and reports each violation
with the rule's own message. See the
[Constraints section](../guides/defining-metamodels.md#constraints)
of the metamodel guide for the mechanism.

## The design space at a glance

| Issue | Granularity | Options (default first) | Transformation |
| --- | --- | --- | --- |
| TableAuditing | per entity | AuditColumns, NoAuditColumns | eer-to-relational |
| InheritanceStrategy | per hierarchy | JoinedTables, SingleTable, TablePerClass | eer-to-relational |
| OneToManyStrategy | per relationship | JoinTable, ForeignKey | eer-to-relational |
| PrimaryKeyStrategy | per attribute | UseAutoIncrement, UseManualIncrement | eer-to-relational |
| ForeignKeyColumnNaming | global | ShortNames, TablePrefixed | eer-to-relational |
| NamingConvention | global | SnakeCase, CamelCase | eer-to-relational |
| IndexOnForeignKey | global | IndexAllForeignKeys, NoForeignKeyIndexes | eer-to-relational |
| IdentifierQuoting | global | Unquoted, DoubleQuoted | rel-to-sql-ddl |
| ReferentialActions | global | NativeDdl, TriggerEmulation | rel-to-sql-ddl |
| DomainHandling | global | InlineTypes, EmitDomains | rel-to-sql-ddl |
| SqlDialect | global | StandardSql, PostgreSql, Oracle | rel-to-sql-ddl |
| Clustering | per table | None, ClusterPrimaryKey | rel-to-sql-ddl |

Everything on this page is asserted by
`eer-to-relational/scripts/verify.mjs` and
`rel-to-sql-ddl/scripts/verify.mjs` through the real CLI on every
gate run: outputs, traces, constraint rejections, both presets, and
both clustering emissions.
