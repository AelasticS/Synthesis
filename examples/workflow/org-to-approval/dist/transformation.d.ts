import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as ot from 'org-metamodel/model';
import * as wt from 'workflow-metamodel/model';
/** The run's parameter, handed through the engine's transform(source,
 * param) channel: whose document, and how many approval levels upward. */
export interface IApprovalParam {
    worker: string;
    sensitivity: number;
}
export declare class OrgToApprovalTransformation extends abstractM2M<ot.IOrganization, wt.IWorkflowModel, {}, IApprovalParam> {
    constructor(store: ModelStore);
    main(m: ot.IOrganization): ExprNode<ot.IOrganization, wt.IWorkflowModel>;
    OrgUnit2Approval(u: ot.IOrgUnit): ExprNode<wt.IStep>;
    Department2Approval(d: ot.IDepartment): ExprNode<wt.ITask>;
    Board2Approval(b: ot.IBoard): ExprNode<wt.IParallel>;
    private approvalParam;
    private workerNamed;
    private unitChainOf;
}
