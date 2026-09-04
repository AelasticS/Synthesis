/** @jsx createExprNode */
import type { ExprNode } from "@aelastics/synthesis/jsx";
import * as rmT from "relational-metamodel/model";
export declare const withAuditColumns: (table: string) => (columns: () => ExprNode<rmT.IColumn>[]) => () => ExprNode<rmT.IColumn>[];
