/** @jsx createExprNode */
import type { ExprNode } from '@synthesis/jsx-runtime';
import { abstractM2M } from '@synthesis/engine';
import type { ModelStore } from '@synthesis/engine';
import * as m2tmm from '@synthesis/engine';
import * as rmT from '@synthesis/standard-metamodels/rel-tutorial/model';
export declare class RelToSqlBasicTransformation extends abstractM2M<rmT.IRelSchema, m2tmm.M2T_Model> {
    constructor(store: ModelStore);
    template(s: rmT.IRelSchema): any;
    tableToCreate(s: rmT.IRelSchema, tab: rmT.ITable): ExprNode<m2tmm.ISection>;
    private columnLine;
    private tablesOf;
    private tableOwning;
}
