/** @jsx createExprNode */
import type { ExprNode } from '@synthesis/jsx-runtime';
import { abstractM2M } from '@synthesis/engine';
import type { ModelStore } from '@synthesis/engine';
import * as m2tmm from '@synthesis/engine';
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model';
/** One foreign key: the column that points, and the column it points at. */
type ForeignKey = {
    table: rmT.ITable;
    column: rmT.IColumn;
    targetTable: rmT.ITable;
    targetColumn: rmT.IColumn;
};
export declare class RelToSqlStructuredTransformation extends abstractM2M<rmT.IRelSchema, m2tmm.M2T_Model> {
    constructor(store: ModelStore);
    template(s: rmT.IRelSchema): any;
    tableToCreate(tab: rmT.ITable): ExprNode<m2tmm.ISection>;
    foreignKeyToAlter(fk: ForeignKey): ExprNode<m2tmm.ISection>;
    private columnLine;
    private tablesOf;
    private foreignKeysOf;
    private tableOwning;
}
export {};
