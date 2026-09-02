/** @jsx createExprNode */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * Block-structured workflow to graph-based BPMN.
 *
 * The mapping follows a fragment contract: every activity contributes a
 * fragment, the nodes and flows it adds, plus an entry port and an exit
 * port (a node name and its kind, so a flow endpoint can be written with
 * the reference tag of the right concept). A Task is its own entry and
 * exit; a Sequence chains its children's fragments; a Parallel wraps its
 * children in a parallel gateway pair; a SubProcess becomes one node
 * carrying its recursively flattened body between its own start and end
 * events. The process wraps everything between a start and an end event.
 *
 * Naming, because element names are unique per model: task and
 * sub-process names pass through; unnamed Parallel blocks get generated
 * names (par1, par2, ...); gateways are <name>_split and <name>_join;
 * sub-process events are <name>_start and <name>_end; flows are f1..fn.
 */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M, E2E } from '@aelastics/synthesis/m2m';
import * as wm from 'workflow-metamodel/model';
import { Task, StartEvent, EndEvent, Gateway, SubProcess, Flow, Process } from 'bpmn-metamodel';
export class WorkflowToBpmnTransformation extends abstractM2M {
    flowCount = 0;
    parCount = 0;
    constructor(store) {
        super(store);
    }
    template(p) {
        const body = this.sequenceFragment(this.topLevelActivities(p));
        return (createExprNode(Process, { name: `${p.name}_bpmn`, content: "", MDA_level: "M1", store: this.context.store },
            createExprNode(StartEvent, { name: "start" }),
            body.nodes,
            createExprNode(EndEvent, { name: "end" }),
            body.flows,
            this.flow({ name: 'start', kind: 'start' }, body.entry),
            this.flow(body.exit, { name: 'end', kind: 'end' })));
    }
    // ----- fragments per activity kind -------------------------------------
    activityFragment(a) {
        const store = this.context.store;
        if (store.isTypeOf(a, wm.Task)) {
            return this.taskFragment(a);
        }
        if (store.isTypeOf(a, wm.Parallel)) {
            return this.parallelFragment(a);
        }
        if (store.isTypeOf(a, wm.SubProcess)) {
            return this.subProcessFragment(a);
        }
        if (store.isTypeOf(a, wm.Sequence)) {
            return this.sequenceFragment(this.childrenOf(a));
        }
        throw new Error(`Unknown activity kind for '${a.name}'`);
    }
    taskFragment(t) {
        const port = { name: t.name, kind: 'task' };
        return { nodes: [this.taskToNode(t)], flows: [], entry: port, exit: port };
    }
    sequenceFragment(children) {
        if (children.length === 0) {
            throw new Error('An empty block cannot be mapped: it has no entry or exit');
        }
        const fragments = children.map((c) => this.activityFragment(c));
        const nodes = fragments.flatMap((f) => f.nodes);
        const flows = fragments.flatMap((f) => f.flows);
        for (let i = 0; i < fragments.length - 1; i++) {
            flows.push(this.flow(fragments[i].exit, fragments[i + 1].entry));
        }
        return { nodes, flows, entry: fragments[0].entry, exit: fragments[fragments.length - 1].exit };
    }
    parallelFragment(p) {
        const base = p.name && p.name.length > 0 ? p.name : `par${++this.parCount}`;
        const split = { name: `${base}_split`, kind: 'gateway' };
        const join = { name: `${base}_join`, kind: 'gateway' };
        const fragments = this.childrenOf(p).map((c) => this.activityFragment(c));
        const nodes = [
            this.parallelToSplitGateway(p, split.name),
            ...fragments.flatMap((f) => f.nodes),
            this.parallelToJoinGateway(p, join.name),
        ];
        const flows = fragments.flatMap((f) => f.flows);
        for (const f of fragments) {
            flows.push(this.flow(split, f.entry));
            flows.push(this.flow(f.exit, join));
        }
        return { nodes, flows, entry: split, exit: join };
    }
    subProcessFragment(s) {
        const port = { name: s.name, kind: 'subprocess' };
        return { nodes: [this.subProcessToNode(s)], flows: [], entry: port, exit: port };
    }
    // ----- single-node rules (traced) --------------------------------------
    taskToNode(t) {
        return createExprNode(Task, { name: t.name });
    }
    parallelToSplitGateway(p, name) {
        return createExprNode(Gateway, { name: name, kind: "parallel" });
    }
    parallelToJoinGateway(p, name) {
        return createExprNode(Gateway, { name: name, kind: "parallel" });
    }
    subProcessToNode(s) {
        const body = this.sequenceFragment(this.childrenOf(s));
        const start = { name: `${s.name}_start`, kind: 'start' };
        const end = { name: `${s.name}_end`, kind: 'end' };
        return (createExprNode(SubProcess, { name: s.name },
            createExprNode(StartEvent, { name: start.name }),
            body.nodes,
            createExprNode(EndEvent, { name: end.name }),
            body.flows,
            this.flow(start, body.entry),
            this.flow(body.exit, end)));
    }
    // ----- flows and traversal helpers -------------------------------------
    flow(from, to) {
        return createExprNode(Flow, { name: `f${++this.flowCount}`, from: this.nodeRef(from), to: this.nodeRef(to) });
    }
    // A flow endpoint references an existing node; the tag matches the
    // node's concept so the reference stays well typed.
    nodeRef(port) {
        switch (port.kind) {
            case 'task':
                return createExprNode(Task, { "$refByName": port.name });
            case 'gateway':
                return createExprNode(Gateway, { "$refByName": port.name });
            case 'subprocess':
                return createExprNode(SubProcess, { "$refByName": port.name });
            case 'start':
                return createExprNode(StartEvent, { "$refByName": port.name });
            case 'end':
                return createExprNode(EndEvent, { "$refByName": port.name });
        }
    }
    childrenOf(a) {
        return (a.children ?? []);
    }
    // Top-level activities: elements of the process whose parent is not
    // another activity (the model's element list is flat, so nested
    // activities appear in it too).
    topLevelActivities(p) {
        const store = this.context.store;
        const elements = (p.elements ?? []);
        return elements.filter((el) => store.isTypeOf(el, wm.Activity) && !el.parent);
    }
}
__decorate([
    E2E()
], WorkflowToBpmnTransformation.prototype, "taskToNode", null);
__decorate([
    E2E()
], WorkflowToBpmnTransformation.prototype, "parallelToSplitGateway", null);
__decorate([
    E2E()
], WorkflowToBpmnTransformation.prototype, "parallelToJoinGateway", null);
__decorate([
    E2E()
], WorkflowToBpmnTransformation.prototype, "subProcessToNode", null);
//# sourceMappingURL=transformation.js.map