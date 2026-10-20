import * as r from "./REL.meta.model.type.js";
import { ExprNode } from "@aelastics/synthesis/jsx";
export const RelSchema = (props) => {
    return new ExprNode(r.RelSchema, props, undefined);
};
export const Domain = (props) => {
    return new ExprNode(r.Domain, props, "domain");
};
export const Column = (props) => {
    return new ExprNode(r.Column, props, "columns");
};
export const Table = (props) => {
    return new ExprNode(r.Table, props, undefined);
};
//# sourceMappingURL=REL-components.js.map