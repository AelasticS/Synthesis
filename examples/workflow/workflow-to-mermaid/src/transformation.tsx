/** @jsx createExprNode */

/**
 * Block-structured workflow model to Mermaid flowchart text: the
 * flowchart view, drawing the SOURCE of the workflow chain in the
 * classic flowchart idiom. One document per model, drawing the entry
 * process (the first process definition no invocation calls). The walk
 * is a wiring contract: every step yields an entry node and a LIST of
 * exit nodes, and a sequence connects all previous exits to the next
 * step's entry; every implicit sequence (a process body, a branch
 * body, a loop body) wires the same way. A start stadium opens the
 * chart, wired to the first step's entry, and every final exit wires
 * to the end stadium. A task is a box, its performer a parenthesized
 * second label line; an invocation is a subroutine box named by the
 * occurrence (call semantics stays opaque), while an INLINE process
 * step, being single-use grouping, expands inline into its steps (its
 * own name does not appear in the drawing). A choice is one decision
 * diamond: each branch's outgoing edge carries its guard (the
 * guardless branch's edge labeled else), and all branch exits become
 * the choice's exits, reconverging on whatever comes next with no
 * merge node. A loop is a guard diamond with a back edge: a
 * repeatUntil runs the body first and tests after it (no returns to
 * the body, yes exits); a while tests first (yes enters the body,
 * whose exits return unlabeled, no exits). A parallel is a fork bar
 * fanning out to every child's entry and a join bar every child's
 * exits converge on. Documents are not drawn. Node ids are the
 * sanitized authored names (unique per process scope); labels keep the
 * authored names verbatim, spaces included, read from the element's
 * label (the store keeps the pre-normalization name there). An unnamed
 * operator gets a generated per-kind id.
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

/** An exit point: the node an outgoing edge leaves, and the label the
 * edge carries (a loop diamond's yes/no answer). */
interface Exit {
  id: string
  label?: string
}

/** What every step yields to the wiring: its entry node id, its exit
 * points, its node declaration lines, and its internal edge lines. */
interface Wiring {
  entry: string
  exits: Exit[]
  nodes: string[]
  edges: string[]
}

export class WorkflowToMermaidTransformation extends abstractM2M<wm.IWorkflowModel, M2T_Model> {
  private genIds = new Map<wm.IStep, string>()
  private genCounts = new Map<string, number>()

  constructor(store: ModelStore) {
    super(store)
  }

  template(m: wm.IWorkflowModel): ExprNode<wm.IWorkflowModel, M2T_Model> {
    const entry = this.entryProcessOf(m)
    const body = this.bodyWiring(this.stepsOf(entry))
    const lines = [
      'start_node(["start"])',
      ...body.nodes,
      'end_node(["end"])',
      `start_node --> ${body.entry}`,
      ...body.edges,
      ...body.exits.map((e) => this.edge(e, 'end_node')),
    ]
    return (
      <M2T name={`${m.name}_mermaid`}>
        <Doc name={`${m.name}.mmd`}>
          <P>{'flowchart TD'}</P>
          {lines.map((l) => <P>{`  ${l}`}</P>)}
        </Doc>
      </M2T>
    )
  }

  // One method per step kind, dispatched by type test; the recursion
  // follows the tree while the wiring flattens it into one chart.
  private stepWiring(s: wm.IStep): Wiring {
    const store = this.context.store
    if (store.isTypeOf(s, wm.Task)) return this.taskWiring(s as wm.ITask)
    if (store.isTypeOf(s, wm.Process)) return this.bodyWiring(this.stepsOf(s as wm.IProcess))
    if (store.isTypeOf(s, wm.Invocation)) return this.invocationWiring(s as wm.IInvocation)
    if (store.isTypeOf(s, wm.Sequence)) return this.bodyWiring(this.childrenOf(s))
    if (store.isTypeOf(s, wm.Parallel)) return this.parallelWiring(s as wm.IParallel)
    if (store.isTypeOf(s, wm.Choice)) return this.choiceWiring(s as wm.IChoice)
    if (store.isTypeOf(s, wm.Loop)) return this.loopWiring(s as wm.ILoop)
    throw new Error(`Step '${s.name}' has an unknown kind`)
  }

  // A task is a box; a performer adds a parenthesized second label
  // line. An inline task is a single-use definition, so the box IS the
  // occurrence.
  private taskWiring(t: wm.ITask): Wiring {
    const id = this.idOf(t)
    const performer = (t.performer ?? '') as string
    const label = performer === '' ? this.labelOf(t) : `${this.labelOf(t)}<br/>(${performer})`
    return { entry: id, exits: [{ id }], nodes: [`${id}["${label}"]`], edges: [] }
  }

  // An invocation is a subroutine box named by the occurrence; what
  // the called definition does stays behind the call. (An inline
  // process, by contrast, is single-use grouping and expands inline
  // through the Process branch of the dispatch.)
  private invocationWiring(inv: wm.IInvocation): Wiring {
    this.calledOf(inv)
    const display = this.occurrenceDisplayOf(inv)
    const id = this.sanitizedId(display)
    return { entry: id, exits: [{ id }], nodes: [`${id}[["${display}"]]`], edges: [] }
  }

  // Sequential wiring: every previous exit connects to the next step's
  // entry. A process body, a branch body, and a loop body are implicit
  // sequences and wire the same way.
  private bodyWiring(steps: wm.IStep[]): Wiring {
    const first = this.stepWiring(steps[0])
    const nodes = [...first.nodes]
    const edges = [...first.edges]
    let exits = first.exits
    for (const s of steps.slice(1)) {
      const w = this.stepWiring(s)
      nodes.push(...w.nodes)
      edges.push(...exits.map((e) => this.edge(e, w.entry)), ...w.edges)
      exits = w.exits
    }
    return { entry: first.entry, exits, nodes, edges }
  }

  // A parallel is a fork bar fanning out to every child's entry and a
  // join bar every child's exits converge on; the join is the exit.
  private parallelWiring(p: wm.IParallel): Wiring {
    const base = this.idOf(p)
    const fork = `${base}_fork`
    const join = `${base}_join`
    const nodes = [`${fork}@{ shape: fork }`]
    const edges: string[] = []
    for (const c of this.childrenOf(p)) {
      const w = this.stepWiring(c)
      nodes.push(...w.nodes)
      edges.push(`${fork} --> ${w.entry}`, ...w.edges, ...w.exits.map((e) => this.edge(e, join)))
    }
    nodes.push(`${join}@{ shape: join }`)
    return { entry: fork, exits: [{ id: join }], nodes, edges }
  }

  // A choice is ONE decision diamond: each branch's outgoing edge
  // carries its guard (the guardless branch's edge labeled else), the
  // branch bodies wire normally, and all branch exits become the
  // choice's exits, so the branches reconverge on whatever comes next
  // without a merge node.
  private choiceWiring(c: wm.IChoice): Wiring {
    const id = this.idOf(c)
    const nodes = [`${id}{"${this.choiceLabelOf(c)}"}`]
    const edges: string[] = []
    const exits: Exit[] = []
    for (const b of this.branchesOf(c)) {
      const w = this.bodyWiring(this.childrenOf(b))
      const guard = (b.guard ?? '') as string
      nodes.push(...w.nodes)
      edges.push(`${id} -->|${guard === '' ? 'else' : guard}| ${w.entry}`, ...w.edges)
      exits.push(...w.exits)
    }
    return { entry: id, exits, nodes, edges }
  }

  // The diamond's question: the authored choice name, or the single
  // guard of an otherwise unnamed choice, or the bare question mark.
  private choiceLabelOf(c: wm.IChoice): string {
    if (c.label !== undefined) return `${this.labelOf(c)}?`
    const guards = ((c.children ?? []) as wm.IBranch[])
      .map((b) => (b.guard ?? '') as string)
      .filter((g) => g !== '')
    return guards.length === 1 ? `${guards[0]}?` : '?'
  }

  // A loop is a guard diamond and a back edge. A repeatUntil runs the
  // body first and tests after it: the no edge returns to the body's
  // entry, the yes edge is the exit. A while tests first: the yes edge
  // enters the body, whose exits return to the diamond unlabeled, and
  // the no edge is the exit.
  private loopWiring(l: wm.ILoop): Wiring {
    const guard = (l.guard ?? '') as string
    if (guard === '') {
      throw new Error(`Loop '${l.name}' has no guard`)
    }
    const id = this.idOf(l)
    const diamond = `${id}{"${guard}?"}`
    const body = this.bodyWiring(this.childrenOf(l))
    if (l.kind === 'while') {
      return {
        entry: id,
        exits: [{ id, label: 'no' }],
        nodes: [diamond, ...body.nodes],
        edges: [`${id} -->|yes| ${body.entry}`, ...body.edges, ...body.exits.map((e) => this.edge(e, id))],
      }
    }
    return {
      entry: body.entry,
      exits: [{ id, label: 'yes' }],
      nodes: [...body.nodes, diamond],
      edges: [...body.edges, ...body.exits.map((e) => this.edge(e, id)), `${id} -->|no| ${body.entry}`],
    }
  }

  // An edge line; the exit's label, when it carries one, rides on the
  // edge.
  private edge(from: Exit, to: string): string {
    return from.label === undefined ? `${from.id} --> ${to}` : `${from.id} -->|${from.label}| ${to}`
  }

  // The authored name, spaces included: the store normalizes name
  // (whitespace stripped) and keeps the pre-normalization form in
  // label, backfilling label from name when nothing was stripped.
  private labelOf(s: wm.IStep): string {
    return String(s.label ?? s.name)
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
