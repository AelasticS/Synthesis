/*
 * Copyright (c) AelasticS 2020.
 *
 */
import * as t from "@aelastics/types";
import { ModelElement, Model } from "@aelastics/synthesis/metamodel";
// tslint:disable-next-line:variable-name
export const EERModel_TypeSchema = t.schema("EERModelSchema");
export const IntegityRule = t.string.derive().oneOf(["R", "C", "N", "D"]); // .defaultValue("R");
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
export const Domain = t.subtype(ERConcept, {}, "Domain", EERModel_TypeSchema);
export const Submodel = t.subtype(ERConcept, {
    concepts: t.arrayOf(ERConcept),
}, "Submodel", EERModel_TypeSchema);
export const EERSchema = t.subtype(Model, {
    submodels: t.arrayOf(Submodel),
}, "EERSchema", EERModel_TypeSchema);
export const Attribute = t.subtype(ERConcept, {
    attrDomain: Domain,
    attrEntity: t.link(EERModel_TypeSchema, "Entity"),
    isKey: t.boolean,
    defaultValue: t.optional(t.string),
}, "Attribute", EERModel_TypeSchema);
export const Entity = t.subtype(ERConcept, {
    attributes: t.arrayOf(Attribute),
    mappings: t.arrayOf(t.link(EERModel_TypeSchema, "Mapping")),
}, "Entity", EERModel_TypeSchema);
t.inverseProps(Attribute, "attrEntity", Entity, "attributes");
export const Kernel = t.subtype(Entity, {}, "Kernel", EERModel_TypeSchema);
export const Weak = t.subtype(Entity, {
    weakMap: t.optional(t.link(EERModel_TypeSchema, "WeakMapping")),
}, "Weak", EERModel_TypeSchema);
export const Aggregation = t.subtype(Entity, {
    agrMapp: t.arrayOf(t.link(EERModel_TypeSchema, "AggregationMapping")),
}, "Aggregation", EERModel_TypeSchema);
export const Subtype = t.subtype(Entity, {
    supertype: t.link(EERModel_TypeSchema, "Specialization"),
    cnSupertype: IntegityRule,
    dcnSupertype: IntegityRule,
    cnSubtype: IntegityRule,
    dcnSubtype: IntegityRule,
}, "Subtype", EERModel_TypeSchema);
export const Mapping = t.subtype(ERConcept, {
    domain: Entity,
    lb: t.string.derive().oneOf(["0", "1", "M", "m", "*"]), // .defaultValue("0"),
    ub: t.string.derive().oneOf(["1", "M", "m", "*"]), // .defaultValue("M"),
    cnMapp: IntegityRule,
    dcnMapp: IntegityRule,
}, "Mapping", EERModel_TypeSchema);
export const WeakMapping = t.subtype(Mapping, {
    codomain: Weak,
    cnWeakOwner: IntegityRule,
    dcnWeakOwner: IntegityRule,
}, "WeakMapping", EERModel_TypeSchema);
export const AggregationMapping = t.subtype(Mapping, {
    codomain: Aggregation,
    cnAggrOwner: IntegityRule,
    dcnAggrOwner: IntegityRule,
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
function asdf(r) {
    return ((r.roles[0].lb === "0" || r.roles[0].ub === "1") && r.roles[1].ub === "M") ||
        ((r.roles[1].lb === "0" || r.roles[1].ub === "1") && r.roles[0].ub === "M");
}
//# sourceMappingURL=EER.meta.model.type.js.map