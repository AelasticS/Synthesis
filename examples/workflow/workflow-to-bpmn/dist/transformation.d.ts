import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as wm from 'workflow-metamodel/model';
import * as bm from 'bpmn-metamodel/model';
/** What an activity contributes to the enclosing graph: nodes and flows. */
type GraphPart = ExprNode<bm.INode> | ExprNode<bm.IFlow>;
export declare class WorkflowToBpmnTransformation extends abstractM2M<wm.IProcess, bm.IProcess> {
    private flowCount;
    private parCount;
    private parNames;
    constructor(store: ModelStore);
    template(p: wm.IProcess): ExprNode<wm.IProcess, bm.IProcess>;
    activityToGraph(a: wm.IActivity): GraphPart | GraphPart[];
    taskToGraph(t: wm.ITask): ExprNode<bm.ITask>;
    subProcessToGraph(s: wm.ISubProcess): ExprNode<bm.ISubProcess>;
    sequenceToGraph(q: wm.ISequence): GraphPart[];
    parallelToGraph(p: wm.IParallel): GraphPart[];
    toEntryOf(a: wm.IActivity): ExprNode<bm.INode>;
    toEntryOfTask(t: wm.ITask): ExprNode<bm.INode>;
    toEntryOfSubProcess(s: wm.ISubProcess): ExprNode<bm.INode>;
    toEntryOfSequence(q: wm.ISequence): ExprNode<bm.INode>;
    toEntryOfParallel(p: wm.IParallel): ExprNode<bm.INode>;
    fromExitOf(a: wm.IActivity): ExprNode<bm.INode>;
    fromExitOfTask(t: wm.ITask): ExprNode<bm.INode>;
    fromExitOfSubProcess(s: wm.ISubProcess): ExprNode<bm.INode>;
    fromExitOfSequence(q: wm.ISequence): ExprNode<bm.INode>;
    fromExitOfParallel(p: wm.IParallel): ExprNode<bm.INode>;
    private chainFlows;
    private nextFlowName;
    private baseOf;
    private childrenOf;
    private rootOf;
}
export {};
