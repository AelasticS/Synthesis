import * as e from "./EER.meta.model.type.js";
import { allowedAsTopLevelElement, ExprNode, } from "@aelastics/synthesis/jsx";
export const EERSchema = (props) => {
    return new ExprNode(e.EERSchema, props, undefined);
};
export const Kernel = (props) => {
    return new ExprNode(e.Kernel, 
    // { objectClassification: "Kernel", ...props },
    props, undefined);
};
export const ERConcept = (props) => {
    // If the props contain a $refByName, we assume it's a reference to an existing ERConcept
    // if (props.$refByName) {
    return new ExprNode(e.ERConcept, props, "elements");
    // }
};
export const Weak = (props) => {
    return new ExprNode(e.Weak, 
    // { objectClassification: "Weak", ...props },
    props, undefined);
};
export const Attribute = (props) => {
    return new ExprNode(e.Attribute, props, "attributes");
};
export const Domain = (props) => {
    return new ExprNode(e.Domain, props, "attrDomain");
};
export const Relationship = (props) => {
    return new ExprNode(e.Relationship, props, undefined);
};
export const OrdinaryMapping = (props) => {
    return new ExprNode(e.OrdinaryMapping, props, "roles");
};
// Nested in its weak entity (via weakMap; the inverse fills the
// codomain): the identification dependency is authored where it
// semantically lives.
export const WeakMapping = (props) => {
    return new ExprNode(e.WeakMapping, props, "weakMap");
};
// A first-class entity, authored at top level like any other; its
// membership is the supertype reference
// (supertype={<Specialization $refByName="Person/personRoles" />},
// scope-qualified because entities are name scopes). The "subtypes"
// connection also admits a membership graft, a Subtype reference
// child of a re-opened Specialization.
export const Subtype = (props) => {
    return new ExprNode(e.Subtype, props, allowedAsTopLevelElement("subtypes"));
};
// A specialization IS a mapping and nests inside its root entity,
// connecting into `mappings`; the inverse fills its domain (the root)
// at creation. Several specializations inside one entity are several
// independent categories of subtyping.
// allowedAsTopLevelElement keeps the re-opening idiom working
// (<Specialization $refByName="SubA/S1"> with membership children);
// a NEW specialization authored at top level renders but fails the
// declared root-presence constraint.
export const Specialization = (props) => {
    return new ExprNode(e.Specialization, props, allowedAsTopLevelElement("mappings"));
};
export const Aggregation = (props) => {
    return new ExprNode(e.Aggregation, props, undefined);
};
export const AggregationMapping = (props) => {
    return new ExprNode(e.AggregationMapping, props, "agrMapp");
};
export const Role = (props) => {
    return new ExprNode(e.OrdinaryMapping, props, "roles");
};
export const Entity = (props) => {
    return new ExprNode(e.Kernel, props, undefined);
};
//# sourceMappingURL=EER-components.js.map