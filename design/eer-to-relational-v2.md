# eer-to-relational v2: the full-fledged flagship

The successor of the v1 flagship (design/eer-to-sql-flagship.md, merged
538a34a). Scope agreed with the user 2026-09-05/06: all three gap
tiers are in, under the doctrine below. This record is the authority
for v2; building starts only after the user approves it and the open
decisions are settled as they answer. The tutorial suite is untouched
by everything here: the tutorial stays deliberately simple, the
flagship carries the full semantics.

## Doctrine (binding, user 2026-09-06)

Relationships are strictly BINARY, always. This is a law of the
language, not a limitation: relating more than two entities (and
sometimes two) is modeled as an AGGREGATION. Consequently the
transformation keeps rejecting relationships with more than two
roles, but the error message changes from "wait for v2" to "model
this as an Aggregation". No n-ary relationship mapping will ever
exist.

A second consequence, recommended below as a decision: attributes on
relationships are not needed either, because a relationship that
carries data is precisely an aggregation.

## What v2 delivers

1. Aggregation mapping (the concept exists and authors today; only
   the rule is missing).
2. Integrity rules generated end to end: the R/C/N/D facts the EER
   metamodel already records become referential actions in the
   relational model and in DDL, with triggers where a dialect cannot
   express them.
3. SQL dialects as configurations: the framework answer to dialect
   differences, demonstrated once, standard SQL as the default.
4. Full semantic domains (the v1 decision 5 workstream): user-defined
   EER domains with constraints and defaults, mapped once, emitted as
   CREATE DOMAIN or inlined per dialect.
5. Attribute richness: nullability and multivalued attributes via
   attribute cardinality, composite attributes, derived defaults kept.
6. SingleTable discriminator column.
7. EER Entity as a name scope with naturally named samples.
8. The canonical mapping-rules documentation page.

## Aggregation

`Aggregation` subtypes `Entity` (EER.meta.model.type.ts:101), so an
aggregation is an entity kind: it carries its own attributes, it can
participate in further mappings, and the existing key-plan machinery
extends to it the same way it walks weak chains. Participants attach
through `AggregationMapping` (domain = participating entity,
codomain = the aggregation, lb/ub cardinalities, integrity rules).

The table rule: the aggregation becomes a table holding its own
attribute columns plus one foreign key per participant (composite
where the participant's key plan is composite), built on the same
plannedForeignKey machinery as the weak chain.

The KEY rule (user 2026-09-06): the primary key depends on the
participants' cardinalities. A participant involved AT MOST ONCE
functionally determines the aggregation instance, so that
participant's key IS the aggregation table's primary key, and every
other participant's key becomes a plain foreign key. When no
participant has that uniqueness, the key is the composite of all
participants' keys. Example over the Library: a Loan aggregation of
Member and BookCopy where each copy is on at most one loan is keyed
by the copy's key alone, with the member's key as an ordinary foreign
key; an Exam aggregation of Student and Course where both sides are
"many" is keyed by (student key, course key).

Edge case, decision 7 below: several participants each involved at
most once means several candidate keys. Recommendation: the first
declared such participant keys the table, and each remaining
at-most-once participant's foreign key gets a UNIQUE index, which
states the candidate-key fact in relational terms instead of losing
it.

Aggregations compose: an aggregation participates in relationships
and further aggregations through its `mappings` like any entity, and
its key plan (own or inherited from the keying participant) feeds
those foreign keys. Specializing an aggregation is legal by the type
system; v2 treats it as any entity in a hierarchy.

## Integrity rules become referential actions

The EER metamodel already records integrity rules on every mapping
kind as pairs of `IntegityRule` values (R, C, N, D): `cnMapp/dcnMapp`
on every mapping, plus `cnWeakOwner/dcnWeakOwner`,
`cnAggrOwner/dcnAggrOwner`, and the four `cn/dcnSupertype`,
`cn/dcnSubtype` slots on Subtype. The transformation currently drops
them all; v2 consumes them.

Semantics RESOLVED 2026-09-06, decision 1, in the user's definition:
the rules govern the ASSOCIATION between two entities. `cn` is the
CONNECT rule: what to do when the association is established, which
in the table world is the insertion of the referencing row or the
setting of its foreign key. `dcn` is the DISCONNECT rule: what to do
when the association is broken, by deletion of the corresponding row
or by setting another key value. The translation follows directly:
`dcn` maps to the declarative referential actions ON DELETE and ON
UPDATE (R to RESTRICT, C to CASCADE, N to SET NULL, D to SET
DEFAULT). `cn` equal to R is what a plain foreign key already
enforces: a row cannot connect to a nonexistent target. Connect
rules other than R are not expressible declaratively in ANY SQL
dialect and are emitted as insert/update triggers by the trigger
machinery below, which therefore serves every dialect, not only the
constrained ones. The Mapp versus Owner pairs are the two directions
of one association; the per-kind assignment of pair to foreign key
is worked out in stage 3 and documented on the mapping-rules page.

The relational metamodel stays dialect-neutral: `ForeignKey` gains
optional `onDelete` and `onUpdate` carrying the neutral vocabulary
(Restrict, Cascade, SetNull, SetDefault). The m2m transformation
translates letters to vocabulary; no dialect knowledge exists at this
layer. The DDL generator emits the actions in the constraint
statements it already writes.

## Dialects as configurations

A dialect in this framework is not code, it is a configuration. The
DDL generator declares emission ISSUES; a dialect is a shipped
configuration model closing them all at once:

- `ReferentialActions`: NativeDdl (disconnect rules as ON DELETE and
  ON UPDATE clauses; connect rules other than R as insert/update
  triggers) or TriggerEmulation (everything as triggers, for dialects
  without declarative actions). Standard SQL and PostgreSQL take all
  four disconnect actions in plain DDL, so NativeDdl is the default.
- `DomainHandling` (from the domain workstream): EmitDomains (CREATE
  DOMAIN, columns reference it) or InlineTypes (base type plus inline
  CHECK per column).
- `IdentifierQuoting`: retained from v1.

Shipped preset configurations, decision 9 RESOLVED 2026-09-06:
`standard-sql` (the default) and `postgres`, the dialect the user
wants specifically supported: it takes every disconnect action
natively, selects EmitDomains (PostgreSQL has CREATE DOMAIN), and
carries the physical option below. The oracle preset from the draft
is dropped: the trigger machinery no longer needs a demonstrative
dialect gap, because connect rules exercise it under every dialect.
Exhaustive dialect coverage is a product, not an example; any future
dialect is one more configuration model.

Triggers emit into their own document (`triggers.sql`) next to the
constraints file, using the multi-document layout the m2t machinery
already has: connect rules other than R land there under every
dialect, and under TriggerEmulation the disconnect rules join them.
Trigger naming follows the constraint naming scheme.

## Physical design, first step (clustering)

Physical characteristics belong neither in the EER model nor in the
logical relational model: they are decisions about one installation,
which is exactly what the configuration machinery is for. The home
for physical design is a set of issues on the DDL generator, closed
by dialect presets or by a project-specific configuration.

V2 demonstrates the pattern with one per-table issue, decision 12:
`Clustering`, an ElementIssue on Table with options `None` (default)
and `ClusterPrimaryKey`. Under the postgres preset the chosen tables
get `CLUSTER <table> USING <primary key index>` emitted into a
physical section of the DDL, with the documented caveat that
PostgreSQL has no maintained clustered indexes (unlike SQL Server or
Oracle's index-organized tables): CLUSTER is a one-time physical
reordering, refreshed only by running it again. Deeper physical
design (partitioning, fillfactor, tablespaces, covering indexes) is
deferred to its own future workstream; each item would be one more
issue in this same design space.

## Full semantic domains (the v1 decision 5 workstream, executed)

EER side: `Domain` grows from an empty named concept to a user-defined
type: `baseType` (one of the primitive names the mapping table
knows), optional `check` (a boolean SQL expression over VALUE),
optional `defaultValue`. Primitive domains keep working: a domain
with no base type IS a primitive name, exactly as today, so existing
samples stay valid.

The once-defined mapping: the primitive-name-to-SQL-type table moves
out of the transformation's private `getColumnType` into a shared
module in the suite (exported table plus rule helpers, the
withAuditColumns precedent), imported by the transformation and
usable by any future one. The mapping-as-installable-model version
stays deferred to the platform alignment (ADR-015).

Relational side: `Domain { name, type, check?, defaultValue? }` is
wired: the transformation emits one relational Domain element per
used user-defined EER domain; `Column.domain` is an optional link and
`Column.type` KEEPS the resolved string, so everything downstream
works unchanged when domains are absent or inlined. DDL under
`DomainHandling`: EmitDomains writes a CREATE DOMAIN section and
columns reference domain names; InlineTypes writes base types with
per-column CHECK and DEFAULT clauses.

## Attribute richness

Recommendation, decision 2: attributes gain CARDINALITY (lb 0 or 1,
ub 1 or M) instead of boolean flags, subsuming both nullability and
multivalued in one modeling fact: (0,1) nullable, (1,1) required
(today's implicit default), (0..1,M) multivalued. A multivalued
attribute maps to its own table (owner key plus value column, keyed
by both); nullability replaces the current `!isKey` derivation.
`defaultValue` already exists and flows into DDL DEFAULT clauses.

Composite attributes, decision 3: an attribute may carry component
attributes; the mapping flattens them into columns named
`attribute_component`. Under Table scopes the names stay short and
readable. Recommendation: in scope for v2, one level deep.

Relationship attributes, decision 4: OUT, per the doctrine; a
relationship with data is an aggregation. The record keeps this as a
decision so the user confirms explicitly.

## SingleTable discriminator

The SingleTable strategy currently emits no discriminator, so rows
of different subtypes are indistinguishable. V2 adds a discriminator
column to the hierarchy root's table under SingleTable, holding the
subtype name. Decision 8 on naming; recommendation: `type` (short,
inside the table's own scope), NOT NULL.

## Names and scopes on the EER side

`declareNamespace(Entity)` on the flagship EER metamodel, decision
10. Verified in v1 discussions: no flagship sample references
attributes across entities, so nothing breaks structurally; the
samples rename to natural attribute names (`id`, `title`), which
flows through attributeToColumn into naturally named columns exactly
as tutorial Part 4 demonstrated. This interacts with the
withAuditColumns simplification: under Table scopes the table
qualifier is unnecessary, and the simplified form (plain `createdBy`
and `createdAt` columns) awaits the user's explicit re-confirmation;
the CONFIRMED qualified form stays authoritative until that word is
given.

## Samples and verification

The Library sample gains a Loan aggregation (Member, BookCopy; copy
involved at most once) demonstrating the reduced key, and
rich-library gains an Exam-style aggregation with a composite key
plus a user-defined domain with a check, a multivalued attribute, and
a composite attribute, so every new rule is exercised by authoring on
every smoke. verify.mjs extends to assert: the aggregation tables and
their keys (both variants), UNIQUE indexes for surplus at-most-once
participants, onDelete/onUpdate actions in the model and the DDL,
CREATE DOMAIN under EmitDomains and inline CHECK under InlineTypes,
the discriminator under SingleTable, the multivalued attribute's
table, the trigger document carrying a non-R connect rule, and the
CLUSTER statement under the postgres preset if decision 12 lands.
The chain verification extends over the same content.

## Documentation

The canonical explanation of the mapping rules is a DOCS PAGE, not
the README, because the repository is private while the docs site is
public: a site link into the repo answers 404 for outside readers.
New developer-guide page under the examples section ("The flagship:
EER to relational mapping rules"): one section per rule family (the
EER fragment, the emitted relational fragment, the rationale),
including the aggregation key rule and the integrity-rule
translation, plus the design-space table of all issues and options
and the dialect-as-configuration story. The package READMEs stay
concise (what it is, how to run, link to the page). The variability
guide gains the dialect-preset pattern if its prose does not cover
configurations-as-presets yet. Catalog rows update; CHANGELOG carries
the entries.

## Hygiene riding along

The dead `asdf` function at the bottom of EER.meta.model.type.ts is
removed. Decision 11 on the `IntegityRule` typo (rename to
`IntegrityRule` with a deprecated alias, or leave): recommendation
rename, the alias keeps old imports working. `conceptType` on
ERConcept stays untouched (used by authoring components).

## Open decisions

1. cn/dcn semantics. RESOLVED 2026-09-06, user's definition: cn is
   the CONNECT rule (association established: referencing row
   inserted or foreign key set), dcn the DISCONNECT rule
   (association broken: row deleted or key value changed). dcn maps
   to ON DELETE and ON UPDATE; cn = R is the plain foreign key's own
   enforcement; cn in {C, N, D} becomes insert/update triggers. The
   per-kind pair-to-foreign-key assignment is stage 3 work,
   documented on the mapping-rules page.
2. Attribute cardinality shape. RESOLVED 2026-09-06 as recommended:
   lb/ub on Attribute subsuming nullability and multivalued.
3. Composite attributes. RESOLVED 2026-09-06 as recommended: in,
   one level, flattened `attribute_component` columns.
4. Relationship attributes. RESOLVED 2026-09-06, user confirmed the
   doctrine: relationships cannot have attributes; a relationship
   that needs them must become an aggregation.
5. Categories/union types. OPEN: explanation delivered to the user
   (a category is a subclass over the UNION of several key-
   incompatible superclasses, mapped via a surrogate key).
   Recommendation stands: OUT of v2.
6. Domain check representation. RESOLVED 2026-09-06 as recommended:
   boolean SQL expression string over VALUE, plus baseType and
   defaultValue.
7. Aggregation key edge case. RESOLVED 2026-09-06 as recommended:
   first declared at-most-once participant keys the table; other
   at-most-once participants get UNIQUE indexes on their foreign
   keys.
8. Discriminator name. RESOLVED 2026-09-06 as recommended: `type`,
   NOT NULL, in the root table's scope.
9. Dialect presets. RESOLVED 2026-09-06: standard-sql (default) and
   postgres (user wants PostgreSQL specifically supported); the
   draft's oracle preset dropped, connect rules demonstrate the
   trigger machinery in every dialect.
10. EER Entity namespace, natural sample naming, and the simplified
    withAuditColumns form. OPEN: explanation delivered to the user;
    recommendation: adopt the scope and natural names; the
    CONFIRMED qualified withAuditColumns form stays authoritative
    until the user explicitly confirms the simplified one.
11. IntegityRule typo. RESOLVED 2026-09-06 as recommended: rename to
    IntegrityRule with a deprecated alias.
12. Clustering (new, from the user's physical-design question).
    OPEN: recommendation include the minimal `Clustering`
    ElementIssue on Table (None default, ClusterPrimaryKey) with
    postgres emission of CLUSTER statements; everything deeper
    deferred to a physical-design workstream.

## Execution order and gates

On a branch `feat/eer-to-relational-v2` in a fresh worktree, each
stage gated by the full ladder (rush build, library tests, CLI tests
plus smoke, all example and template smokes, docs build), merge
--no-ff when green, no push. Stages:

0. This record committed; open decisions resolved in place as the
   user answers. Decision 1 must be settled before stage 3.
1. EER metamodel v2: attribute cardinality, composite attributes,
   the Domain extension, declareNamespace(Entity), hygiene; samples
   renamed to natural names and extended (Loan, Exam-style, rich
   domain, multivalued, composite); as-model regenerated; authoring
   smoke green.
2. Relational metamodel v2: ForeignKey onDelete/onUpdate, Domain
   wired with Column.domain optional, as-model regenerated, rich-db
   extended.
3. Transformation: the aggregation rule with the key rule, integrity
   translation, domain emission with the shared once-defined mapping
   module, multivalued and composite attribute rules, discriminator,
   binary-only error message reworded to name Aggregation,
   verify.mjs extended.
4. DDL: referential actions, CREATE DOMAIN and inline CHECK under
   DomainHandling, ReferentialActions with TriggerEmulation and the
   triggers document, dialect preset configurations, chain
   verification extended.
5. Documentation: the mapping-rules page, READMEs, catalog rows,
   CHANGELOG.
6. Merge --no-ff, full ladder repeated on merged main.

## Deferred, out of v2

withHistoryColumns; exhaustive dialect coverage (each future dialect
is a configuration model); the domain mapping as an installable model
(platform alignment, ADR-015); structured domain constraints;
categories (if decision 5 confirms); read-set capture and the other
v1 deferrals stand.

## Status

Drafted 2026-09-06 from the user discussions of 2026-09-05/06.
Awaiting the user's approval and the open-decision answers; no
building before that.

Decisions round 2026-09-06, same day: the user resolved 1 (the
connect/disconnect semantics, correcting the draft's delete/update
reading; the integrity and dialect sections were rewritten
accordingly, and triggers became first-class for connect rules), 2,
3, 6, 7, 8, 11 as recommended, 4 by re-stating the doctrine, and 9
as standard-sql plus postgres with the oracle preset dropped. New
decision 12 (Clustering) added from the user's physical-design
question, with the physical-design section. Still open: 5
(categories, explanation delivered), 10 (Entity scope, natural
naming, and the withAuditColumns word, explanation delivered), and
12 (clustering inclusion).
