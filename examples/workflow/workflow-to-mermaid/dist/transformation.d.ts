/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { M2T_Model } from '@aelastics/synthesis/m2t';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as wm from 'workflow-metamodel/model';
export declare class WorkflowToMermaidTransformation extends abstractM2M<wm.IProcess, M2T_Model> {
    constructor(store: ModelStore);
    template(p: wm.IProcess): ExprNode<wm.IProcess, M2T_Model>;
    private activityLines;
    private taskLines;
    private sequenceLines;
    private parallelLines;
    private subProcessLines;
    private blockLines;
    private ind;
    private labelOf;
    private id;
}
