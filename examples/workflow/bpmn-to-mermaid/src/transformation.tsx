/** @jsx createExprNode */

/**
 * Graph-based BPMN to Mermaid flowchart text. One document per process:
 * a node declaration line per node (tasks as boxes, gateways as
 * diamonds, events as stadium shapes, sub-processes as nested
 * subgraphs) followed by an edge line per flow. Which line a node gets
 * is decided by specialization: one pure-dispatch point, one option per
 * node kind.
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M, SpecPoint, SpecOption } from '@aelastics/synthesis/m2m'
import { M2T, Doc, P } from '@aelastics/synthesis/m2t'
import type { M2T_Model } from '@aelastics/synthesis/m2t'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as bm from 'bpmn-metamodel/model'

export class BpmnToMermaidTransformation extends abstractM2M<bm.IProcess, M2T_Model> {
  constructor(store: ModelStore) {
    super(store)
  }

  topRule(p: bm.IProcess): ExprNode<bm.IProcess, M2T_Model> {
    this.countDegrees((p.flows ?? []) as bm.IFlow[])
    return (
      <M2T name={`${p.name}_mermaid`}>
        <Doc name={`${p.name}.mmd`}>
          <P>{'flowchart TD'}</P>
          {((p.nodes ?? []) as bm.INode[]).flatMap((n) => this.nodeToLines(n, 1))}
          {((p.flows ?? []) as bm.IFlow[]).map((f) => this.flowToLine(f, 1))}
        </Doc>
      </M2T>
    )
  }

  // A gateway's role is not stored, it is derived, as in BPMN: more
  // than one outgoing flow makes it a split, more than one incoming a
  // join. Degrees are counted per container before its nodes render.
  private outDegree = new Map<bm.INode, number>()
  private inDegree = new Map<bm.INode, number>()

  private countDegrees(flows: bm.IFlow[]): void {
    for (const f of flows) {
      const from = f.from as bm.INode
      const to = f.to as bm.INode
      this.outDegree.set(from, (this.outDegree.get(from) ?? 0) + 1)
      this.inDegree.set(to, (this.inDegree.get(to) ?? 0) + 1)
    }
  }

  private roleOf(g: bm.IGateway): string {
    if ((this.outDegree.get(g) ?? 0) > 1) return `${g.kind} split`
    if ((this.inDegree.get(g) ?? 0) > 1) return `${g.kind} join`
    return String(g.kind)
  }

  @SpecPoint()
  nodeToLines(n: bm.INode, depth: number): ExprNode<any> | ExprNode<any>[] {
    return undefined! // pure dispatcher: the matching option supplies the lines
  }

  @SpecOption('nodeToLines', bm.Task)
  taskLine(t: bm.ITask, depth: number): ExprNode<any> {
    return <P>{`${this.ind(depth)}${this.id(t.name)}["${t.name}"]`}</P>
  }

  @SpecOption('nodeToLines', bm.Gateway)
  gatewayLine(g: bm.IGateway, depth: number): ExprNode<any> {
    return <P>{`${this.ind(depth)}${this.id(g.name)}{"${this.roleOf(g)}"}`}</P>
  }

  @SpecOption('nodeToLines', bm.StartEvent)
  startEventLine(e: bm.IStartEvent, depth: number): ExprNode<any> {
    return <P>{`${this.ind(depth)}${this.id(e.name)}(["${e.name}"])`}</P>
  }

  @SpecOption('nodeToLines', bm.EndEvent)
  endEventLine(e: bm.IEndEvent, depth: number): ExprNode<any> {
    return <P>{`${this.ind(depth)}${this.id(e.name)}(["${e.name}"])`}</P>
  }

  @SpecOption('nodeToLines', bm.SubProcess)
  subProcessLines(s: bm.ISubProcess, depth: number): ExprNode<any>[] {
    this.countDegrees((s.flows ?? []) as bm.IFlow[])
    return [
      <P>{`${this.ind(depth)}subgraph ${this.id(s.name)}["${s.name}"]`}</P>,
      ...((s.nodes ?? []) as bm.INode[]).flatMap((n) => this.nodeToLines(n, depth + 1)),
      ...((s.flows ?? []) as bm.IFlow[]).map((f) => this.flowToLine(f, depth + 1)),
      <P>{`${this.ind(depth)}end`}</P>,
    ]
  }

  flowToLine(f: bm.IFlow, depth: number): ExprNode<any> {
    const guard = f.guard ? `|${f.guard}|` : ''
    return (
      <P>{`${this.ind(depth)}${this.id((f.from as bm.INode).name)} -->${guard} ${this.id((f.to as bm.INode).name)}`}</P>
    )
  }

  private ind(depth: number): string {
    return '  '.repeat(depth)
  }

  // Some words are reserved in Mermaid flowcharts; a reserved node name
  // gets a suffix in the diagram id while the label keeps the model name.
  private id(name: string): string {
    return ['end', 'subgraph', 'graph', 'direction'].includes(name) ? `${name}_node` : name
  }
}
