var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m';
import * as wm from 'workflow-metamodel/model';
import { Process, Task, StartEvent, EndEvent, Gateway, SubProcess, Flow, FromNode, ToNode } from 'bpmn-metamodel';
export class WorkflowToBpmnTransformation extends abstractM2M {
    flowCount = 0;
    parCount = 0;
    parNames = new Map();
    constructor(store) {
        super(store);
    }
    template(p) {
        const root = this.rootOf(p);
        return (createExprNode(Process, { name: `${p.name}_bpmn`, store: this.context.store },
            createExprNode(StartEvent, { name: "start" }),
            this.activityToGraph(root),
            createExprNode(EndEvent, { name: "end" }),
            createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": "start" }),
                this.toEntryOf(root)),
            createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(root),
                createExprNode(ToNode, { "$refByName": "end" }))));
    }
    // ----- the graph rule: one pure-dispatch point, one option per kind ----
    activityToGraph(a) {
        return undefined; // pure dispatcher: the matching option supplies the result
    }
    taskToGraph(t) {
        return createExprNode(Task, { name: t.name });
    }
    subProcessToGraph(s) {
        const body = this.childrenOf(s);
        return (createExprNode(SubProcess, { name: s.name },
            createExprNode(StartEvent, { name: `${s.name}_start` }),
            body.flatMap((a) => this.activityToGraph(a)),
            createExprNode(EndEvent, { name: `${s.name}_end` }),
            this.chainFlows(body),
            createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": `${s.name}_start` }),
                this.toEntryOf(body[0])),
            createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(body[body.length - 1]),
                createExprNode(ToNode, { "$refByName": `${s.name}_end` }))));
    }
    sequenceToGraph(q) {
        const children = this.childrenOf(q);
        return [...children.flatMap((a) => this.activityToGraph(a)), ...this.chainFlows(children)];
    }
    parallelToGraph(p) {
        const base = this.baseOf(p);
        const children = this.childrenOf(p);
        return [
            createExprNode(Gateway, { name: `${base}_split`, kind: "parallel" }),
            ...children.flatMap((a) => this.activityToGraph(a)),
            createExprNode(Gateway, { name: `${base}_join`, kind: "parallel" }),
            ...children.map((c) => (createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": `${base}_split` }),
                this.toEntryOf(c)))),
            ...children.map((c) => (createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(c),
                createExprNode(ToNode, { "$refByName": `${base}_join` })))),
        ];
    }
    // ----- boundary references: where a block's graph begins and ends ------
    // An entry is only ever a flow target, an exit only ever a flow source,
    // so the references come back already wearing the right tag.
    toEntryOf(a) {
        return undefined; // pure dispatcher
    }
    toEntryOfTask(t) {
        return createExprNode(ToNode, { "$refByName": t.name });
    }
    toEntryOfSubProcess(s) {
        return createExprNode(ToNode, { "$refByName": s.name });
    }
    toEntryOfSequence(q) {
        return this.toEntryOf(this.childrenOf(q)[0]);
    }
    toEntryOfParallel(p) {
        return createExprNode(ToNode, { "$refByName": `${this.baseOf(p)}_split` });
    }
    fromExitOf(a) {
        return undefined; // pure dispatcher
    }
    fromExitOfTask(t) {
        return createExprNode(FromNode, { "$refByName": t.name });
    }
    fromExitOfSubProcess(s) {
        return createExprNode(FromNode, { "$refByName": s.name });
    }
    fromExitOfSequence(q) {
        const children = this.childrenOf(q);
        return this.fromExitOf(children[children.length - 1]);
    }
    fromExitOfParallel(p) {
        return createExprNode(FromNode, { "$refByName": `${this.baseOf(p)}_join` });
    }
    // ----- small helpers ---------------------------------------------------
    chainFlows(children) {
        const flows = [];
        for (let i = 0; i < children.length - 1; i++) {
            flows.push(createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(children[i]),
                this.toEntryOf(children[i + 1])));
        }
        return flows;
    }
    nextFlowName() {
        return `f${++this.flowCount}`;
    }
    // Stable base name for a parallel's gateway pair: its own name, or a
    // generated one remembered per element, so the graph rule and the
    // boundary references always agree.
    baseOf(p) {
        if (p.name)
            return p.name;
        let base = this.parNames.get(p);
        if (base === undefined) {
            base = `par${++this.parCount}`;
            this.parNames.set(p, base);
        }
        return base;
    }
    childrenOf(a) {
        const children = (a.children ?? []);
        if (children.length === 0) {
            throw new Error(`Block '${a.name}' is empty: it has no entry or exit`);
        }
        return children;
    }
    rootOf(p) {
        if (!p.body) {
            throw new Error(`Process '${p.name}' has no body block`);
        }
        return p.body;
    }
}
__decorate([
    E2E(),
    SpecPoint()
], WorkflowToBpmnTransformation.prototype, "activityToGraph", null);
__decorate([
    SpecOption('activityToGraph', wm.Task)
], WorkflowToBpmnTransformation.prototype, "taskToGraph", null);
__decorate([
    SpecOption('activityToGraph', wm.SubProcess)
], WorkflowToBpmnTransformation.prototype, "subProcessToGraph", null);
__decorate([
    SpecOption('activityToGraph', wm.Sequence)
], WorkflowToBpmnTransformation.prototype, "sequenceToGraph", null);
__decorate([
    SpecOption('activityToGraph', wm.Parallel)
], WorkflowToBpmnTransformation.prototype, "parallelToGraph", null);
__decorate([
    SpecPoint()
], WorkflowToBpmnTransformation.prototype, "toEntryOf", null);
__decorate([
    SpecOption('toEntryOf', wm.Task)
], WorkflowToBpmnTransformation.prototype, "toEntryOfTask", null);
__decorate([
    SpecOption('toEntryOf', wm.SubProcess)
], WorkflowToBpmnTransformation.prototype, "toEntryOfSubProcess", null);
__decorate([
    SpecOption('toEntryOf', wm.Sequence)
], WorkflowToBpmnTransformation.prototype, "toEntryOfSequence", null);
__decorate([
    SpecOption('toEntryOf', wm.Parallel)
], WorkflowToBpmnTransformation.prototype, "toEntryOfParallel", null);
__decorate([
    SpecPoint()
], WorkflowToBpmnTransformation.prototype, "fromExitOf", null);
__decorate([
    SpecOption('fromExitOf', wm.Task)
], WorkflowToBpmnTransformation.prototype, "fromExitOfTask", null);
__decorate([
    SpecOption('fromExitOf', wm.SubProcess)
], WorkflowToBpmnTransformation.prototype, "fromExitOfSubProcess", null);
__decorate([
    SpecOption('fromExitOf', wm.Sequence)
], WorkflowToBpmnTransformation.prototype, "fromExitOfSequence", null);
__decorate([
    SpecOption('fromExitOf', wm.Parallel)
], WorkflowToBpmnTransformation.prototype, "fromExitOfParallel", null);
//# sourceMappingURL=transformation.js.map