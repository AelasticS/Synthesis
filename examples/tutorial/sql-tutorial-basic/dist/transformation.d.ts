/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as m2tmm from '@aelastics/synthesis/m2t';
import * as rmT from 'rel-tutorial-metamodel/model';
export declare class RelToSqlBasicTransformation extends abstractM2M<rmT.IRelSchema, m2tmm.M2T_Model> {
    constructor(store: ModelStore);
    topRule(s: rmT.IRelSchema): any;
    tableToCreate(s: rmT.IRelSchema, tab: rmT.ITable): ExprNode<m2tmm.ISection>;
    private columnLine;
    private tablesOf;
    private tableOwning;
}
