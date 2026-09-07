/** @jsx createExprNode */
/**
 * Block-structured workflow model to Mermaid flowchart text: the
 * structure view, drawing the SOURCE of the workflow chain rather than
 * its flattened graph. One document per model, drawing the entry
 * process (the first process definition no invocation calls); one
 * nested subgraph per composite step, so the tree structure stays
 * visible. A task is a box; a sequence is a subgraph whose consecutive
 * children are chained with edges; a parallel is a subgraph with no
 * edges between its children, because side-by-side placement IS the
 * meaning; an inline process is a subgraph whose steps chain (a
 * process body is implicitly a sequence); a choice is a subgraph whose
 * branch subgraphs are labeled with their guards (the else branch
 * labeled else); a loop is a subgraph labeled with its kind and guard;
 * a process invocation is a subroutine shape, a task invocation a box,
 * both named by the occurrence (defaulting to the called definition's
 * name). Documents and performers are not drawn. Node ids are the
 * sanitized authored names (unique per process scope); labels keep the
 * authored names verbatim, spaces included, read from the element's
 * label (the store keeps the pre-normalization name there). An unnamed
 * operator gets a generated per-kind id and a bare kind label.
 */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { abstractM2M } from '@aelastics/synthesis/m2m';
import { M2T, Doc, P } from '@aelastics/synthesis/m2t';
import * as wm from 'workflow-metamodel/model';
export class WorkflowToMermaidTransformation extends abstractM2M {
    genIds = new Map();
    genCounts = new Map();
    constructor(store) {
        super(store);
    }
    template(m) {
        const entry = this.entryProcessOf(m);
        const steps = this.stepsOf(entry);
        return (createExprNode(M2T, { name: `${m.name}_mermaid` },
            createExprNode(Doc, { name: `${m.name}.mmd` },
                createExprNode(P, null, 'flowchart TD'),
                steps.flatMap((s) => this.stepLines(s, 1)),
                this.chainEdges(steps, 1))));
    }
    // One method per step kind, dispatched by type test; the recursion
    // mirrors the tree's nesting.
    stepLines(s, depth) {
        const store = this.context.store;
        if (store.isTypeOf(s, wm.Task))
            return this.taskLines(s, depth);
        if (store.isTypeOf(s, wm.Process))
            return this.processLines(s, depth);
        if (store.isTypeOf(s, wm.Invocation))
            return this.invocationLines(s, depth);
        if (store.isTypeOf(s, wm.Sequence))
            return this.blockLines(s, 'sequence', depth, true);
        if (store.isTypeOf(s, wm.Parallel))
            return this.blockLines(s, 'parallel', depth, false);
        if (store.isTypeOf(s, wm.Choice))
            return this.choiceLines(s, depth);
        if (store.isTypeOf(s, wm.Loop))
            return this.loopLines(s, depth);
        throw new Error(`Step '${s.name}' has an unknown kind`);
    }
    taskLines(t, depth) {
        return [createExprNode(P, null, `${this.ind(depth)}${this.idOf(t)}["${this.labelOf(t)}"]`)];
    }
    // An inline process is a subgraph; its steps chain (implicitly a
    // sequence).
    processLines(p, depth) {
        const steps = this.stepsOf(p);
        return [
            createExprNode(P, null, `${this.ind(depth)}subgraph ${this.idOf(p)}["${this.titleOf(p, 'process')}"]`),
            ...steps.flatMap((s) => this.stepLines(s, depth + 1)),
            ...this.chainEdges(steps, depth + 1),
            createExprNode(P, null, `${this.ind(depth)}end`),
        ];
    }
    // A process invocation is a subroutine shape, a task invocation a
    // box, both named by the occurrence.
    invocationLines(inv, depth) {
        const called = this.calledOf(inv);
        const display = this.occurrenceDisplayOf(inv);
        const id = this.sanitizedId(display);
        if (this.context.store.isTypeOf(called, wm.Process)) {
            return [createExprNode(P, null, `${this.ind(depth)}${id}[["${display}"]]`)];
        }
        return [createExprNode(P, null, `${this.ind(depth)}${id}["${display}"]`)];
    }
    // Sequence and parallel: a subgraph labeled with its kind; the
    // children chain with edges exactly when the block is sequential.
    blockLines(s, kind, depth, chained) {
        const children = this.childrenOf(s);
        return [
            createExprNode(P, null, `${this.ind(depth)}subgraph ${this.idOf(s)}["${this.titleOf(s, kind)}"]`),
            ...children.flatMap((c) => this.stepLines(c, depth + 1)),
            ...(chained ? this.chainEdges(children, depth + 1) : []),
            createExprNode(P, null, `${this.ind(depth)}end`),
        ];
    }
    // A choice is a subgraph whose branch subgraphs carry their guards
    // as labels (the else branch labeled else); no edges between
    // branches, because side-by-side placement means alternatives. A
    // branch's children chain (implicitly a sequence); branch ids are
    // positional under the choice's id.
    choiceLines(c, depth) {
        const choiceId = this.idOf(c);
        const branches = this.branchesOf(c);
        const lines = [
            createExprNode(P, null, `${this.ind(depth)}subgraph ${choiceId}["${this.titleOf(c, 'choice')}"]`),
        ];
        branches.forEach((b, i) => {
            const body = this.childrenOf(b);
            const title = (b.guard ?? '') === '' ? 'else' : b.guard;
            lines.push(createExprNode(P, null, `${this.ind(depth + 1)}subgraph ${choiceId}_b${i + 1}["${title}"]`), ...body.flatMap((s) => this.stepLines(s, depth + 2)), ...this.chainEdges(body, depth + 2), createExprNode(P, null, `${this.ind(depth + 1)}end`));
        });
        lines.push(createExprNode(P, null, `${this.ind(depth)}end`));
        return lines;
    }
    // A loop is a subgraph labeled with its kind and guard; its body
    // chains (implicitly a sequence).
    loopLines(l, depth) {
        const guard = (l.guard ?? '');
        if (guard === '') {
            throw new Error(`Loop '${l.name}' has no guard`);
        }
        const kindWord = l.kind === 'while' ? 'while' : 'until';
        const body = this.childrenOf(l);
        return [
            createExprNode(P, null, `${this.ind(depth)}subgraph ${this.idOf(l)}["${this.titleOf(l, `loop ${kindWord} ${guard}`)}"]`),
            ...body.flatMap((s) => this.stepLines(s, depth + 1)),
            ...this.chainEdges(body, depth + 1),
            createExprNode(P, null, `${this.ind(depth)}end`),
        ];
    }
    // Consecutive steps of a sequential block chain with edges. An edge
    // may start or end at a subgraph id; that is valid Mermaid.
    chainEdges(steps, depth) {
        const edges = [];
        for (let i = 0; i < steps.length - 1; i++) {
            edges.push(createExprNode(P, null, `${this.ind(depth)}${this.idOf(steps[i])} --> ${this.idOf(steps[i + 1])}`));
        }
        return edges;
    }
    ind(depth) {
        return '  '.repeat(depth);
    }
    // The authored name, spaces included: the store normalizes name
    // (whitespace stripped) and keeps the pre-normalization form in
    // label, backfilling label from name when nothing was stripped.
    labelOf(s) {
        return String(s.label ?? s.name);
    }
    // A subgraph title: the authored name plus the kind, or the bare
    // kind for an unnamed step (the store backfills label exactly when a
    // name was authored, so its absence marks an unnamed step).
    titleOf(s, kind) {
        return s.label === undefined ? `(${kind})` : `${this.labelOf(s)} (${kind})`;
    }
    // The occurrence name defaults to the called definition's name.
    occurrenceDisplayOf(inv) {
        if (inv.label !== undefined)
            return this.labelOf(inv);
        return this.labelOf(this.calledOf(inv));
    }
    // A step's diagram id: the sanitized authored name, or a generated
    // per-kind id for unnamed steps (an occurrence falls back to its
    // definition's name first).
    idOf(s) {
        if (this.context.store.isTypeOf(s, wm.Invocation)) {
            return this.sanitizedId(this.occurrenceDisplayOf(s));
        }
        if (s.label !== undefined)
            return this.sanitizedId(this.labelOf(s));
        let id = this.genIds.get(s);
        if (id === undefined) {
            const kind = this.kindKeyOf(s);
            const n = (this.genCounts.get(kind) ?? 0) + 1;
            this.genCounts.set(kind, n);
            id = `${kind}${n}`;
            this.genIds.set(s, id);
        }
        return id;
    }
    kindKeyOf(s) {
        const store = this.context.store;
        if (store.isTypeOf(s, wm.Choice))
            return 'choice';
        if (store.isTypeOf(s, wm.Loop))
            return 'loop';
        if (store.isTypeOf(s, wm.Parallel))
            return 'parallel';
        if (store.isTypeOf(s, wm.Sequence))
            return 'sequence';
        if (store.isTypeOf(s, wm.Process))
            return 'process';
        return 'step';
    }
    // Mermaid ids allow no spaces and reserve a few words; the sanitized
    // authored name is collision-free because names are unique per
    // process scope, and the label keeps the authored name. A reserved
    // name gets a suffix in the id, as in bpmn-to-mermaid.
    sanitizedId(name) {
        const sanitized = name.replace(/[^A-Za-z0-9]/g, '_');
        return ['end', 'subgraph', 'graph', 'direction'].includes(sanitized) ? `${sanitized}_node` : sanitized;
    }
    calledOf(inv) {
        const called = inv.activity;
        if (!called) {
            throw new Error(`Invocation '${inv.name}' names no activity definition`);
        }
        return called;
    }
    childrenOf(s) {
        const children = (s.children ?? []);
        if (children.length === 0) {
            throw new Error(`Block '${s.name}' is empty: there is nothing to draw`);
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
    // The drawn process: the first process definition no invocation in
    // the model calls (the root of the call graph), as in
    // workflow-to-bpmn.
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
//# sourceMappingURL=transformation.js.map