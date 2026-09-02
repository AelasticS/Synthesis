/** @jsx createExprNode */

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
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M, E2E } from '@aelastics/synthesis/m2m'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as wm from 'workflow-metamodel/model'
import * as bm from 'bpmn-metamodel/model'
import { Task, StartEvent, EndEvent, Gateway, SubProcess, Flow, Process } from 'bpmn-metamodel'

/** A flow endpoint: the node's name and concept kind (for the reference tag). */
interface Port {
  name: string
  kind: 'task' | 'gateway' | 'subprocess' | 'start' | 'end'
}

/** What an activity contributes: nodes, flows, and its entry/exit ports. */
interface Fragment {
  nodes: ExprNode<bm.INode>[]
  flows: ExprNode<bm.IFlow>[]
  entry: Port
  exit: Port
}

export class WorkflowToBpmnTransformation extends abstractM2M<wm.IProcess, bm.IProcess> {
  private flowCount = 0
  private parCount = 0

  constructor(store: ModelStore) {
    super(store)
  }

  template(p: wm.IProcess): ExprNode<wm.IProcess, bm.IProcess> {
    const body = this.sequenceFragment(this.topLevelActivities(p))
    return (
      <Process name={`${p.name}_bpmn`} content="" MDA_level="M1" store={this.context.store}>
        <StartEvent name="start" />
        {body.nodes}
        <EndEvent name="end" />
        {body.flows}
        {this.flow({ name: 'start', kind: 'start' }, body.entry)}
        {this.flow(body.exit, { name: 'end', kind: 'end' })}
      </Process>
    )
  }

  // ----- fragments per activity kind -------------------------------------

  activityFragment(a: wm.IActivity): Fragment {
    const store = this.context.store
    if (store.isTypeOf(a, wm.Task)) {
      return this.taskFragment(a as wm.ITask)
    }
    if (store.isTypeOf(a, wm.Parallel)) {
      return this.parallelFragment(a as wm.IParallel)
    }
    if (store.isTypeOf(a, wm.SubProcess)) {
      return this.subProcessFragment(a as wm.ISubProcess)
    }
    if (store.isTypeOf(a, wm.Sequence)) {
      return this.sequenceFragment(this.childrenOf(a))
    }
    throw new Error(`Unknown activity kind for '${a.name}'`)
  }

  taskFragment(t: wm.ITask): Fragment {
    const port: Port = { name: t.name, kind: 'task' }
    return { nodes: [this.taskToNode(t)], flows: [], entry: port, exit: port }
  }

  sequenceFragment(children: wm.IActivity[]): Fragment {
    if (children.length === 0) {
      throw new Error('An empty block cannot be mapped: it has no entry or exit')
    }
    const fragments = children.map((c) => this.activityFragment(c))
    const nodes = fragments.flatMap((f) => f.nodes)
    const flows = fragments.flatMap((f) => f.flows)
    for (let i = 0; i < fragments.length - 1; i++) {
      flows.push(this.flow(fragments[i].exit, fragments[i + 1].entry))
    }
    return { nodes, flows, entry: fragments[0].entry, exit: fragments[fragments.length - 1].exit }
  }

  parallelFragment(p: wm.IParallel): Fragment {
    const base = p.name && p.name.length > 0 ? p.name : `par${++this.parCount}`
    const split: Port = { name: `${base}_split`, kind: 'gateway' }
    const join: Port = { name: `${base}_join`, kind: 'gateway' }
    const fragments = this.childrenOf(p).map((c) => this.activityFragment(c))
    const nodes = [
      this.parallelToSplitGateway(p, split.name),
      ...fragments.flatMap((f) => f.nodes),
      this.parallelToJoinGateway(p, join.name),
    ]
    const flows = fragments.flatMap((f) => f.flows)
    for (const f of fragments) {
      flows.push(this.flow(split, f.entry))
      flows.push(this.flow(f.exit, join))
    }
    return { nodes, flows, entry: split, exit: join }
  }

  subProcessFragment(s: wm.ISubProcess): Fragment {
    const port: Port = { name: s.name, kind: 'subprocess' }
    return { nodes: [this.subProcessToNode(s)], flows: [], entry: port, exit: port }
  }

  // ----- single-node rules (traced) --------------------------------------

  @E2E()
  taskToNode(t: wm.ITask): ExprNode<bm.ITask> {
    return <Task name={t.name} />
  }

  @E2E()
  parallelToSplitGateway(p: wm.IParallel, name: string): ExprNode<bm.IGateway> {
    return <Gateway name={name} kind="parallel" />
  }

  @E2E()
  parallelToJoinGateway(p: wm.IParallel, name: string): ExprNode<bm.IGateway> {
    return <Gateway name={name} kind="parallel" />
  }

  @E2E()
  subProcessToNode(s: wm.ISubProcess): ExprNode<bm.ISubProcess> {
    const body = this.sequenceFragment(this.childrenOf(s))
    const start: Port = { name: `${s.name}_start`, kind: 'start' }
    const end: Port = { name: `${s.name}_end`, kind: 'end' }
    return (
      <SubProcess name={s.name}>
        <StartEvent name={start.name} />
        {body.nodes}
        <EndEvent name={end.name} />
        {body.flows}
        {this.flow(start, body.entry)}
        {this.flow(body.exit, end)}
      </SubProcess>
    )
  }

  // ----- flows and traversal helpers -------------------------------------

  flow(from: Port, to: Port): ExprNode<bm.IFlow> {
    return <Flow name={`f${++this.flowCount}`} from={this.nodeRef(from)} to={this.nodeRef(to)} />
  }

  // A flow endpoint references an existing node; the tag matches the
  // node's concept so the reference stays well typed.
  private nodeRef(port: Port): ExprNode<bm.INode> {
    switch (port.kind) {
      case 'task':
        return <Task $refByName={port.name} />
      case 'gateway':
        return <Gateway $refByName={port.name} />
      case 'subprocess':
        return <SubProcess $refByName={port.name} />
      case 'start':
        return <StartEvent $refByName={port.name} />
      case 'end':
        return <EndEvent $refByName={port.name} />
    }
  }

  private childrenOf(a: wm.IActivity): wm.IActivity[] {
    return (a.children ?? []) as wm.IActivity[]
  }

  // Top-level activities: elements of the process whose parent is not
  // another activity (the model's element list is flat, so nested
  // activities appear in it too).
  private topLevelActivities(p: wm.IProcess): wm.IActivity[] {
    const store = this.context.store
    const elements = (p.elements ?? []) as unknown as wm.IActivity[]
    return elements.filter((el) => store.isTypeOf(el, wm.Activity) && !el.parent)
  }
}
