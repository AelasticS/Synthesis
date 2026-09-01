import * as r from "./REL-tutorial.meta.model.type.js";
import { ExprNode, } from "@aelastics/synthesis/jsx";
export const RelSchema = (props) => {
    return new ExprNode(r.RelSchema, props, undefined);
};
export const Table = (props) => {
    return new ExprNode(r.Table, props, undefined);
};
export const Column = (props) => {
    return new ExprNode(r.Column, props, "columns");
};
//# sourceMappingURL=REL-tutorial-components.js.map