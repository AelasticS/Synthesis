/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Graph-based BPMN to Mermaid flowchart text. One document per process:
 * a node declaration line per node (tasks as boxes, gateways as
 * diamonds, events as stadium shapes, sub-processes as nested
 * subgraphs) followed by an edge line per flow. Which line a node gets
 * is decided by specialization: one pure-dispatch point, one option per
 * node kind.
 */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m';
import { M2T, Doc, P } from '@aelastics/synthesis/m2t';
import * as bm from 'bpmn-metamodel/model';
export class BpmnToMermaidTransformation extends abstractM2M {
    constructor(store) {
        super(store);
    }
    template(p) {
        return (createExprNode(M2T, { name: `${p.name}_mermaid` },
            createExprNode(Doc, { name: `${p.name}.mmd` },
                createExprNode(P, null, 'flowchart TD'),
                (p.nodes ?? []).flatMap((n) => this.nodeToLines(n, 1)),
                (p.flows ?? []).map((f) => this.flowToLine(f, 1)))));
    }
    nodeToLines(n, depth) {
        return undefined; // pure dispatcher: the matching option supplies the lines
    }
    taskLine(t, depth) {
        return createExprNode(P, null, `${this.ind(depth)}${this.id(t.name)}["${t.name}"]`);
    }
    gatewayLine(g, depth) {
        return createExprNode(P, null, `${this.ind(depth)}${this.id(g.name)}{"${g.kind}"}`);
    }
    startEventLine(e, depth) {
        return createExprNode(P, null, `${this.ind(depth)}${this.id(e.name)}(["${e.name}"])`);
    }
    endEventLine(e, depth) {
        return createExprNode(P, null, `${this.ind(depth)}${this.id(e.name)}(["${e.name}"])`);
    }
    subProcessLines(s, depth) {
        return [
            createExprNode(P, null, `${this.ind(depth)}subgraph ${this.id(s.name)}["${s.name}"]`),
            ...(s.nodes ?? []).flatMap((n) => this.nodeToLines(n, depth + 1)),
            ...(s.flows ?? []).map((f) => this.flowToLine(f, depth + 1)),
            createExprNode(P, null, `${this.ind(depth)}end`),
        ];
    }
    flowToLine(f, depth) {
        const guard = f.guard ? `|${f.guard}|` : '';
        return (createExprNode(P, null, `${this.ind(depth)}${this.id(f.from.name)} -->${guard} ${this.id(f.to.name)}`));
    }
    ind(depth) {
        return '  '.repeat(depth);
    }
    // Some words are reserved in Mermaid flowcharts; a reserved node name
    // gets a suffix in the diagram id while the label keeps the model name.
    id(name) {
        return ['end', 'subgraph', 'graph', 'direction'].includes(name) ? `${name}_node` : name;
    }
}
__decorate([
    SpecPoint()
], BpmnToMermaidTransformation.prototype, "nodeToLines", null);
__decorate([
    SpecOption('nodeToLines', bm.Task)
], BpmnToMermaidTransformation.prototype, "taskLine", null);
__decorate([
    SpecOption('nodeToLines', bm.Gateway)
], BpmnToMermaidTransformation.prototype, "gatewayLine", null);
__decorate([
    SpecOption('nodeToLines', bm.StartEvent)
], BpmnToMermaidTransformation.prototype, "startEventLine", null);
__decorate([
    SpecOption('nodeToLines', bm.EndEvent)
], BpmnToMermaidTransformation.prototype, "endEventLine", null);
__decorate([
    SpecOption('nodeToLines', bm.SubProcess)
], BpmnToMermaidTransformation.prototype, "subProcessLines", null);
//# sourceMappingURL=transformation.js.map