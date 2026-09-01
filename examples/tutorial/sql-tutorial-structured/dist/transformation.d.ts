/** @jsx createExprNode */
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as m2tmm from '@aelastics/synthesis/m2t';
import * as rmT from 'rel-tutorial-metamodel/model';
export declare class RelToSqlStructuredTransformation extends abstractM2M<rmT.IRelSchema, m2tmm.M2T_Model> {
    constructor(store: ModelStore);
    template(s: rmT.IRelSchema): any;
    private columnLine;
    private tablesOf;
    private foreignKeysOf;
    private tableOwning;
}
