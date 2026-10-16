/** @jsx createExprNode */
import type { ExprNode } from "@aelastics/synthesis/jsx";
import * as rmT from "relational-metamodel/model";
/** The real columns of a table node: Column children carrying props,
 * not the $refByName references a PrimaryKey or Index holds. */
export declare const columnNodesOf: (table: ExprNode<rmT.ITable>) => ExprNode<rmT.IColumn>[];
/** A history copy of a column node: same name, type, nullability, and
 * domain reference; autoincrement stripped, because history rows
 * arrive with their values. */
export declare const copiedHistoryColumn: (c: ExprNode<rmT.IColumn>) => ExprNode<rmT.IColumn>;
export declare const withHistoryTable: (discriminator: () => ExprNode<rmT.IColumn>) => (table: () => ExprNode<rmT.ITable>) => () => ExprNode<rmT.ITable>[];
