/*
 * Name-scopes tutorial EER metamodel (model-to-model tutorial, Part 4).
 * Structurally identical to the `basic` stage; the one difference is a
 * naming rule. Entity is declared a name scope, so attribute names are
 * unique per entity rather than per model: every entity can carry its
 * own `id`, and a reference into a sibling scope is a path such as
 * `Author/id`. Domains stay model-level vocabulary that bare references
 * still reach through outward probing.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";
export const EERTutorialNameScopes_TypeSchema = t.schema("EERTutorialNameScopesSchema");
export const EERSchema = t.subtype(Model, {}, "EERSchema", EERTutorialNameScopes_TypeSchema);
export const Domain = t.subtype(ModelElement, {}, "Domain", EERTutorialNameScopes_TypeSchema);
export const Attribute = t.subtype(ModelElement, {
    attrDomain: Domain,
    attrEntity: t.link(EERTutorialNameScopes_TypeSchema, "Entity"),
    isKey: t.boolean,
}, "Attribute", EERTutorialNameScopes_TypeSchema);
export const Entity = t.subtype(ModelElement, {
    attributes: t.arrayOf(Attribute),
}, "Entity", EERTutorialNameScopes_TypeSchema);
t.inverseProps(Attribute, "attrEntity", Entity, "attributes");
// An entity scopes its attributes' names.
declareNamespace(Entity);
export const Mapping = t.subtype(ModelElement, {
    domain: Entity,
    lb: t.string.derive().oneOf(["0", "1", "M"]),
    ub: t.string.derive().oneOf(["1", "M"]),
}, "Mapping", EERTutorialNameScopes_TypeSchema);
export const OrdinaryMapping = t.subtype(Mapping, {
    relationship: t.link(EERTutorialNameScopes_TypeSchema, "Relationship", "relationship"),
}, "OrdinaryMapping", EERTutorialNameScopes_TypeSchema);
export const Relationship = t.subtype(ModelElement, {
    roles: t.arrayOf(OrdinaryMapping),
}, "Relationship", EERTutorialNameScopes_TypeSchema);
//# sourceMappingURL=EER-name-scopes.meta.model.type.js.map