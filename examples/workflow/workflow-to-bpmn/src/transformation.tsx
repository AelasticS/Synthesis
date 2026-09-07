/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M, E2E, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as wm from 'workflow-metamodel/model'
import * as bm from 'bpmn-metamodel/model'
import { Process, Task, StartEvent, EndEvent, Gateway, SubProcess, Flow, FromNode, ToNode } from 'bpmn-metamodel'

/** What a step contributes to the enclosing graph: nodes and flows. */
type GraphPart = ExprNode<bm.INode> | ExprNode<bm.IFlow>

/** The shape every operator shares: children forming its body. */
type IBlock = wm.IStep & { children?: unknown[] }

export class WorkflowToBpmnTransformation extends abstractM2M<wm.IWorkflowModel, bm.IProcess> {
  private flowCount = 0
  private baseCounts = new Map<string, number>()
  private baseNames = new Map<wm.IStep, string>()

  constructor(store: ModelStore) {
    super(store)
  }

  template(m: wm.IWorkflowModel): ExprNode<wm.IWorkflowModel, bm.IProcess> {
    const entry = this.entryProcessOf(m)
    const steps = this.stepsOf(entry)
    return (
      <Process name={`${entry.name}_bpmn`} store={this.context.store}>
        <StartEvent name="start" />
        {steps.flatMap((s) => this.stepToGraph(s, ''))}
        <EndEvent name="end" />
        {this.chainFlows(steps, '')}
        <Flow name={this.nextFlowName()}>
          <FromNode $refByName="start" />
          {this.toEntryOf(steps[0], '')}
        </Flow>
        <Flow name={this.nextFlowName()}>
          {this.fromExitOf(steps[steps.length - 1], '')}
          <ToNode $refByName="end" />
        </Flow>
      </Process>
    )
  }

  // ----- the graph rule: one pure-dispatch point, one option per kind ----
  // The prefix threads the enclosing embedded sub-processes' names into
  // every node name: the BPMN model is one flat name scope, while
  // workflow names are unique only per process, and one definition may
  // expand under several occurrences.

  @E2E()
  @SpecPoint()
  stepToGraph(s: wm.IStep, prefix: string): GraphPart | GraphPart[] {
    return undefined! // pure dispatcher: the matching option supplies the result
  }

  @SpecOption('stepToGraph', wm.Task)
  taskToGraph(t: wm.ITask, prefix: string): ExprNode<bm.ITask> {
    return <Task name={`${prefix}${t.name}`} />
  }

  // An inline process step is an embedded sub-process.
  @SpecOption('stepToGraph', wm.Process)
  processToGraph(p: wm.IProcess, prefix: string): ExprNode<bm.ISubProcess> {
    return this.embeddedSubProcess(`${prefix}${p.name}`, this.stepsOf(p))
  }

  // A task invocation is a task named by the occurrence; a process
  // invocation expands as an embedded sub-process named by the
  // occurrence.
  @SpecOption('stepToGraph', wm.Invocation)
  invocationToGraph(inv: wm.IInvocation, prefix: string): ExprNode<bm.INode> {
    const called = this.calledOf(inv)
    const occurrence = `${prefix}${this.occurrenceNameOf(inv)}`
    if (this.context.store.isTypeOf(called, wm.Process)) {
      return this.embeddedSubProcess(occurrence, this.stepsOf(called as wm.IProcess))
    }
    return <Task name={occurrence} />
  }

  @SpecOption('stepToGraph', wm.Sequence)
  sequenceToGraph(q: wm.ISequence, prefix: string): GraphPart[] {
    const children = this.childrenOf(q)
    return [...children.flatMap((s) => this.stepToGraph(s, prefix)), ...this.chainFlows(children, prefix)]
  }

  @SpecOption('stepToGraph', wm.Parallel)
  parallelToGraph(p: wm.IParallel, prefix: string): GraphPart[] {
    const base = `${prefix}${this.baseOf(p, 'par')}`
    const children = this.childrenOf(p)
    return [
      <Gateway name={`${base}_split`} kind="parallel" />,
      ...children.flatMap((s) => this.stepToGraph(s, prefix)),
      <Gateway name={`${base}_join`} kind="parallel" />,
      ...children.map((c) => (
        <Flow name={this.nextFlowName()}>
          <FromNode $refByName={`${base}_split`} />
          {this.toEntryOf(c, prefix)}
        </Flow>
      )),
      ...children.map((c) => (
        <Flow name={this.nextFlowName()}>
          {this.fromExitOf(c, prefix)}
          <ToNode $refByName={`${base}_join`} />
        </Flow>
      )),
    ]
  }

  // A choice is an exclusive gateway pair: the split guards each
  // branch's entry flow with the branch's guard, the else flow stays
  // unguarded, and every branch (an implicit sequence) converges on
  // the join.
  @SpecOption('stepToGraph', wm.Choice)
  choiceToGraph(c: wm.IChoice, prefix: string): GraphPart[] {
    const base = `${prefix}${this.baseOf(c, 'choice')}`
    const branches = this.branchesOf(c)
    return [
      <Gateway name={`${base}_split`} kind="exclusive" />,
      ...branches.flatMap((b) => {
        const body = this.childrenOf(b)
        return [...body.flatMap((s) => this.stepToGraph(s, prefix)), ...this.chainFlows(body, prefix)]
      }),
      <Gateway name={`${base}_join`} kind="exclusive" />,
      ...branches.map((b) => (
        <Flow name={this.nextFlowName()} guard={(b.guard ?? '') === '' ? undefined : b.guard}>
          <FromNode $refByName={`${base}_split`} />
          {this.toEntryOf(this.childrenOf(b)[0], prefix)}
        </Flow>
      )),
      ...branches.map((b) => {
        const body = this.childrenOf(b)
        return (
          <Flow name={this.nextFlowName()}>
            {this.fromExitOf(body[body.length - 1], prefix)}
            <ToNode $refByName={`${base}_join`} />
          </Flow>
        )
      }),
    ]
  }

  // A loop is a gateway pair around its body (an implicit sequence):
  // the converging entry merges the incoming flow with the loop's
  // return, the diverging exit is the test, and the kind places the
  // test. A while tests before the body, so the guarded flow enters
  // the body; a repeatUntil tests after it, so the guarded back edge
  // returns to the entry, labeled with the negated guard (the loop
  // runs again only while the guard has not yet come true).
  @SpecOption('stepToGraph', wm.Loop)
  loopToGraph(l: wm.ILoop, prefix: string): GraphPart[] {
    const base = `${prefix}${this.baseOf(l, 'loop')}`
    const body = this.childrenOf(l)
    const guard = this.guardOf(l)
    const parts: GraphPart[] = [
      <Gateway name={`${base}_entry`} kind="exclusive" />,
      ...body.flatMap((s) => this.stepToGraph(s, prefix)),
      <Gateway name={`${base}_exit`} kind="exclusive" />,
      ...this.chainFlows(body, prefix),
    ]
    if (l.kind === 'while') {
      parts.push(
        <Flow name={this.nextFlowName()}>
          <FromNode $refByName={`${base}_entry`} />
          <ToNode $refByName={`${base}_exit`} />
        </Flow>,
        <Flow name={this.nextFlowName()} guard={guard}>
          <FromNode $refByName={`${base}_exit`} />
          {this.toEntryOf(body[0], prefix)}
        </Flow>,
        <Flow name={this.nextFlowName()}>
          {this.fromExitOf(body[body.length - 1], prefix)}
          <ToNode $refByName={`${base}_entry`} />
        </Flow>
      )
    } else {
      parts.push(
        <Flow name={this.nextFlowName()}>
          <FromNode $refByName={`${base}_entry`} />
          {this.toEntryOf(body[0], prefix)}
        </Flow>,
        <Flow name={this.nextFlowName()}>
          {this.fromExitOf(body[body.length - 1], prefix)}
          <ToNode $refByName={`${base}_exit`} />
        </Flow>,
        <Flow name={this.nextFlowName()} guard={`not ${guard}`}>
          <FromNode $refByName={`${base}_exit`} />
          <ToNode $refByName={`${base}_entry`} />
        </Flow>
      )
    }
    return parts
  }

  // ----- boundary references: where a step's graph begins and ends -------
  // An entry is only ever a flow target, an exit only ever a flow source,
  // so the references come back already wearing the right tag.

  @SpecPoint()
  toEntryOf(s: wm.IStep, prefix: string): ExprNode<bm.INode> {
    return undefined! // pure dispatcher
  }

  @SpecOption('toEntryOf', wm.Task)
  toEntryOfTask(t: wm.ITask, prefix: string): ExprNode<bm.INode> {
    return <ToNode $refByName={`${prefix}${t.name}`} />
  }

  @SpecOption('toEntryOf', wm.Process)
  toEntryOfProcess(p: wm.IProcess, prefix: string): ExprNode<bm.INode> {
    return <ToNode $refByName={`${prefix}${p.name}`} />
  }

  @SpecOption('toEntryOf', wm.Invocation)
  toEntryOfInvocation(inv: wm.IInvocation, prefix: string): ExprNode<bm.INode> {
    return <ToNode $refByName={`${prefix}${this.occurrenceNameOf(inv)}`} />
  }

  @SpecOption('toEntryOf', wm.Sequence)
  toEntryOfSequence(q: wm.ISequence, prefix: string): ExprNode<bm.INode> {
    return this.toEntryOf(this.childrenOf(q)[0], prefix)
  }

  @SpecOption('toEntryOf', wm.Parallel)
  toEntryOfParallel(p: wm.IParallel, prefix: string): ExprNode<bm.INode> {
    return <ToNode $refByName={`${prefix}${this.baseOf(p, 'par')}_split`} />
  }

  @SpecOption('toEntryOf', wm.Choice)
  toEntryOfChoice(c: wm.IChoice, prefix: string): ExprNode<bm.INode> {
    return <ToNode $refByName={`${prefix}${this.baseOf(c, 'choice')}_split`} />
  }

  @SpecOption('toEntryOf', wm.Loop)
  toEntryOfLoop(l: wm.ILoop, prefix: string): ExprNode<bm.INode> {
    return <ToNode $refByName={`${prefix}${this.baseOf(l, 'loop')}_entry`} />
  }

  @SpecPoint()
  fromExitOf(s: wm.IStep, prefix: string): ExprNode<bm.INode> {
    return undefined! // pure dispatcher
  }

  @SpecOption('fromExitOf', wm.Task)
  fromExitOfTask(t: wm.ITask, prefix: string): ExprNode<bm.INode> {
    return <FromNode $refByName={`${prefix}${t.name}`} />
  }

  @SpecOption('fromExitOf', wm.Process)
  fromExitOfProcess(p: wm.IProcess, prefix: string): ExprNode<bm.INode> {
    return <FromNode $refByName={`${prefix}${p.name}`} />
  }

  @SpecOption('fromExitOf', wm.Invocation)
  fromExitOfInvocation(inv: wm.IInvocation, prefix: string): ExprNode<bm.INode> {
    return <FromNode $refByName={`${prefix}${this.occurrenceNameOf(inv)}`} />
  }

  @SpecOption('fromExitOf', wm.Sequence)
  fromExitOfSequence(q: wm.ISequence, prefix: string): ExprNode<bm.INode> {
    const children = this.childrenOf(q)
    return this.fromExitOf(children[children.length - 1], prefix)
  }

  @SpecOption('fromExitOf', wm.Parallel)
  fromExitOfParallel(p: wm.IParallel, prefix: string): ExprNode<bm.INode> {
    return <FromNode $refByName={`${prefix}${this.baseOf(p, 'par')}_join`} />
  }

  @SpecOption('fromExitOf', wm.Choice)
  fromExitOfChoice(c: wm.IChoice, prefix: string): ExprNode<bm.INode> {
    return <FromNode $refByName={`${prefix}${this.baseOf(c, 'choice')}_join`} />
  }

  @SpecOption('fromExitOf', wm.Loop)
  fromExitOfLoop(l: wm.ILoop, prefix: string): ExprNode<bm.INode> {
    return <FromNode $refByName={`${prefix}${this.baseOf(l, 'loop')}_exit`} />
  }

  // ----- small helpers ---------------------------------------------------

  // The embedded expansion shared by inline process steps and process
  // invocations: a sub-process node with its own start and end, its
  // body flattened under the node's name as a prefix.
  private embeddedSubProcess(name: string, steps: wm.IStep[]): ExprNode<bm.ISubProcess> {
    const inner = `${name}_`
    return (
      <SubProcess name={name}>
        <StartEvent name={`${inner}start`} />
        {steps.flatMap((s) => this.stepToGraph(s, inner))}
        <EndEvent name={`${inner}end`} />
        {this.chainFlows(steps, inner)}
        <Flow name={this.nextFlowName()}>
          <FromNode $refByName={`${inner}start`} />
          {this.toEntryOf(steps[0], inner)}
        </Flow>
        <Flow name={this.nextFlowName()}>
          {this.fromExitOf(steps[steps.length - 1], inner)}
          <ToNode $refByName={`${inner}end`} />
        </Flow>
      </SubProcess>
    )
  }

  private chainFlows(steps: wm.IStep[], prefix: string): ExprNode<bm.IFlow>[] {
    const flows: ExprNode<bm.IFlow>[] = []
    for (let i = 0; i < steps.length - 1; i++) {
      flows.push(
        <Flow name={this.nextFlowName()}>
          {this.fromExitOf(steps[i], prefix)}
          {this.toEntryOf(steps[i + 1], prefix)}
        </Flow>
      )
    }
    return flows
  }

  private nextFlowName(): string {
    return `f${++this.flowCount}`
  }

  // Stable base name for a gateway pair: the step's authored name, or
  // a generated per-kind one remembered per element, so the graph rule
  // and the boundary references always agree. The store backfills
  // label exactly when a name was authored, so its absence marks an
  // unnamed step.
  private baseOf(s: wm.IStep, kind: string): string {
    if (s.label !== undefined) return s.name as string
    let base = this.baseNames.get(s)
    if (base === undefined) {
      const n = (this.baseCounts.get(kind) ?? 0) + 1
      this.baseCounts.set(kind, n)
      base = `${kind}${n}`
      this.baseNames.set(s, base)
    }
    return base
  }

  // The occurrence name defaults to the called definition's name.
  private occurrenceNameOf(inv: wm.IInvocation): string {
    if (inv.label !== undefined) return inv.name as string
    return this.calledOf(inv).name as string
  }

  private calledOf(inv: wm.IInvocation): wm.IActivity {
    const called = inv.activity as wm.IActivity | undefined
    if (!called) {
      throw new Error(`Invocation '${inv.name}' names no activity definition`)
    }
    return called
  }

  private guardOf(l: wm.ILoop): string {
    const guard = (l.guard ?? '') as string
    if (guard === '') {
      throw new Error(`Loop '${l.name}' has no guard`)
    }
    return guard
  }

  private childrenOf(s: wm.IStep): wm.IStep[] {
    const children = ((s as IBlock).children ?? []) as wm.IStep[]
    if (children.length === 0) {
      throw new Error(`Block '${s.name}' is empty: it has no entry or exit`)
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

  // The chain's entry: the first process definition no invocation in
  // the model calls (the root of the call graph).
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
