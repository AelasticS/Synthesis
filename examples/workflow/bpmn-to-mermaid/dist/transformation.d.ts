/** @jsx createExprNode */
import type { ExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import type { M2T_Model } from '@aelastics/synthesis/m2t';
import type { ModelStore } from '@aelastics/synthesis/store';
import * as bm from 'bpmn-metamodel/model';
export declare class BpmnToMermaidTransformation extends abstractM2M<bm.IProcess, M2T_Model> {
    constructor(store: ModelStore);
    template(p: bm.IProcess): ExprNode<bm.IProcess, M2T_Model>;
    private outDegree;
    private inDegree;
    private countDegrees;
    private roleOf;
    nodeToLines(n: bm.INode, depth: number): ExprNode<any> | ExprNode<any>[];
    taskLine(t: bm.ITask, depth: number): ExprNode<any>;
    gatewayLine(g: bm.IGateway, depth: number): ExprNode<any>;
    startEventLine(e: bm.IStartEvent, depth: number): ExprNode<any>;
    endEventLine(e: bm.IEndEvent, depth: number): ExprNode<any>;
    subProcessLines(s: bm.ISubProcess, depth: number): ExprNode<any>[];
    flowToLine(f: bm.IFlow, depth: number): ExprNode<any>;
    private ind;
    private id;
}
