/*
 * Copyright (c) AelasticS 2020.
 *
 * The full EER metamodel of the eer-to-sql suite (v2): entities scope
 * their attributes' names, attributes carry optionality and may be
 * composite one level deep, and domains are user-definable (base
 * type, check, default) on top of the primitive names. Relationships
 * are strictly binary by doctrine: relating more than two entities is
 * modeled as an Aggregation.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";
// tslint:disable-next-line:variable-name
export const EERModel_TypeSchema = t.schema("EERModelSchema");
// Integrity rules on associations: R restricts, C cascades, N
// nullifies, D sets the default. Each mapping carries a pair: cn, the
// CONNECT rule (the association is established: the referencing row
// inserted or its foreign key set), and dcn, the DISCONNECT rule (the
// association is broken: the row deleted or the key value changed).
export const IntegrityRule = t.string.derive().oneOf(["R", "C", "N", "D"]);
/** @deprecated Use IntegrityRule; kept as an alias for old imports. */
export const IntegityRule = IntegrityRule;
export const ERConcept = t.subtype(ModelElement, {
    conceptType: t.string
        .derive()
        .oneOf([
        "Domain",
        "Submodel",
        "EERSchema",
        "Attribute",
        "Entity",
        "Kernel",
        "Weak",
        "Aggregation",
        "Subtype",
        "Specialization",
        "Mapping",
        "WeakMapping",
        "AggregationMapping",
        "OrdinaryMapping",
        "Relationship",
    ]),
}, "ERConcept", EERModel_TypeSchema);
// A domain without a baseType IS a primitive name (number, string,
// boolean, ...). A user-defined domain names its base type and may
// carry a check (a boolean SQL expression over VALUE) and a default.
export const Domain = t.subtype(ERConcept, {
    baseType: t.optional(t.string),
    check: t.optional(t.string),
    defaultValue: t.optional(t.string),
}, "Domain", EERModel_TypeSchema);
export const Submodel = t.subtype(ERConcept, {
    concepts: t.arrayOf(ERConcept),
}, "Submodel", EERModel_TypeSchema);
export const EERSchema = t.subtype(Model, {
    submodels: t.arrayOf(Submodel),
}, "EERSchema", EERModel_TypeSchema);
export const Attribute = t.subtype(ERConcept, {
    // A leaf attribute carries its domain; a composite parent carries
    // components instead. Both links are filled by nesting, so they
    // are type-level optional (the Flow.from/to idiom).
    attrDomain: t.optional(Domain),
    attrEntity: t.optional(t.link(EERModel_TypeSchema, "Entity")),
    isKey: t.boolean,
    defaultValue: t.optional(t.string),
    // An optional attribute maps to a nullable column; absent means
    // mandatory.
    isOptional: t.optional(t.boolean),
    // One level of composition: the parts of a composite attribute.
    components: t.arrayOf(t.link(EERModel_TypeSchema, "Attribute")),
}, "Attribute", EERModel_TypeSchema);
export const Entity = t.subtype(ERConcept, {
    attributes: t.arrayOf(Attribute),
    mappings: t.arrayOf(t.link(EERModel_TypeSchema, "Mapping")),
    // A domain fact: an abstract entity has no direct instances (every
    // one belongs to a subtype). The mapping consequences are fixed
    // logic in the transformation, not a design option.
    isAbstract: t.optional(t.boolean),
}, "Entity", EERModel_TypeSchema);
t.inverseProps(Attribute, "attrEntity", Entity, "attributes");
// An entity scopes its attributes' names: every entity can carry its
// own `id`, and the samples use natural names throughout.
declareNamespace(Entity);
export const Kernel = t.subtype(Entity, {}, "Kernel", EERModel_TypeSchema);
export const Weak = t.subtype(Entity, {
    // Semantically exactly one weak mapping names the owner; the
    // OPTIONAL is a creation-order accommodation, not semantics: the
    // link is filled only when the WeakMapping element is authored,
    // later in the model, and the store auto-initializes mandatory
    // properties at creation (verified: a mandatory link here breaks
    // rendering). Subtype.supertype can stay mandatory because
    // nesting inside the Specialization fills it at creation time.
    // The transformation enforces the semantic rule (ownerOf).
    weakMap: t.optional(t.link(EERModel_TypeSchema, "WeakMapping")),
}, "Weak", EERModel_TypeSchema);
export const Aggregation = t.subtype(Entity, {
    // At least two participants: relating two or more entities is
    // what an aggregation is for (relationships stay binary). The
    // arity is declared as a validator below and enforced by the
    // transformation.
    agrMapp: t.arrayOf(t.link(EERModel_TypeSchema, "AggregationMapping")),
}, "Aggregation", EERModel_TypeSchema);
export const Subtype = t.subtype(Entity, {
    // Semantically exactly one specialization; type-level optional
    // because the canonical form is a top-level Subtype whose
    // supertype is a reference prop (the declared constraint below
    // enforces presence at the validation point).
    supertype: t.optional(t.link(EERModel_TypeSchema, "Specialization")),
    cnSupertype: IntegrityRule,
    dcnSupertype: IntegrityRule,
    cnSubtype: IntegrityRule,
    dcnSubtype: IntegrityRule,
}, "Subtype", EERModel_TypeSchema);
export const Mapping = t.subtype(ERConcept, {
    domain: Entity,
    lowerBound: t.string.derive().oneOf(["0", "1", "M", "m", "*"]), // .defaultValue("0"),
    upperBound: t.string.derive().oneOf(["1", "M", "m", "*"]), // .defaultValue("M"),
    cnMapp: IntegrityRule,
    dcnMapp: IntegrityRule,
}, "Mapping", EERModel_TypeSchema);
export const WeakMapping = t.subtype(Mapping, {
    codomain: Weak,
    cnWeakOwner: IntegrityRule,
    dcnWeakOwner: IntegrityRule,
}, "WeakMapping", EERModel_TypeSchema);
export const AggregationMapping = t.subtype(Mapping, {
    codomain: Aggregation,
    cnAggrOwner: IntegrityRule,
    dcnAggrOwner: IntegrityRule,
}, "AggregationMapping", EERModel_TypeSchema);
export const OrdinaryMapping = t.subtype(Mapping, {
    relationship: t.link(EERModel_TypeSchema, "Relationship", "relationship"),
}, "OrdinaryMapping", EERModel_TypeSchema);
// A specialization IS a mapping: from the root entity's instance set
// into the union of its subtypes' sets. The inherited facts carry the
// two classical constraints as cardinalities: lowerBound 0/1 is
// partial/total (completeness), upperBound 1/M is disjoint/overlapping
// (an instance may belong to several subtypes at once). It nests
// inside its root entity, connecting into `mappings`, whose inverse
// fills `domain` at creation; several specializations inside one
// entity are several independent categories of subtyping.
export const Specialization = t.subtype(Mapping, {
    subtypes: t.arrayOf(Subtype),
}, "Specialization", EERModel_TypeSchema);
export const Relationship = t.subtype(ERConcept, {
    // Exactly two roles, by doctrine: relationships are binary, and
    // relating more entities is modeled as an Aggregation. The arity
    // is declared as a validator below and enforced by the
    // transformation.
    roles: t.arrayOf(OrdinaryMapping),
}, "Relationship", EERModel_TypeSchema);
t.inverseProps(Relationship, "roles", OrdinaryMapping, "relationship");
t.inverseProps(Entity, "mappings", Mapping, "domain");
t.inverseProps(Weak, "weakMap", WeakMapping, "codomain");
t.inverseProps(Aggregation, "agrMapp", AggregationMapping, "codomain");
t.inverseProps(Subtype, "supertype", Specialization, "subtypes");
// ── semantic completeness constraints ────────────────────────────────
// Declared on the types, run only in a validation traversal: while a
// model renders it is legitimately incomplete (a Weak exists before
// its mapping, arrays grow one element at a time), so these are
// judgments about the finished model, never authoring-time checks.
Weak.addValidator({
    predicate: (v) => v.weakMap !== undefined,
    message: (_v, label) => `${label ?? "Weak"}: a weak entity needs exactly one weak mapping naming its owner`,
});
Aggregation.addValidator({
    predicate: (v) => (v.agrMapp?.length ?? 0) >= 2,
    message: (_v, label) => `${label ?? "Aggregation"}: an aggregation relates at least two participants`,
});
Relationship.addValidator({
    predicate: (v) => (v.roles?.length ?? 0) === 2,
    message: (_v, label) => `${label ?? "Relationship"}: a relationship is binary (exactly two roles); relate more entities with an Aggregation`,
});
Subtype.addValidator({
    predicate: (v) => v.supertype !== undefined && v.supertype !== null,
    message: (_v, label) => `${label ?? "Subtype"}: a subtype belongs to exactly one specialization`,
});
Specialization.addValidator({
    predicate: (v) => (v.subtypes?.length ?? 0) >= 1,
    message: (_v, label) => `${label ?? "Specialization"}: a specialization groups at least one subtype`,
});
Specialization.addValidator({
    predicate: (v) => v.domain !== undefined && v.domain !== null,
    message: (_v, label) => `${label ?? "Specialization"}: a specialization nests inside the entity it specializes`,
});
Attribute.addValidator({
    predicate: (v) => (v.components?.length ?? 0) > 0 || (v.attrDomain !== undefined && v.attrDomain !== null),
    message: (_v, label) => `${label ?? "Attribute"}: a leaf attribute takes its type from a domain; a composite attribute has components instead`,
});
const identityDependencies = (el) => {
    const e = el;
    const deps = [];
    const owner = e.weakMap?.domain;
    if (owner !== undefined)
        deps.push(owner);
    for (const m of (e.agrMapp ?? [])) {
        const participant = m?.domain;
        if (participant !== undefined)
            deps.push(participant);
    }
    const spec = e.supertype;
    const root = spec?.domain;
    if (root !== undefined)
        deps.push(root);
    return deps;
};
const elementsOnIdentityCycles = (schema) => {
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map();
    const offenders = new Set();
    const visit = (el, stack) => {
        const c = color.get(el) ?? WHITE;
        if (c === GRAY) {
            for (const s of stack.slice(stack.indexOf(el)))
                offenders.add(s);
            return;
        }
        if (c === BLACK)
            return;
        color.set(el, GRAY);
        stack.push(el);
        for (const d of identityDependencies(el))
            visit(d, stack);
        stack.pop();
        color.set(el, BLACK);
    };
    for (const el of (schema.elements ?? []))
        visit(el, []);
    return [...offenders];
};
EERSchema.addValidator({
    predicate: (v) => elementsOnIdentityCycles(v).length === 0,
    message: (v, label) => `${label ?? "EERSchema"}: cyclic identification dependency (weak ownership, aggregation participation, and subtyping must not loop) involving ${elementsOnIdentityCycles(v)
        .map((e) => String(e.name))
        .join(", ")}`,
});
export const getCodomain = (mapping) => {
    return getInverse(mapping).domain;
};
export const getInverse = (mapping) => {
    const first = mapping.relationship
        .roles[0];
    const second = mapping.relationship
        .roles[1];
    return first === mapping ? second : first;
};
//# sourceMappingURL=EER.meta.model.type.js.map