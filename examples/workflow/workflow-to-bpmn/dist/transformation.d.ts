/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as wm from 'workflow-metamodel/model';
import * as bm from 'bpmn-metamodel/model';
/** A flow endpoint: the node's name and concept kind (for the reference tag). */
interface Port {
    name: string;
    kind: 'task' | 'gateway' | 'subprocess' | 'start' | 'end';
}
/** What an activity contributes: nodes, flows, and its entry/exit ports. */
interface Fragment {
    nodes: ExprNode<bm.INode>[];
    flows: ExprNode<bm.IFlow>[];
    entry: Port;
    exit: Port;
}
export declare class WorkflowToBpmnTransformation extends abstractM2M<wm.IProcess, bm.IProcess> {
    private flowCount;
    private parCount;
    constructor(store: ModelStore);
    template(p: wm.IProcess): ExprNode<wm.IProcess, bm.IProcess>;
    activityFragment(a: wm.IActivity): Fragment;
    taskFragment(t: wm.ITask): Fragment;
    sequenceFragment(children: wm.IActivity[]): Fragment;
    parallelFragment(p: wm.IParallel): Fragment;
    subProcessFragment(s: wm.ISubProcess): Fragment;
    taskToNode(t: wm.ITask): ExprNode<bm.ITask>;
    parallelToSplitGateway(p: wm.IParallel, name: string): ExprNode<bm.IGateway>;
    parallelToJoinGateway(p: wm.IParallel, name: string): ExprNode<bm.IGateway>;
    subProcessToNode(s: wm.ISubProcess): ExprNode<bm.ISubProcess>;
    flow(from: Port, to: Port): ExprNode<bm.IFlow>;
    private nodeRef;
    private childrenOf;
    private topLevelActivities;
}
export {};
