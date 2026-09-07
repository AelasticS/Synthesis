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
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import { M2T, Doc, P } from '@aelastics/synthesis/m2t'
import type { M2T_Model } from '@aelastics/synthesis/m2t'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as wm from 'workflow-metamodel/model'

/** The shape every operator shares: children forming its body. */
type IBlock = wm.IStep & { children?: unknown[] }

export class WorkflowToMermaidTransformation extends abstractM2M<wm.IWorkflowModel, M2T_Model> {
  private genIds = new Map<wm.IStep, string>()
  private genCounts = new Map<string, number>()

  constructor(store: ModelStore) {
    super(store)
  }

  template(m: wm.IWorkflowModel): ExprNode<wm.IWorkflowModel, M2T_Model> {
    const entry = this.entryProcessOf(m)
    const steps = this.stepsOf(entry)
    return (
      <M2T name={`${m.name}_mermaid`}>
        <Doc name={`${m.name}.mmd`}>
          <P>{'flowchart TD'}</P>
          {steps.flatMap((s) => this.stepLines(s, 1))}
          {this.chainEdges(steps, 1)}
        </Doc>
      </M2T>
    )
  }

  // One method per step kind, dispatched by type test; the recursion
  // mirrors the tree's nesting.
  private stepLines(s: wm.IStep, depth: number): ExprNode<any>[] {
    const store = this.context.store
    if (store.isTypeOf(s, wm.Task)) return this.taskLines(s as wm.ITask, depth)
    if (store.isTypeOf(s, wm.Process)) return this.processLines(s as wm.IProcess, depth)
    if (store.isTypeOf(s, wm.Invocation)) return this.invocationLines(s as wm.IInvocation, depth)
    if (store.isTypeOf(s, wm.Sequence)) return this.blockLines(s as wm.ISequence, 'sequence', depth, true)
    if (store.isTypeOf(s, wm.Parallel)) return this.blockLines(s as wm.IParallel, 'parallel', depth, false)
    if (store.isTypeOf(s, wm.Choice)) return this.choiceLines(s as wm.IChoice, depth)
    if (store.isTypeOf(s, wm.Loop)) return this.loopLines(s as wm.ILoop, depth)
    throw new Error(`Step '${s.name}' has an unknown kind`)
  }

  private taskLines(t: wm.ITask, depth: number): ExprNode<any>[] {
    return [<P>{`${this.ind(depth)}${this.idOf(t)}["${this.labelOf(t)}"]`}</P>]
  }

  // An inline process is a subgraph; its steps chain (implicitly a
  // sequence).
  private processLines(p: wm.IProcess, depth: number): ExprNode<any>[] {
    const steps = this.stepsOf(p)
    return [
      <P>{`${this.ind(depth)}subgraph ${this.idOf(p)}["${this.titleOf(p, 'process')}"]`}</P>,
      ...steps.flatMap((s) => this.stepLines(s, depth + 1)),
      ...this.chainEdges(steps, depth + 1),
      <P>{`${this.ind(depth)}end`}</P>,
    ]
  }

  // A process invocation is a subroutine shape, a task invocation a
  // box, both named by the occurrence.
  private invocationLines(inv: wm.IInvocation, depth: number): ExprNode<any>[] {
    const called = this.calledOf(inv)
    const display = this.occurrenceDisplayOf(inv)
    const id = this.sanitizedId(display)
    if (this.context.store.isTypeOf(called, wm.Process)) {
      return [<P>{`${this.ind(depth)}${id}[["${display}"]]`}</P>]
    }
    return [<P>{`${this.ind(depth)}${id}["${display}"]`}</P>]
  }

  // Sequence and parallel: a subgraph labeled with its kind; the
  // children chain with edges exactly when the block is sequential.
  private blockLines(s: wm.IStep, kind: string, depth: number, chained: boolean): ExprNode<any>[] {
    const children = this.childrenOf(s)
    return [
      <P>{`${this.ind(depth)}subgraph ${this.idOf(s)}["${this.titleOf(s, kind)}"]`}</P>,
      ...children.flatMap((c) => this.stepLines(c, depth + 1)),
      ...(chained ? this.chainEdges(children, depth + 1) : []),
      <P>{`${this.ind(depth)}end`}</P>,
    ]
  }

  // A choice is a subgraph whose branch subgraphs carry their guards
  // as labels (the else branch labeled else); no edges between
  // branches, because side-by-side placement means alternatives. A
  // branch's children chain (implicitly a sequence); branch ids are
  // positional under the choice's id.
  private choiceLines(c: wm.IChoice, depth: number): ExprNode<any>[] {
    const choiceId = this.idOf(c)
    const branches = this.branchesOf(c)
    const lines: ExprNode<any>[] = [
      <P>{`${this.ind(depth)}subgraph ${choiceId}["${this.titleOf(c, 'choice')}"]`}</P>,
    ]
    branches.forEach((b, i) => {
      const body = this.childrenOf(b)
      const title = (b.guard ?? '') === '' ? 'else' : (b.guard as string)
      lines.push(
        <P>{`${this.ind(depth + 1)}subgraph ${choiceId}_b${i + 1}["${title}"]`}</P>,
        ...body.flatMap((s) => this.stepLines(s, depth + 2)),
        ...this.chainEdges(body, depth + 2),
        <P>{`${this.ind(depth + 1)}end`}</P>
      )
    })
    lines.push(<P>{`${this.ind(depth)}end`}</P>)
    return lines
  }

  // A loop is a subgraph labeled with its kind and guard; its body
  // chains (implicitly a sequence).
  private loopLines(l: wm.ILoop, depth: number): ExprNode<any>[] {
    const guard = (l.guard ?? '') as string
    if (guard === '') {
      throw new Error(`Loop '${l.name}' has no guard`)
    }
    const kindWord = l.kind === 'while' ? 'while' : 'until'
    const body = this.childrenOf(l)
    return [
      <P>{`${this.ind(depth)}subgraph ${this.idOf(l)}["${this.titleOf(l, `loop ${kindWord} ${guard}`)}"]`}</P>,
      ...body.flatMap((s) => this.stepLines(s, depth + 1)),
      ...this.chainEdges(body, depth + 1),
      <P>{`${this.ind(depth)}end`}</P>,
    ]
  }

  // Consecutive steps of a sequential block chain with edges. An edge
  // may start or end at a subgraph id; that is valid Mermaid.
  private chainEdges(steps: wm.IStep[], depth: number): ExprNode<any>[] {
    const edges: ExprNode<any>[] = []
    for (let i = 0; i < steps.length - 1; i++) {
      edges.push(<P>{`${this.ind(depth)}${this.idOf(steps[i])} --> ${this.idOf(steps[i + 1])}`}</P>)
    }
    return edges
  }

  private ind(depth: number): string {
    return '  '.repeat(depth)
  }

  // The authored name, spaces included: the store normalizes name
  // (whitespace stripped) and keeps the pre-normalization form in
  // label, backfilling label from name when nothing was stripped.
  private labelOf(s: wm.IStep): string {
    return String(s.label ?? s.name)
  }

  // A subgraph title: the authored name plus the kind, or the bare
  // kind for an unnamed step (the store backfills label exactly when a
  // name was authored, so its absence marks an unnamed step).
  private titleOf(s: wm.IStep, kind: string): string {
    return s.label === undefined ? `(${kind})` : `${this.labelOf(s)} (${kind})`
  }

  // The occurrence name defaults to the called definition's name.
  private occurrenceDisplayOf(inv: wm.IInvocation): string {
    if (inv.label !== undefined) return this.labelOf(inv)
    return this.labelOf(this.calledOf(inv))
  }

  // A step's diagram id: the sanitized authored name, or a generated
  // per-kind id for unnamed steps (an occurrence falls back to its
  // definition's name first).
  private idOf(s: wm.IStep): string {
    if (this.context.store.isTypeOf(s, wm.Invocation)) {
      return this.sanitizedId(this.occurrenceDisplayOf(s as wm.IInvocation))
    }
    if (s.label !== undefined) return this.sanitizedId(this.labelOf(s))
    let id = this.genIds.get(s)
    if (id === undefined) {
      const kind = this.kindKeyOf(s)
      const n = (this.genCounts.get(kind) ?? 0) + 1
      this.genCounts.set(kind, n)
      id = `${kind}${n}`
      this.genIds.set(s, id)
    }
    return id
  }

  private kindKeyOf(s: wm.IStep): string {
    const store = this.context.store
    if (store.isTypeOf(s, wm.Choice)) return 'choice'
    if (store.isTypeOf(s, wm.Loop)) return 'loop'
    if (store.isTypeOf(s, wm.Parallel)) return 'parallel'
    if (store.isTypeOf(s, wm.Sequence)) return 'sequence'
    if (store.isTypeOf(s, wm.Process)) return 'process'
    return 'step'
  }

  // Mermaid ids allow no spaces and reserve a few words; the sanitized
  // authored name is collision-free because names are unique per
  // process scope, and the label keeps the authored name. A reserved
  // name gets a suffix in the id, as in bpmn-to-mermaid.
  private sanitizedId(name: string): string {
    const sanitized = name.replace(/[^A-Za-z0-9]/g, '_')
    return ['end', 'subgraph', 'graph', 'direction'].includes(sanitized) ? `${sanitized}_node` : sanitized
  }

  private calledOf(inv: wm.IInvocation): wm.IActivity {
    const called = inv.activity as wm.IActivity | undefined
    if (!called) {
      throw new Error(`Invocation '${inv.name}' names no activity definition`)
    }
    return called
  }

  private childrenOf(s: wm.IStep): wm.IStep[] {
    const children = ((s as IBlock).children ?? []) as wm.IStep[]
    if (children.length === 0) {
      throw new Error(`Block '${s.name}' is empty: there is nothing to draw`)
    }
    return children
  }

  private branchesOf(c: wm.IChoice): wm.IBranch[] {
    const branches = (c.children ?? []) as wm.IBranch[]
    if (branches.length === 0) {
      throw new Error(`Choice '${c.name}' has no branches`)
    }
    return branches
  }

  private stepsOf(p: wm.IProcess): wm.IStep[] {
    const steps = (p.steps ?? []) as wm.IStep[]
    if (steps.length === 0) {
      throw new Error(`Process '${p.name}' has no steps`)
    }
    return steps
  }

  // The drawn process: the first process definition no invocation in
  // the model calls (the root of the call graph), as in
  // workflow-to-bpmn.
  private entryProcessOf(m: wm.IWorkflowModel): wm.IProcess {
    const store = this.context.store
    const invoked = new Set<unknown>()
    for (const el of (m.elements ?? []) as wm.IStep[]) {
      if (store.isTypeOf(el, wm.Invocation)) {
        const called = (el as wm.IInvocation).activity
        if (called) invoked.add(called)
      }
    }
    const entry = ((m.definitions ?? []) as wm.IActivity[]).find(
      (d) => store.isTypeOf(d, wm.Process) && !invoked.has(d)
    )
    if (!entry) {
      throw new Error(`Model '${m.name}' has no uninvoked process definition to serve as the entry`)
    }
    return entry as wm.IProcess
  }
}
