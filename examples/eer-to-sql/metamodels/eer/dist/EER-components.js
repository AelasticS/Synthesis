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
export const WeakMapping = (props) => {
    return new ExprNode(e.WeakMapping, props, undefined);
};
// Nested in its Specialization (via subtypes, which also maintains the
// supertype inverse) or authored at top level with an explicit link.
export const Subtype = (props) => {
    return new ExprNode(e.Subtype, props, allowedAsTopLevelElement("subtypes"));
};
// A specialization is a top-level element of the schema; its parts
// (mapping, subtypes) nest inside it.
export const Specialization = (props) => {
    return new ExprNode(e.Specialization, props, undefined);
};
export const SpecializationMapping = (props) => {
    return new ExprNode(e.SpecializationMapping, props, "mapping");
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