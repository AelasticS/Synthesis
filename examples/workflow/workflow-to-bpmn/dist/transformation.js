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
    baseCounts = new Map();
    baseNames = new Map();
    constructor(store) {
        super(store);
    }
    main(m) {
        const entry = this.entryProcessOf(m);
        const steps = this.stepsOf(entry);
        return (createExprNode(Process, { name: `${entry.name}_bpmn`, store: this.context.store },
            createExprNode(StartEvent, { name: "start" }),
            steps.flatMap((s) => this.stepToGraph(s, '')),
            createExprNode(EndEvent, { name: "end" }),
            this.chainFlows(steps, ''),
            createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": "start" }),
                this.toEntryOf(steps[0], '')),
            createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(steps[steps.length - 1], ''),
                createExprNode(ToNode, { "$refByName": "end" }))));
    }
    // ----- the graph rule: one pure-dispatch point, one option per kind ----
    // The prefix threads the enclosing embedded sub-processes' names into
    // every node name: the BPMN model is one flat name scope, while
    // workflow names are unique only per process, and one definition may
    // expand under several occurrences.
    stepToGraph(s, prefix) {
        return undefined; // pure dispatcher: the matching option supplies the result
    }
    taskToGraph(t, prefix) {
        return createExprNode(Task, { name: `${prefix}${t.name}` });
    }
    // An inline process step is an embedded sub-process.
    processToGraph(p, prefix) {
        return this.embeddedSubProcess(`${prefix}${p.name}`, this.stepsOf(p));
    }
    // A task invocation is a task named by the occurrence; a process
    // invocation expands as an embedded sub-process named by the
    // occurrence.
    invocationToGraph(inv, prefix) {
        const called = this.calledOf(inv);
        const occurrence = `${prefix}${this.occurrenceNameOf(inv)}`;
        if (this.context.store.isTypeOf(called, wm.Process)) {
            return this.embeddedSubProcess(occurrence, this.stepsOf(called));
        }
        return createExprNode(Task, { name: occurrence });
    }
    sequenceToGraph(q, prefix) {
        const children = this.childrenOf(q);
        return [...children.flatMap((s) => this.stepToGraph(s, prefix)), ...this.chainFlows(children, prefix)];
    }
    parallelToGraph(p, prefix) {
        const base = `${prefix}${this.baseOf(p, 'par')}`;
        const children = this.childrenOf(p);
        return [
            createExprNode(Gateway, { name: `${base}_split`, kind: "parallel" }),
            ...children.flatMap((s) => this.stepToGraph(s, prefix)),
            createExprNode(Gateway, { name: `${base}_join`, kind: "parallel" }),
            ...children.map((c) => (createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": `${base}_split` }),
                this.toEntryOf(c, prefix)))),
            ...children.map((c) => (createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(c, prefix),
                createExprNode(ToNode, { "$refByName": `${base}_join` })))),
        ];
    }
    // A choice is an exclusive gateway pair: the split guards each
    // branch's entry flow with the branch's guard, the else flow stays
    // unguarded, and every branch (an implicit sequence) converges on
    // the join.
    choiceToGraph(c, prefix) {
        const base = `${prefix}${this.baseOf(c, 'choice')}`;
        const branches = this.branchesOf(c);
        return [
            createExprNode(Gateway, { name: `${base}_split`, kind: "exclusive" }),
            ...branches.flatMap((b) => {
                const body = this.childrenOf(b);
                return [...body.flatMap((s) => this.stepToGraph(s, prefix)), ...this.chainFlows(body, prefix)];
            }),
            createExprNode(Gateway, { name: `${base}_join`, kind: "exclusive" }),
            ...branches.map((b) => (createExprNode(Flow, { name: this.nextFlowName(), guard: (b.guard ?? '') === '' ? undefined : b.guard },
                createExprNode(FromNode, { "$refByName": `${base}_split` }),
                this.toEntryOf(this.childrenOf(b)[0], prefix)))),
            ...branches.map((b) => {
                const body = this.childrenOf(b);
                return (createExprNode(Flow, { name: this.nextFlowName() },
                    this.fromExitOf(body[body.length - 1], prefix),
                    createExprNode(ToNode, { "$refByName": `${base}_join` })));
            }),
        ];
    }
    // A loop is a gateway pair around its body (an implicit sequence):
    // the converging entry merges the incoming flow with the loop's
    // return, the diverging exit is the test, and the kind places the
    // test. A while tests before the body, so the guarded flow enters
    // the body; a repeatUntil tests after it, so the guarded back edge
    // returns to the entry, labeled with the negated guard (the loop
    // runs again only while the guard has not yet come true).
    loopToGraph(l, prefix) {
        const base = `${prefix}${this.baseOf(l, 'loop')}`;
        const body = this.childrenOf(l);
        const guard = this.guardOf(l);
        const parts = [
            createExprNode(Gateway, { name: `${base}_entry`, kind: "exclusive" }),
            ...body.flatMap((s) => this.stepToGraph(s, prefix)),
            createExprNode(Gateway, { name: `${base}_exit`, kind: "exclusive" }),
            ...this.chainFlows(body, prefix),
        ];
        if (l.kind === 'while') {
            parts.push(createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": `${base}_entry` }),
                createExprNode(ToNode, { "$refByName": `${base}_exit` })), createExprNode(Flow, { name: this.nextFlowName(), guard: guard },
                createExprNode(FromNode, { "$refByName": `${base}_exit` }),
                this.toEntryOf(body[0], prefix)), createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(body[body.length - 1], prefix),
                createExprNode(ToNode, { "$refByName": `${base}_entry` })));
        }
        else {
            parts.push(createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": `${base}_entry` }),
                this.toEntryOf(body[0], prefix)), createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(body[body.length - 1], prefix),
                createExprNode(ToNode, { "$refByName": `${base}_exit` })), createExprNode(Flow, { name: this.nextFlowName(), guard: `not ${guard}` },
                createExprNode(FromNode, { "$refByName": `${base}_exit` }),
                createExprNode(ToNode, { "$refByName": `${base}_entry` })));
        }
        return parts;
    }
    // ----- boundary references: where a step's graph begins and ends -------
    // An entry is only ever a flow target, an exit only ever a flow source,
    // so the references come back already wearing the right tag.
    toEntryOf(s, prefix) {
        return undefined; // pure dispatcher
    }
    toEntryOfTask(t, prefix) {
        return createExprNode(ToNode, { "$refByName": `${prefix}${t.name}` });
    }
    toEntryOfProcess(p, prefix) {
        return createExprNode(ToNode, { "$refByName": `${prefix}${p.name}` });
    }
    toEntryOfInvocation(inv, prefix) {
        return createExprNode(ToNode, { "$refByName": `${prefix}${this.occurrenceNameOf(inv)}` });
    }
    toEntryOfSequence(q, prefix) {
        return this.toEntryOf(this.childrenOf(q)[0], prefix);
    }
    toEntryOfParallel(p, prefix) {
        return createExprNode(ToNode, { "$refByName": `${prefix}${this.baseOf(p, 'par')}_split` });
    }
    toEntryOfChoice(c, prefix) {
        return createExprNode(ToNode, { "$refByName": `${prefix}${this.baseOf(c, 'choice')}_split` });
    }
    toEntryOfLoop(l, prefix) {
        return createExprNode(ToNode, { "$refByName": `${prefix}${this.baseOf(l, 'loop')}_entry` });
    }
    fromExitOf(s, prefix) {
        return undefined; // pure dispatcher
    }
    fromExitOfTask(t, prefix) {
        return createExprNode(FromNode, { "$refByName": `${prefix}${t.name}` });
    }
    fromExitOfProcess(p, prefix) {
        return createExprNode(FromNode, { "$refByName": `${prefix}${p.name}` });
    }
    fromExitOfInvocation(inv, prefix) {
        return createExprNode(FromNode, { "$refByName": `${prefix}${this.occurrenceNameOf(inv)}` });
    }
    fromExitOfSequence(q, prefix) {
        const children = this.childrenOf(q);
        return this.fromExitOf(children[children.length - 1], prefix);
    }
    fromExitOfParallel(p, prefix) {
        return createExprNode(FromNode, { "$refByName": `${prefix}${this.baseOf(p, 'par')}_join` });
    }
    fromExitOfChoice(c, prefix) {
        return createExprNode(FromNode, { "$refByName": `${prefix}${this.baseOf(c, 'choice')}_join` });
    }
    fromExitOfLoop(l, prefix) {
        return createExprNode(FromNode, { "$refByName": `${prefix}${this.baseOf(l, 'loop')}_exit` });
    }
    // ----- small helpers ---------------------------------------------------
    // The embedded expansion shared by inline process steps and process
    // invocations: a sub-process node with its own start and end, its
    // body flattened under the node's name as a prefix.
    embeddedSubProcess(name, steps) {
        const inner = `${name}_`;
        return (createExprNode(SubProcess, { name: name },
            createExprNode(StartEvent, { name: `${inner}start` }),
            steps.flatMap((s) => this.stepToGraph(s, inner)),
            createExprNode(EndEvent, { name: `${inner}end` }),
            this.chainFlows(steps, inner),
            createExprNode(Flow, { name: this.nextFlowName() },
                createExprNode(FromNode, { "$refByName": `${inner}start` }),
                this.toEntryOf(steps[0], inner)),
            createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(steps[steps.length - 1], inner),
                createExprNode(ToNode, { "$refByName": `${inner}end` }))));
    }
    chainFlows(steps, prefix) {
        const flows = [];
        for (let i = 0; i < steps.length - 1; i++) {
            flows.push(createExprNode(Flow, { name: this.nextFlowName() },
                this.fromExitOf(steps[i], prefix),
                this.toEntryOf(steps[i + 1], prefix)));
        }
        return flows;
    }
    nextFlowName() {
        return `f${++this.flowCount}`;
    }
    // Stable base name for a gateway pair: the step's authored name, or
    // a generated per-kind one remembered per element, so the graph rule
    // and the boundary references always agree. The store backfills
    // label exactly when a name was authored, so its absence marks an
    // unnamed step.
    baseOf(s, kind) {
        if (s.label !== undefined)
            return s.name;
        let base = this.baseNames.get(s);
        if (base === undefined) {
            const n = (this.baseCounts.get(kind) ?? 0) + 1;
            this.baseCounts.set(kind, n);
            base = `${kind}${n}`;
            this.baseNames.set(s, base);
        }
        return base;
    }
    // The occurrence name defaults to the called definition's name.
    occurrenceNameOf(inv) {
        if (inv.label !== undefined)
            return inv.name;
        return this.calledOf(inv).name;
    }
    calledOf(inv) {
        const called = inv.activity;
        if (!called) {
            throw new Error(`Invocation '${inv.name}' names no activity definition`);
        }
        return called;
    }
    guardOf(l) {
        const guard = (l.guard ?? '');
        if (guard === '') {
            throw new Error(`Loop '${l.name}' has no guard`);
        }
        return guard;
    }
    childrenOf(s) {
        const children = (s.children ?? []);
        if (children.length === 0) {
            throw new Error(`Block '${s.name}' is empty: it has no entry or exit`);
        }
        return children;
    }
    branchesOf(c) {
        const branches = (c.children ?? []);
        if (branches.length === 0) {
            throw new Error(`Choice '${c.name}' has no branches`);
        }
        return branches;
    }
    stepsOf(p) {
        const steps = (p.steps ?? []);
        if (steps.length === 0) {
            throw new Error(`Process '${p.name}' has no steps`);
        }
        return steps;
    }
    // The chain's entry: the first process definition no invocation in
    // the model calls (the root of the call graph).
    entryProcessOf(m) {
        const store = this.context.store;
        const invoked = new Set();
        for (const el of (m.elements ?? [])) {
            if (store.isTypeOf(el, wm.Invocation)) {
                const called = el.activity;
                if (called)
                    invoked.add(called);
            }
        }
        const entry = (m.definitions ?? []).find((d) => store.isTypeOf(d, wm.Process) && !invoked.has(d));
        if (!entry) {
            throw new Error(`Model '${m.name}' has no uninvoked process definition to serve as the entry`);
        }
        return entry;
    }
}
__decorate([
    E2E(),
    SpecPoint()
], WorkflowToBpmnTransformation.prototype, "stepToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Task)
], WorkflowToBpmnTransformation.prototype, "taskToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Process)
], WorkflowToBpmnTransformation.prototype, "processToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Invocation)
], WorkflowToBpmnTransformation.prototype, "invocationToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Sequence)
], WorkflowToBpmnTransformation.prototype, "sequenceToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Parallel)
], WorkflowToBpmnTransformation.prototype, "parallelToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Choice)
], WorkflowToBpmnTransformation.prototype, "choiceToGraph", null);
__decorate([
    SpecOption('stepToGraph', wm.Loop)
], WorkflowToBpmnTransformation.prototype, "loopToGraph", null);
__decorate([
    SpecPoint()
], WorkflowToBpmnTransformation.prototype, "toEntryOf", null);
__decorate([
    SpecOption('toEntryOf', wm.Task)
], WorkflowToBpmnTransformation.prototype, "toEntryOfTask", null);
__decorate([
    SpecOption('toEntryOf', wm.Process)
], WorkflowToBpmnTransformation.prototype, "toEntryOfProcess", null);
__decorate([
    SpecOption('toEntryOf', wm.Invocation)
], WorkflowToBpmnTransformation.prototype, "toEntryOfInvocation", null);
__decorate([
    SpecOption('toEntryOf', wm.Sequence)
], WorkflowToBpmnTransformation.prototype, "toEntryOfSequence", null);
__decorate([
    SpecOption('toEntryOf', wm.Parallel)
], WorkflowToBpmnTransformation.prototype, "toEntryOfParallel", null);
__decorate([
    SpecOption('toEntryOf', wm.Choice)
], WorkflowToBpmnTransformation.prototype, "toEntryOfChoice", null);
__decorate([
    SpecOption('toEntryOf', wm.Loop)
], WorkflowToBpmnTransformation.prototype, "toEntryOfLoop", null);
__decorate([
    SpecPoint()
], WorkflowToBpmnTransformation.prototype, "fromExitOf", null);
__decorate([
    SpecOption('fromExitOf', wm.Task)
], WorkflowToBpmnTransformation.prototype, "fromExitOfTask", null);
__decorate([
    SpecOption('fromExitOf', wm.Process)
], WorkflowToBpmnTransformation.prototype, "fromExitOfProcess", null);
__decorate([
    SpecOption('fromExitOf', wm.Invocation)
], WorkflowToBpmnTransformation.prototype, "fromExitOfInvocation", null);
__decorate([
    SpecOption('fromExitOf', wm.Sequence)
], WorkflowToBpmnTransformation.prototype, "fromExitOfSequence", null);
__decorate([
    SpecOption('fromExitOf', wm.Parallel)
], WorkflowToBpmnTransformation.prototype, "fromExitOfParallel", null);
__decorate([
    SpecOption('fromExitOf', wm.Choice)
], WorkflowToBpmnTransformation.prototype, "fromExitOfChoice", null);
__decorate([
    SpecOption('fromExitOf', wm.Loop)
], WorkflowToBpmnTransformation.prototype, "fromExitOfLoop", null);
//# sourceMappingURL=transformation.js.map