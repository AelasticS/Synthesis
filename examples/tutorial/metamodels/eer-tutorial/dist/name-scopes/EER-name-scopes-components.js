import * as e from "./EER-name-scopes.meta.model.type.js";
import { defaultConnectionInfo, ExprNode, } from "@aelastics/synthesis/jsx";
export const EERSchema = (props) => {
    return new ExprNode(e.EERSchema, props, undefined);
};
export const Entity = (props) => {
    return new ExprNode(e.Entity, props, undefined);
};
export const Attribute = (props) => {
    return new ExprNode(e.Attribute, props, "attributes");
};
// In the scoped world a Domain appears in two contexts: declared once as
// model-level vocabulary (a direct child of the schema connects into
// `elements`) or referenced from an attribute (a child of an Attribute
// connects into `attrDomain`). Ordered candidates with first-available
// semantics pick the right one per context.
export const Domain = (props) => {
    return new ExprNode(e.Domain, props, defaultConnectionInfo(["attrDomain", "elements"]));
};
export const Relationship = (props) => {
    return new ExprNode(e.Relationship, props, undefined);
};
export const Role = (props) => {
    return new ExprNode(e.OrdinaryMapping, props, "roles");
};
//# sourceMappingURL=EER-name-scopes-components.js.map