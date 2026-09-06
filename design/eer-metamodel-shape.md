# The EER metamodel shape: nesting, specialization as a mapping, and the constraint audit

The user's review of the suite page (2026-09-06/07) surfaced three
connected language problems, resolved in discussion; this record fixes
the outcomes and the plan.

## The decisions (user, 2026-09-07)

**WeakMapping nests in its weak entity.** The identification
dependency is a fact OF the weak entity, so it is authored there; the
existing `Weak.weakMap`/`WeakMapping.codomain` inverse fills the
backlink. The sibling form goes away.

**Specialization IS a mapping (option B2).** The user's semantics: a
specialization maps the root entity's instance set into the union of
its subtypes' sets, and its cardinalities carry the two classical
constraints, completeness (lowerBound 0 partial, 1 total) and
disjointness (upperBound 1 disjoint, M overlapping). The metamodel now
says exactly that: `Specialization` becomes a SUBTYPE OF `Mapping`
(inheriting `domain`, the bounds, and the `cnMapp`/`dcnMapp` pair)
carrying only `subtypes` of its own, and it nests inside its root
entity, connecting into the existing `Entity.mappings` containment
whose inverse fills `domain` at creation (first regime: filled at
creation, so no constraint needed for the root link).
`SpecializationMapping` is removed without trace: with nesting, naming
the root was its only remaining job. Subtypes stay FIRST-CLASS and
top-level, like any entity (the user rejected deep nesting): a
subtype declares its membership with a reference,
`supertype={<Specialization $refByName="Person/personRoles" />}`,
scope-qualified because entities are name scopes. Several
specializations inside one entity are several independent categories
of subtyping. A specialization nested inside a Subtype is the natural
authoring for multi-level hierarchies; the transformation keeps its
one-level guard.

```tsx
<Entity name="Person" isAbstract={true}>
  <Attribute name="id" isKey={true}><Domain $refByName="number" /></Attribute>
  <Specialization name="personRoles" lowerBound="0" upperBound="1" cnMapp="R" dcnMapp="R" />
</Entity>
<Subtype name="Member" supertype={<Specialization $refByName="Person/personRoles" />}>
  <Attribute name="since" isKey={false} isOptional={true}><Domain $refByName="string" /></Attribute>
</Subtype>
```

**The constraint audit (the two regimes, user-confirmed).** A link
filled at creation may be type-level mandatory (Specialization.domain
via the mappings inverse). A link filled later cannot be forced by
JSX, so the type stays optional and the mandatoriness is a declared
constraint at the validation point. Existing validators stay (weak
mapping presence, aggregation arity, binary relationships, schema
acyclicity); the audit adds: a subtype belongs to exactly one
specialization (`supertype` becomes type-level optional, since it is
now reference-filled), a specialization groups at least one subtype,
and a leaf attribute has a domain (composite parents have components
instead); the last was previously only a mid-run transformation
error.

**Bounds-aware SingleTable (user's rule).** The discriminator follows
the specialization's own semantics: disjoint (upperBound 1) emits
`type`, NOT NULL exactly when the specialization is total
(lowerBound 1); overlapping emits NO discriminator, membership being
carried by the subtype columns themselves (a flag column per subtype
is a deferred emission option). Riding along, an honesty fix: subtype
columns grafted into a single table are always nullable, because rows
of other subtypes (and, under partial specialization, of no subtype)
have no value for them. JoinedTables and TablePerClass ignore the
bounds, correctly: joins handle overlap naturally, and totality has
no declarative relational form (deferred as a possible trigger stub).

## Mechanics verified before building

`allowedAsTopLevelElement("subtypes")` on the Subtype component
already supports the top-level form. `Entity.mappings` with its
`Mapping.domain` inverse is the nesting slot for Specialization, so
NO new metamodel property is needed anywhere. A model's `elements[]`
holds every element flat regardless of nesting (the entities and
hierarchies passes keep their filters). Cycles for the negative
acyclicity tests remain authorable through the re-opening idiom
(`<Weak $refByName="WA"><WeakMapping .../></Weak>`, and a
`<Specialization $refByName="SubB/S2"><Subtype $refByName="SubA" /></Specialization>`
membership graft), even though the nested canonical forms cannot
express a forward reference, which is itself a small win: nonsense
got harder to write.

## Ripple

Metamodel and components (WeakMapping connInfo `weakMap`;
Specialization subtypes Mapping, connInfo `mappings`, loses `mapping`;
SpecializationMapping type, component, conceptType literal, exports,
as-model mirror entries all removed; Subtype.supertype optional; new
validators). Acyclicity walker reads `spec.domain`. Transformation:
`rootOf` reads `spec.domain`, `hierarchyOfRoot`/`skipsOwnTable` read
`entity.mappings` for Specializations (an abstract root skips its own
table only when EVERY hierarchy it roots is TablePerClass),
`singleTableHierarchy` implements the bounds rule. Samples rewritten
to the new forms; library gains an overlapping specialization on
Author (Reviewer/Editor) so both discriminator branches are
verifiable; verification gains a SingleTable run asserting the
nullable discriminator on the partial-disjoint hierarchy, the absent
discriminator on the overlapping one, nullable grafted subtype
columns, and the three new constraint rejections. Docs: the suite
page's fragments and hierarchy semantics, the rule-by-rule heading
restructure already agreed, CHANGELOG. Tutorial metamodels untouched,
as always.

## Execution

Branch feat/eer-metamodel-shape off main (worktree
Synthesis-wt-history). Stages, each on the ladder: 1 metamodel +
samples + verification negatives, 2 transformation + SingleTable run,
3 docs and CHANGELOG. Merge --no-ff, ladder on main, no push.

## Status

Drafted 2026-09-07 after the user's B2 decision; committed as stage 0.
