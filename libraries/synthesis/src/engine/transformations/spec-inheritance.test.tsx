/** @jsx createExprNode */
/*
 * @SpecOption registration across a class hierarchy and declaration order.
 * Each class owns its option lists: a subclass sees inherited options plus
 * its own, and an option may be written above or below its point.
 */
import { createExprNode, Context, ExprNode } from "../../jsx-runtime"
import { ModelStore } from "../index"
import { abstractM2M } from "./abstractM2M"
import { SpecPoint, SpecOption } from "./spec-decorators"
import { Process, Sequence, Task, Parallel } from "../test/bpm-metamodel"
import * as b from "../test/bpm-metamodel/BPM.meta.model.type"

class Parent extends abstractM2M<b.IProcess, b.IProcess> {
  main(m: b.IProcess): ExprNode<b.IProcess> {
    return <Process name="unused" store={this.context.store} />
  }

  @SpecPoint()
  p(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("p", b.Task)
  pTask(t: b.ITask): string {
    return "parent-task"
  }
}

// Adds an option for the inherited point only.
class ChildA extends Parent {
  @SpecOption("p", b.Parallel)
  pParallel(x: b.IParallel): string {
    return "childA-parallel"
  }
}

// Declares a point of its own, then adds an option for the inherited one.
class ChildB extends Parent {
  @SpecPoint()
  q(a: b.INode): string {
    return undefined! // pure dispatcher
  }

  @SpecOption("p", b.Sequence)
  pSequence(x: b.ISequence): string {
    return "childB-sequence"
  }
}

// Overrides the parent's option for Task.
class ChildC extends Parent {
  @SpecOption("p", b.Task)
  pTaskC(t: b.ITask): string {
    return "childC-task"
  }
}

describe("@SpecOption registration across a class hierarchy", () => {
  const store = new ModelStore()
  const model = (
    <Process name="P" store={store}>
      <Sequence name="s1">
        <Task name="t1" activity="a" />
        <Parallel name="p1" />
      </Sequence>
    </Process>
  ).render(new Context()) as b.IProcess
  const elements = (model.elements ?? []) as unknown as b.INode[]
  const task = elements.find((e) => e.name === "t1")!
  const parallel = elements.find((e) => e.name === "p1")!

  const optionsOf = (cls: Function, point: string): string[] =>
    ((cls.prototype as any)["__SpecPoint"][point] ?? []).map((o: any) => o.specMethod)

  it("a subclass option does not appear in the parent's option list", () => {
    expect(optionsOf(Parent, "p")).toEqual(["pTask"])
  })

  it("sibling subclasses do not see each other's options", () => {
    expect(optionsOf(ChildA, "p")).toEqual(["pTask", "pParallel"])
    expect(optionsOf(ChildB, "p")).toEqual(["pTask", "pSequence"])
  })

  it("a parent instance does not dispatch to a subclass option", () => {
    expect(() => new Parent(store).p(parallel)).toThrow("No specialized method found")
  })

  it("subclass instances dispatch to their own and inherited options", () => {
    expect(new ChildA(store).p(parallel)).toBe("childA-parallel")
    expect(new ChildA(store).p(task)).toBe("parent-task")
  })

  it("an option written above the class's only point is registered", () => {
    const define = () => {
      class OptionFirst extends abstractM2M<b.IProcess, b.IProcess> {
        main(m: b.IProcess): ExprNode<b.IProcess> {
          return <Process name="unused" store={this.context.store} />
        }

        @SpecOption("r", b.Task)
        rTask(t: b.ITask): string {
          return "task"
        }

        @SpecPoint()
        r(a: b.INode): string {
          return undefined! // pure dispatcher
        }
      }
      return OptionFirst
    }
    expect(define).not.toThrow()
    expect(new (define())(store).r(task)).toBe("task")
  })

  it("an option written above its point, after another point, is registered", () => {
    class OptionAfterOtherPoint extends abstractM2M<b.IProcess, b.IProcess> {
      main(m: b.IProcess): ExprNode<b.IProcess> {
        return <Process name="unused" store={this.context.store} />
      }

      @SpecPoint()
      other(a: b.INode): string {
        return undefined! // pure dispatcher
      }

      @SpecOption("r", b.Task)
      rTask(t: b.ITask): string {
        return "task"
      }

      @SpecPoint()
      r(a: b.INode): string {
        return undefined! // pure dispatcher
      }
    }
    expect(new OptionAfterOtherPoint(store).r(task)).toBe("task")
  })

  it("a subclass option for a type the parent covers overrides it for subclass instances", () => {
    expect(optionsOf(ChildC, "p")).toEqual(["pTaskC"])
    expect(new ChildC(store).p(task)).toBe("childC-task")
    expect(new Parent(store).p(task)).toBe("parent-task")
  })

  it("a subclass still cannot declare two options for the same type", () => {
    expect(() => {
      class DoubleOverride extends Parent {
        @SpecOption("p", b.Task)
        first(t: b.ITask): string {
          return "first"
        }

        @SpecOption("p", b.Task)
        second(t: b.ITask): string {
          return "second"
        }
      }
      return DoubleOverride
    }).toThrow(/@SpecOption 'second': @SpecPoint 'p' already has option 'first' for type 'Task'/)
  })

  it("a subclass that redeclares an inherited point keeps its options", () => {
    class Redeclare extends Parent {
      @SpecPoint()
      p(a: b.INode): string {
        return undefined! // pure dispatcher
      }

      @SpecOption("p", b.Parallel)
      pParallel(x: b.IParallel): string {
        return "redeclare-parallel"
      }
    }
    expect(optionsOf(Redeclare, "p")).toEqual(["pTask", "pParallel"])
    expect(new Redeclare(store).p(task)).toBe("parent-task")
    expect(new Redeclare(store).p(parallel)).toBe("redeclare-parallel")
    expect(optionsOf(Parent, "p")).toEqual(["pTask"])
  })
})
