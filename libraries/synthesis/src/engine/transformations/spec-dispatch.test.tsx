/** @jsx createExprNode */
/*
 * The two modes of @SpecPoint:
 *  - skeleton merge (base returns an expression): unchanged behavior,
 *    the option's element absorbs the base's props and children;
 *  - pure dispatch (base returns nothing): the chosen option's result is
 *    returned as is, whatever its shape (expression, array, plain value).
 * A base skeleton combined with an array-returning option is an error.
 */
import { createExprNode, Context, ExprNode } from "../../jsx-runtime"
import { ModelStore } from "../index"
import { abstractM2M } from "./abstractM2M"
import { SpecPoint, SpecOption } from "./spec-decorators"
import { Process, Sequence, Task, Parallel } from "../test/bpm-metamodel"
import * as b from "../test/bpm-metamodel/BPM.meta.model.type"

class DispatchTx extends abstractM2M<b.IProcess, b.IProcess> {
  topRule(m: b.IProcess): ExprNode<b.IProcess> {
    return <Process name="unused" store={this.context.store} />
  }

  // Pure dispatch with a non-expression result.
  @SpecPoint()
  kindOf(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("kindOf", b.Task)
  kindOfTask(t: b.ITask): string {
    return "task"
  }

  @SpecOption("kindOf", b.Parallel)
  kindOfParallel(p: b.IParallel): string {
    return "parallel"
  }

  // Pure dispatch with an array of expressions.
  @SpecPoint()
  pairOf(a: b.INode): ExprNode<b.ITask>[] {
    return undefined! // pure dispatcher
  }

  @SpecOption("pairOf", b.Task)
  pairOfTask(t: b.ITask): ExprNode<b.ITask>[] {
    return [
      <Task name={`${t.name}_a`} activity="x" />,
      <Task name={`${t.name}_b`} activity="x" />,
    ]
  }

  // Skeleton merge: base supplies name, option supplies activity.
  @SpecPoint()
  merged(a: b.INode): ExprNode<b.ITask> {
    return <Task name={`${a.name}_m`} activity="base" />
  }

  @SpecOption("merged", b.Task)
  mergedTask(t: b.ITask): ExprNode<b.ITask> {
    return <Task activity="opt" />
  }

  // Skeleton plus array: a contradiction that must fail clearly.
  @SpecPoint()
  broken(a: b.INode): ExprNode<b.ITask> {
    return <Task name="skel" activity="s" />
  }

  @SpecOption("broken", b.Task)
  brokenTask(t: b.ITask): ExprNode<b.ITask>[] {
    return [<Task name="x1" activity="x" />] as unknown as ExprNode<b.ITask>[]
  }
}

describe("@SpecPoint dispatch modes", () => {
  const store = new ModelStore()
  const model = (
    <Process name="P" store={store}>
      <Sequence name="s1">
        <Task name="t1" activity="a1" />
        <Parallel name="p1" />
      </Sequence>
    </Process>
  ).render(new Context()) as b.IProcess
  const elements = (model.elements ?? []) as unknown as b.INode[]
  const task = elements.find((e) => e.name === "t1") as b.ITask
  const parallel = elements.find((e) => e.name === "p1") as b.IParallel
  const tx = new DispatchTx(store)

  it("pure dispatch returns the option result as is, any type", () => {
    expect(tx.kindOf(task)).toBe("task")
    expect(tx.kindOf(parallel)).toBe("parallel")
  })

  it("pure dispatch passes arrays of expressions through", () => {
    const pair = tx.pairOf(task)
    expect(Array.isArray(pair)).toBe(true)
    expect(pair.length).toBe(2)
    expect((pair[0].props as { name?: string }).name).toBe("t1_a")
  })

  it("skeleton merge is unchanged: option element absorbs base props", () => {
    const m = tx.merged(task)
    expect(m.isAbstract).toBe(true)
    expect(m.subElement).toBeDefined()
    const out = (
      <Process name="P2" store={store}>
        <Sequence name="s2">{m}</Sequence>
      </Process>
    ).render(new Context()) as b.IProcess
    const created = ((out.elements ?? []) as unknown as b.ITask[]).find(
      (e) => e.name === "t1_m"
    )
    expect(created).toBeDefined()
    expect(created!.activity).toBe("opt")
  })

  it("skeleton plus array-returning option fails with a clear error", () => {
    expect(() => tx.broken(task)).toThrow(/pure\s+dispatcher/)
  })
})
