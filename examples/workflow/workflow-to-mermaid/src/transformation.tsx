/** @jsx createExprNode */

/**
 * Block-structured workflow model to Mermaid flowchart text: the
 * structure view, drawing
 * the SOURCE of the workflow chain rather than its flattened graph.
 * One document per process, one nested subgraph per composite
 * activity, so the tree structure stays visible. A task is a box; a
 * sequence is a subgraph whose consecutive children are chained with
 * edges; a parallel is a subgraph with no edges between its children,
 * because side-by-side placement IS the meaning; a sub-process is a
 * subgraph carrying its recursively rendered body (implicitly a
 * sequence, so its children chain too). Node ids are the authored
 * names with every non-alphanumeric character replaced by an
 * underscore (names are unique per workflow model, so the sanitized
 * name is the id); labels keep the authored names verbatim, spaces
 * included, read from the element's label (the store keeps the
 * pre-normalization name there).
 */
import { createExprNode } from '@aelastics/synthesis/jsx'
import type { ExprNode } from '@aelastics/synthesis/jsx'
import { abstractM2M } from '@aelastics/synthesis/m2m'
import { M2T, Doc, P } from '@aelastics/synthesis/m2t'
import type { M2T_Model } from '@aelastics/synthesis/m2t'
import type { ModelStore } from '@aelastics/synthesis/store'
import * as wm from 'workflow-metamodel/model'

export class WorkflowToMermaidTransformation extends abstractM2M<wm.IProcess, M2T_Model> {
  constructor(store: ModelStore) {
    super(store)
  }

  template(p: wm.IProcess): ExprNode<wm.IProcess, M2T_Model> {
    if (!p.body) {
      throw new Error(`Process '${p.name}' has no body block`)
    }
    return (
      <M2T name={`${p.name}_mermaid`}>
        <Doc name={`${p.name}.mmd`}>
          <P>{'flowchart TD'}</P>
          {this.activityLines(p.body as wm.IActivity, 1)}
        </Doc>
      </M2T>
    )
  }

  // One method per activity kind, dispatched by type test; the tree
  // has four kinds and the recursion mirrors its nesting.
  private activityLines(a: wm.IActivity, depth: number): ExprNode<any>[] {
    const store = this.context.store
    if (store.isTypeOf(a, wm.Task)) return this.taskLines(a as wm.ITask, depth)
    if (store.isTypeOf(a, wm.Sequence)) return this.sequenceLines(a as wm.ISequence, depth)
    if (store.isTypeOf(a, wm.Parallel)) return this.parallelLines(a as wm.IParallel, depth)
    if (store.isTypeOf(a, wm.SubProcess)) return this.subProcessLines(a as wm.ISubProcess, depth)
    throw new Error(`Activity '${a.name}' has an unknown kind`)
  }

  private taskLines(t: wm.ITask, depth: number): ExprNode<any>[] {
    return [<P>{`${this.ind(depth)}${this.id(t)}["${this.labelOf(t)}"]`}</P>]
  }

  private sequenceLines(q: wm.ISequence, depth: number): ExprNode<any>[] {
    return this.blockLines(q, 'sequence', depth, true)
  }

  private parallelLines(p: wm.IParallel, depth: number): ExprNode<any>[] {
    return this.blockLines(p, 'parallel', depth, false)
  }

  private subProcessLines(s: wm.ISubProcess, depth: number): ExprNode<any>[] {
    return this.blockLines(s, 'sub-process', depth, true)
  }

  // Every composite is a subgraph labeled with its kind; the children
  // chain with edges exactly when the block is sequential (a
  // sub-process body is implicitly a sequence). An edge may start or
  // end at a subgraph id; that is valid Mermaid.
  private blockLines(a: wm.IActivity, kind: string, depth: number, chained: boolean): ExprNode<any>[] {
    const children = (a.children ?? []) as wm.IActivity[]
    if (children.length === 0) {
      throw new Error(`Block '${a.name}' is empty: there is nothing to draw`)
    }
    const edges: ExprNode<any>[] = []
    if (chained) {
      for (let i = 0; i < children.length - 1; i++) {
        edges.push(
          <P>{`${this.ind(depth + 1)}${this.id(children[i])} --> ${this.id(children[i + 1])}`}</P>
        )
      }
    }
    return [
      <P>{`${this.ind(depth)}subgraph ${this.id(a)}["${this.labelOf(a)} (${kind})"]`}</P>,
      ...children.flatMap((c) => this.activityLines(c, depth + 1)),
      ...edges,
      <P>{`${this.ind(depth)}end`}</P>,
    ]
  }

  private ind(depth: number): string {
    return '  '.repeat(depth)
  }

  // The authored name, spaces included: the store normalizes name
  // (whitespace stripped) and keeps the pre-normalization form in
  // label, backfilling label from name when nothing was stripped.
  private labelOf(a: wm.IActivity): string {
    return String(a.label ?? a.name)
  }

  // Mermaid ids allow no spaces and reserve a few words; the sanitized
  // authored name is collision-free because names are unique per
  // block-structured workflow model, and the label keeps the authored name. A reserved
  // name gets a suffix in the id, as in bpmn-to-mermaid.
  private id(a: wm.IActivity): string {
    const sanitized = this.labelOf(a).replace(/[^A-Za-z0-9]/g, '_')
    return ['end', 'subgraph', 'graph', 'direction'].includes(sanitized) ? `${sanitized}_node` : sanitized
  }
}
