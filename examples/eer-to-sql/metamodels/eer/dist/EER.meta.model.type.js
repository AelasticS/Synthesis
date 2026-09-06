/*
 * Copyright (c) AelasticS 2020.
 *
 * The full EER metamodel of the eer-to-sql suite (v2): entities scope
 * their attributes' names, attributes carry cardinality (nullability
 * and multivalued in one fact) and may be composite one level deep,
 * and domains are user-definable (base type, check, default) on top of
 * the primitive names. Relationships are strictly binary by doctrine:
 * relating more than two entities is modeled as an Aggregation.
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
        "SpecializationMapping",
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
    // Attribute cardinality, (1,1) when absent: lowerBound "0" makes
    // the attribute nullable, upperBound "M" makes it multivalued (an
    // own table in the relational mapping).
    lowerBound: t.optional(t.string.derive().oneOf(["0", "1"])),
    upperBound: t.optional(t.string.derive().oneOf(["1", "M"])),
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
    // arity is enforced by the transformation and validation, not
    // expressible on the array type.
    agrMapp: t.arrayOf(t.link(EERModel_TypeSchema, "AggregationMapping")),
}, "Aggregation", EERModel_TypeSchema);
export const Subtype = t.subtype(Entity, {
    supertype: t.link(EERModel_TypeSchema, "Specialization"),
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
export const SpecializationMapping = t.subtype(Mapping, {
    specialization: t.optional(t.link(EERModel_TypeSchema, "Specialization")),
}, "SpecializationMapping", EERModel_TypeSchema);
export const Specialization = t.subtype(ERConcept, {
    mapping: t.optional(SpecializationMapping),
    subtypes: t.arrayOf(Subtype),
}, "Specialization", EERModel_TypeSchema);
export const Relationship = t.subtype(ERConcept, {
    // Exactly two roles, by doctrine: relationships are binary, and
    // relating more entities is modeled as an Aggregation. The arity
    // is enforced by the transformation and validation.
    roles: t.arrayOf(OrdinaryMapping),
}, "Relationship", EERModel_TypeSchema);
t.inverseProps(Relationship, "roles", OrdinaryMapping, "relationship");
t.inverseProps(Entity, "mappings", Mapping, "domain");
t.inverseProps(Weak, "weakMap", WeakMapping, "codomain");
t.inverseProps(Aggregation, "agrMapp", AggregationMapping, "codomain");
t.inverseProps(Subtype, "supertype", Specialization, "subtypes");
t.inverseProps(Specialization, "mapping", SpecializationMapping, "specialization");
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