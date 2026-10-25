/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { M2T_Model } from '@aelastics/synthesis/m2t';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as wm from 'workflow-metamodel/model';
export declare class WorkflowToMermaidTransformation extends abstractM2M<wm.IWorkflowModel, M2T_Model> {
    private genIds;
    private genCounts;
    constructor(store: ModelStore);
    main(m: wm.IWorkflowModel): ExprNode<wm.IWorkflowModel, M2T_Model>;
    private stepWiring;
    private taskWiring;
    private invocationWiring;
    private bodyWiring;
    private parallelWiring;
    private choiceWiring;
    private choiceLabelOf;
    private loopWiring;
    private edge;
    private labelOf;
    private occurrenceDisplayOf;
    private idOf;
    private kindKeyOf;
    private sanitizedId;
    private calledOf;
    private childrenOf;
    private branchesOf;
    private stepsOf;
    private entryProcessOf;
}
