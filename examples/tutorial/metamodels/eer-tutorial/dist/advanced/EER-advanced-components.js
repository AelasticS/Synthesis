import * as e from "./EER-advanced.meta.model.type.js";
import { ExprNode, } from "@aelastics/synthesis/jsx";
export const EERSchema = (props) => {
    return new ExprNode(e.EERSchema, props, undefined);
};
export const Entity = (props) => {
    return new ExprNode(e.Entity, props, undefined);
};
export const Kernel = (props) => {
    return new ExprNode(e.Kernel, props, undefined);
};
export const Weak = (props) => {
    return new ExprNode(e.Weak, props, undefined);
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
export const Role = (props) => {
    return new ExprNode(e.OrdinaryMapping, props, "roles");
};
//# sourceMappingURL=EER-advanced-components.js.map