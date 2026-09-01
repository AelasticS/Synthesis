// JSX template components for the full relational metamodel of the
// eer-to-sql example suite. The data-type schemas live in model.ts.
import * as r from "./model.js";
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
//# sourceMappingURL=components.js.map