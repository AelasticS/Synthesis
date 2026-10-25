/** @jsx createExprNode */
/*
 * The two modes of @SpecPoint:
 *  - skeleton merge (base returns an expression): unchanged behavior,
 *    the option's element absorbs the base's props and children;
 *  - pure dispatch (base returns nothing): the chosen option's result is
 *    returned as is, whatever its shape (expression, array, plain value).
 * A base skeleton combined with an array-returning option is an error.
 *
 * Selection: an option applies when the element's type is the option's
 * type or a subtype of it, and the most specific applicable option wins
 * regardless of declaration order. No applicable option is an error,
 * whether or not the point's body returns something.
 */
import { createExprNode, Context, ExprNode } from "../../jsx-runtime"
import { ModelStore } from "../index"
import { abstractM2M } from "./abstractM2M"
import { SpecPoint, SpecOption } from "./spec-decorators"
import { Process, Sequence, Task, Parallel, SubProcess } from "../test/bpm-metamodel"
import * as b from "../test/bpm-metamodel/BPM.meta.model.type"

class DispatchTx extends abstractM2M<b.IProcess, b.IProcess> {
  main(m: b.IProcess): ExprNode<b.IProcess> {
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

// Subtype-aware selection. Task and Parallel are sibling subtypes of
// Node, and SubProcess is a subtype of Task.
class SubtypeTx extends abstractM2M<b.IProcess, b.IProcess> {
  main(m: b.IProcess): ExprNode<b.IProcess> {
    return <Process name="unused" store={this.context.store} />
  }

  // Only a supertype option exists.
  @SpecPoint()
  superOnly(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("superOnly", b.Task)
  superOnlyTask(t: b.ITask): string {
    return "task"
  }

  // Only a subtype option exists.
  @SpecPoint()
  subOnly(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("subOnly", b.SubProcess)
  subOnlySub(s: b.ISubProcess): string {
    return "sub"
  }

  // Supertype and subtype options, supertype declared first.
  @SpecPoint()
  superFirst(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("superFirst", b.Node)
  superFirstNode(n: b.INode): string {
    return "node"
  }

  @SpecOption("superFirst", b.Task)
  superFirstTask(t: b.ITask): string {
    return "task"
  }

  // The same two options, subtype declared first.
  @SpecPoint()
  subFirst(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("subFirst", b.Task)
  subFirstTask(t: b.ITask): string {
    return "task"
  }

  @SpecOption("subFirst", b.Node)
  subFirstNode(n: b.INode): string {
    return "node"
  }

  // A body that returns an expression is no fallback.
  @SpecPoint()
  withSkeleton(a: b.INode): ExprNode<b.ITask> {
    return <Task name={`${a.name}_skel`} activity="skel" />
  }

  @SpecOption("withSkeleton", b.Task)
  withSkeletonTask(t: b.ITask): ExprNode<b.ITask> {
    return <Task activity="opt" />
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

describe("@SpecPoint option selection by subtype", () => {
  const store = new ModelStore()
  const model = (
    <Process name="P" store={store}>
      <Sequence name="s1">
        <Task name="t1" activity="a1" />
        <SubProcess name="sp1" activity="a2" />
        <Parallel name="p1" />
      </Sequence>
    </Process>
  ).render(new Context()) as b.IProcess
  const elements = (model.elements ?? []) as unknown as b.INode[]
  const task = elements.find((e) => e.name === "t1") as b.ITask
  const sub = elements.find((e) => e.name === "sp1") as b.ISubProcess
  const parallel = elements.find((e) => e.name === "p1") as b.IParallel
  const tx = new SubtypeTx(store)

  it("an option declared for a supertype catches an element of a subtype", () => {
    expect(tx.superOnly(sub)).toBe("task")
  })

  it("an option declared for a subtype does not catch an element of the supertype", () => {
    expect(() => tx.subOnly(task)).toThrow("No specialized method found")
  })

  it("the subtype option wins over the supertype option, supertype declared first", () => {
    expect(tx.superFirst(task)).toBe("task")
    expect(tx.superFirst(sub)).toBe("task")
  })

  it("the subtype option wins over the supertype option, subtype declared first", () => {
    expect(tx.subFirst(task)).toBe("task")
    expect(tx.subFirst(sub)).toBe("task")
  })

  it("an element of a sibling subtype gets the supertype option", () => {
    expect(tx.superFirst(parallel)).toBe("node")
    expect(tx.subFirst(parallel)).toBe("node")
  })

  it("no applicable option is an error even when the body returns an expression", () => {
    expect(tx.withSkeleton(task).isAbstract).toBe(true)
    expect(() => tx.withSkeleton(parallel)).toThrow("No specialized method found")
  })

  it("a second option for the same type is rejected at decoration time", () => {
    expect(() => {
      class DuplicateTx extends abstractM2M<b.IProcess, b.IProcess> {
        main(m: b.IProcess): ExprNode<b.IProcess> {
          return <Process name="unused" store={this.context.store} />
        }

        @SpecPoint()
        point(a: b.INode): string {
          return undefined! // pure dispatcher
        }

        @SpecOption("point", b.Task)
        first(t: b.ITask): string {
          return "first"
        }

        @SpecOption("point", b.Task)
        second(t: b.ITask): string {
          return "second"
        }
      }
      return DuplicateTx
    }).toThrow(/@SpecOption 'second': @SpecPoint 'point' already has option 'first' for type 'Task'/)
  })
})
