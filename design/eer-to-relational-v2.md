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

Shipped preset configurations, decision 9 AMENDED and RESOLVED in
the second round 2026-09-06: THREE presets, `standard-sql` (the
default), `postgres`, and `oracle`, with the user's requirement that
the dialect presets be built BY EXTENSION: postgres and oracle are
authored as the standard-sql choices plus deltas, demonstrating
configuration reuse (see the extension section below). postgres
takes every disconnect action natively, selects EmitDomains
(PostgreSQL has CREATE DOMAIN), and emits one-time CLUSTER
statements for the physical option. oracle selects TriggerEmulation
for update rules (classic Oracle has no ON UPDATE actions),
InlineTypes (SQL domains only arrived in Oracle 23ai; the preset
targets the widely deployed releases), and emits index-organized
tables for the physical option. Exhaustive dialect coverage is a
product, not an example; any future dialect is one more
configuration model.

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
PostgreSQL has no maintained clustered indexes: CLUSTER is a
one-time physical reordering, refreshed only by running it again.
Under the oracle preset the same logical choice emits an
index-organized table (`ORGANIZATION INDEX` on CREATE TABLE), which
IS maintained continuously: one logical option, two dialect-true
physical emissions, which is the whole point of keeping physical
design in configurations. Deeper physical
design (partitioning, fillfactor, tablespaces, covering indexes) is
deferred to its own future workstream; each item would be one more
issue in this same design space.

## Extending configurations, and models in general

The user's wider question: how do postgres and oracle extend
standard-sql, and how are models extended and customized at all.
Three levels, the first in scope for v2.

Level one, composition in the authoring language, IN v2: a
configuration model is a JSX program, so reuse is ordinary import
and spread. The standard-sql choices are exported as fragments from
a shared module; the postgres and oracle configurations import them,
spread them, and override or add exactly the choices where they
differ. This is the withAuditColumns pattern applied to
configurations, it needs no engine changes, and authoring the three
presets this way is itself the demonstration the user asked to see.

Level two, configuration LAYERING at run time, recorded as a
follow-up, NOT in v2: `transformation run --config dialect --config
project`, later choices winning per issue, so a project closes its
own decisions on top of a dialect preset without copying it. A CLI
and decision-framework feature (merge semantics over choice lists)
with real value and moderate cost.

Level three, the platform horizon: extension as a RELATIONSHIP
between models (a configuration referencing its base, resolution
merging at load), which per ADR-015 belongs to the envelope and the
platform's model repository, alongside general model overlays. Out
of scope here; noted for the platform-alignment workstream.

## Declared constraints and the validation point

Added to scope 2026-09-06 (decision 13, from the user's metamodel
review). The EER metamodel declares its semantic rules on the types
with addValidator: weak-mapping presence, aggregation arity (at least
two participants), binary relationships (the message teaches the
doctrine: relate more entities with an Aggregation), and ONE
schema-level identification-dependency acyclicity rule on EERSchema,
walking the combined graph of weak ownership, aggregation
participation, and subtyping with a colored DFS, once per validation,
its message naming the elements on the cycles. Both refinements are
the user's review catches: kind-local walkers miss mixed cycles (a
weak entity owned by an aggregation it participates in is the
canonical case) and subtyping belongs in the same graph (round two);
a whole-graph rule belongs on the schema, run once, and the walker is
typed with the metamodel's own interfaces rather than unknown (round
three). The suite verification rejects all five doctrine violations
through the real CLI: a weak chain cycle, the mixed weak-aggregation
cycle, a subtype cycle, a one-participant aggregation, a one-role
relationship.
Validators run only in a validation traversal, never during authoring
or rendering, because a model under construction is legitimately
incomplete; the creation-order rule follows: a backlink on a child
(Subtype.supertype) may be mandatory, a slot filled by a later
element (Weak.weakMap) stays type-level optional with the
completeness rule declared as a constraint.

The traversal is a library helper (metamodel-core
checkModelConstraints: every element checked against its concrete
type's validators via checkValidators, shallow, no deep structural
recursion) and the CLI's `model validate` runs it after the gate
render, reporting each violation with the rule's own message; the
import gate is intentionally unchanged (gate-time enforcement is a
recorded follow-up option). Documented in the defining-metamodels
guide (Constraints section) and the managing-models user guide; the
tutorial stays untouched per the standing simplicity directive.

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
10, RESOLVED 2026-09-06: adopted. Verified in v1 discussions: no
flagship sample references attributes across entities, so nothing
breaks structurally; the samples rename to natural attribute names
(`id`, `title`), which flows through attributeToColumn into
naturally named columns exactly as tutorial Part 4 demonstrated.

The withAuditColumns simplification is CONFIRMED by the user
2026-09-06 (decision 10) and SUPERSEDES the qualified form confirmed
in v1: the audit step takes no table argument and emits plain
`createdBy` and `createdAt` columns, unique inside their table's
scope; the zero-argument step shape and the Approval-style
composition are preserved, only the qualifier is gone. The new
authoritative form:

```tsx
withAuditColumns = (columns: () => ExprNode<rmT.IColumn>[]) =>
  (): ExprNode<rmT.IColumn>[] => [
    ...columns(),
    <Column name="createdBy" type="VARCHAR(255)" isKey={false} isNullable={false} isAutoincrement={false} />,
    <Column name="createdAt" type="DATE" isKey={false} isNullable={false} isAutoincrement={false} />,
  ]
```

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
5. Categories/union types. RESOLVED 2026-09-06: OUT. The user's
   language covers classification with multiple independent
   specializations of one entity (a Person specialized by gender
   and, separately, by occupation into student or worker) and has
   no union concept, so nothing is missing.
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
    withAuditColumns form. RESOLVED 2026-09-06: Entity IS a name
    scope, samples take natural names, and the user explicitly
    confirmed the SIMPLIFIED audit form (no table-name prefix); the
    new authoritative form is in the names-and-scopes section and
    supersedes v1's qualified form.
11. IntegityRule typo. RESOLVED 2026-09-06 as recommended: rename to
    IntegrityRule with a deprecated alias.
12. Clustering (new, from the user's physical-design question).
    RESOLVED 2026-09-06: in, as proposed; the oracle preset emits
    index-organized tables for the same logical option. Alongside,
    the user grew decision 9 to three presets built by extension.
13. Declared constraints and the validation point (new, from the
    user's metamodel review). RESOLVED 2026-09-06: in scope as the
    section above describes; import-gate enforcement stays a
    follow-up.

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

withHistoryColumns; constraint representation in the
metamodel-as-model (a Constraint concept in the types meta-metamodel;
belongs with the platform's metamodel-as-data contract);
Union-of-Literals value restrictions in the as-models (expressible
today, flat-name-pool caution); exhaustive dialect coverage (each
future dialect is a configuration model); configuration layering at
run time
(--config stacking with per-issue precedence, level two of the
extension section); model extension as an envelope relationship
(level three, platform alignment, ADR-015); the domain mapping as an
installable model (platform alignment); structured domain
constraints; categories (decision 5: out); deeper physical design
(partitioning, fillfactor, tablespaces); read-set capture and the
other v1 deferrals stand.

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

Round two, 2026-09-06, ALL TWELVE decisions resolved: 5 out
(multiple independent specializations cover classification, no
union concept in the language), 10 adopted with the SIMPLIFIED
withAuditColumns form explicitly confirmed (supersedes v1's
qualified form), 12 in with the oracle index-organized-table
emission, and 9 re-amended to three presets (standard-sql, postgres,
oracle) BUILT BY EXTENSION, which added the extension section and
two new deferred items (configuration layering; model extension in
the platform envelope). The record is decision-complete; awaiting
the user's word to open the worktree and start stage 1.

Stage 1 (EER metamodel v2) COMPLETE 2026-09-06, commit a9a70f4, full
ladder green on the branch: the scoped attribute-rich metamodel
(Entity a namespace, attribute lb/ub cardinality, one-level
components, user-definable Domain with baseType/check/defaultValue,
IntegrityRule renamed with the deprecated alias, dead code removed),
Attribute and Domain components on ordered candidates, samples
renamed to natural names with model-level domain vocabulary,
rich-library extended (Money domain, multivalued phones, composite
address), the audit template switched to the confirmed simplified
form (folded into this stage: it shares its verify expectations with
the renames), both suite verifications updated. Deviations, both
recorded here: the Loan aggregation joins library.tsx in stage 3
(that sample is transformed on every smoke and the aggregation rule
does not exist yet), and the draft's claim that SingleTable emits no
discriminator was wrong, v1 already emits `<root>_type`, so stage 3
merely renames it to the scoped `type` per decision 8. One engine fix
surfaced by scoped sources: the default-configuration generator named
element choices by bare element name and collided on the three `id`
attributes; it now derives scope-qualified names from element paths
(an element's `path` is its container's path, so the element name is
appended; flat models keep their old names; one CLI fixture model and
one test marker updated).

Stage 2 (relational metamodel v2) COMPLETE 2026-09-06, commit
481ddef, full ladder green: the ReferentialAction vocabulary,
ForeignKey onDelete/onUpdate, Domain wired (check added, optional
Column.domain link, Column.type kept as the resolved string), the
as-model mirror extended under its flat property-name-pool convention
(domainType, domainCheck, domainDefault, columnDomain, fkOnDelete,
fkOnUpdate), and rich-db exercising a checked money domain, a
domain-linked column, and actions on the composite foreign key.
PAUSED at the user's request for the metamodel review before stage 3
begins.

Review round one, 2026-09-06, folded in (commits f813839, e012885 and
the constraint slice): full cardinality names lowerBound/upperBound
across the metamodel, samples, transformation, binding condition, and
CLI fixtures; the at-least-two aggregation arity with the BookSeries
sample gaining Publisher; the binary doctrine commented on
Relationship; weakMap kept optional with the verified creation-order
reason documented (a mandatory link breaks rendering; backlinks
filled at child creation may be mandatory). Decision 13 delivered:
doctrine constraints plus acyclicity walkers declared on the EER
types, the checkModelConstraints helper (library test), `model
validate` running the traversal (CLI tests; suite verification
asserts the positive run and three negative rejections through the
real CLI), docs in defining-metamodels and managing-models. The
relational metamodel still awaits the user's review comments.

Relational review round, 2026-09-06: the package files renamed to the
EER package's convention (REL.meta.model.type.ts, REL-components.ts;
the public specifiers relational-metamodel and /model are unchanged,
only the exports map moved), and PrimaryKey introduced as a
first-class named constraint: an ordered column list with the
Table.primaryKey single containment and ownerTable inverse, an
at-least-one-column declared constraint, the as-model mirror
(PrimaryKey, tablePrimaryKey), and rich-db demonstrating a single and
a composite key. What it buys: named PK constraints in DDL (symmetric
with the ALTER TABLE foreign keys), explicit column ORDER for
composite keys (previously implicit in emission order), the
attachment point decision 12's Clustering emission needs (CLUSTER
USING and ORGANIZATION INDEX address the key by name), and the
derived-fact principle applied to key-ness: Column.isKey stays only
until stage 3/4 emit and read PrimaryKey, then it is dropped.

Review round four delivered the metamodel-as-model namespace marker:
the types meta-metamodel's Object concept carries an optional
isNamespace boolean, and both suite as-models declare it truthfully
(Entity and Table); constraint representation and Union-of-Literals
value restrictions are recorded as named follow-ups in the deferred
list.
