/** @jsx createExprNode */
/*
 * Tracing of an @E2E @SpecPoint rule whose base skeleton itself consults a
 * @VarPoint.
 *
 * The rule's invocation is "absorbed" by the option the point dispatches
 * to (its function becomes the executed option method). An option that
 * the base skeleton happens to call first must not take that place: it is
 * an ordinary sub-call of the rule, and the rule is still named after the
 * @SpecOption that was dispatched to.
 */
import {createExprNode, Context, ExprNode} from "../../jsx-runtime"
import {ModelStore, E2E, SpecPoint, SpecOption} from "../../engine"
import {Process, Sequence, Task} from "../../engine/test/bpm-metamodel"
import * as b from "../../engine/test/bpm-metamodel/BPM.meta.model.type"
import {VarPoint, VarOption, Default} from "./var-decorators"
import {Option} from "./eval-operators"
import {DecisionAwareM2M} from "../decisions/decision-aware-m2m/decision-aware-m2m"
import {
    DecisionModel,
    ElementLevelIssue,
    Option as OptionDecl,
} from "../decisions/1.decision-model/decision-meta.model-components"
import * as dmT from "../decisions/1.decision-model/decision-meta.model"
import {BindingModel} from "../decisions/2.binding-model/binding-meta.model-components"
import * as bmT from "../decisions/2.binding-model/binding-meta.model"
import {
    ConfigurationModel,
    ElementLevelChoice,
} from "../decisions/3.configuration-model/configuration-meta.model-components"
import * as cmT from "../decisions/3.configuration-model/configuration-meta.model"

class SpecTx extends DecisionAwareM2M<b.IProcess, b.IProcess, {}, cmT.IConfigurationModel> {
    constructor(store: ModelStore, configModel?: cmT.IConfigurationModel) {
        super(store, {}, configModel)
    }

    main(m: b.IProcess) {
        const tasks = ((m.elements ?? []) as b.INode[]).filter((e) =>
            this.context.store.isTypeOf(e, b.Task),
        ) as b.ITask[]
        return (
            <Process name="Proc2" store={this.context.store}>
                <Sequence name="seq2">
                    {tasks.map((t) => this.taskRule(t))}
                </Sequence>
            </Process>
        )
    }

    // The base skeleton consults the TaskMark point before the SpecOption runs.
    @E2E()
    @SpecPoint()
    taskRule(a: b.INode): ExprNode<b.ITask> {
        return <Task name={`${a.name}${this.markOf(a as b.ITask)}`} activity="base"/>
    }

    @SpecOption("taskRule", b.Task)
    taskRuleTask(t: b.ITask): ExprNode<b.ITask> {
        return <Task activity="opt"/>
    }

    @VarPoint("TaskMark")
    markOf(t: b.ITask): string {
        throw new Error("Not implemented VarOptions for VarPoint TaskMark")
    }

    @VarOption("markOf", Option("Marked"))
    markedOf(t: b.ITask): string {
        return "M"
    }

    @Default()
    @VarOption("markOf", Option("Unmarked"))
    unmarkedOf(t: b.ITask): string {
        return ""
    }
}

// The only option is declared for the supertype Node; a Task reaches it.
class SuperOptionTx extends DecisionAwareM2M<b.IProcess, b.IProcess, {}, cmT.IConfigurationModel> {
    constructor(store: ModelStore) {
        super(store, {})
    }

    main(m: b.IProcess) {
        const tasks = ((m.elements ?? []) as b.INode[]).filter((e) =>
            this.context.store.isTypeOf(e, b.Task),
        )
        return (
            <Process name="Proc2" store={this.context.store}>
                <Sequence name="seq2">
                    {tasks.map((t) => this.nodeRule(t))}
                </Sequence>
            </Process>
        )
    }

    @E2E()
    @SpecPoint()
    nodeRule(a: b.INode): ExprNode<b.ITask> {
        return <Task name={`${a.name}_out`} activity="base"/>
    }

    @SpecOption("nodeRule", b.Node)
    nodeRuleNode(n: b.INode): ExprNode<b.ITask> {
        return <Task activity="opt"/>
    }
}

describe("tracing an @E2E @SpecPoint dispatching to an option declared for a supertype", () => {
    const store = new ModelStore()
    const proc = (
        <Process name="P" store={store}>
            <Sequence name="s1">
                <Task name="t1" activity="a"/>
            </Sequence>
        </Process>
    ).render(new Context()) as b.IProcess

    const tx = new SuperOptionTx(store)
    tx.transform(proc)
    const trace = tx.context.traceModel as ExprNode<any>
    const children = (trace.childArray as any[])
        .flat()
        .filter((c) => c instanceof ExprNode) as ExprNode<any>[]

    it("records one rule invocation named after the supertype option", () => {
        const rules = children.filter((c) => c.type.name === "RuleInvocation")
        expect(rules.length).toBe(1)
        expect((rules[0].props as any).function).toBe("nodeRuleNode")
    })
})

describe("tracing an @E2E @SpecPoint whose base skeleton consults a @VarPoint", () => {
    const store = new ModelStore()

    const proc = (
        <Process name="P" store={store}>
            <Sequence name="s1">
                <Task name="t1" activity="a"/>
                <Task name="t2" activity="a"/>
            </Sequence>
        </Process>
    ).render(new Context()) as b.IProcess

    const elements = (proc.elements ?? []) as unknown as b.INode[]
    const t1 = elements.find((e) => e.name === "t1") as b.ITask

    const dm = (
        <DecisionModel name="SpecDesign" description="test design space" store={store}>
            <ElementLevelIssue name="TaskMark" description="whether a task is marked">
                <OptionDecl name="Marked" description="marked" isDefault={false}/>
                <OptionDecl name="Unmarked" description="unmarked" isDefault={true}/>
            </ElementLevelIssue>
        </DecisionModel>
    ).render(new Context()) as dmT.IDecisionModel

    const markIssue = (dm.issues as dmT.IIssue[]).find((i) => i.name === "TaskMark")!
    const marked = (markIssue.options as dmT.IOption[]).find((o) => o.name === "Marked")!

    const bm = (
        <BindingModel name="SpecBindings" description="bindings" sourceModel={proc}
                      decisionModel={dm} store={store}/>
    ).render(new Context()) as bmT.IBindingModel

    const cfg = (
        <ConfigurationModel name="SpecCfg" description="the run's choices"
                            sourceModel={proc} bindingModel={bm} store={store}>
            <ElementLevelChoice name="ec_t1" description="for t1" element={t1}
                                selectedOption={marked}/>
        </ConfigurationModel>
    ).render(new Context()) as cmT.IConfigurationModel

    const tx = new SpecTx(store, cfg)
    const out = tx.transform(proc)

    const trace = tx.context.traceModel as ExprNode<any>
    const flatten = (node: ExprNode<any>): ExprNode<any>[] => {
        const found: ExprNode<any>[] = []
        for (const child of node.childArray as any[]) {
            if (Array.isArray(child)) {
                for (const c of child) {
                    if (c instanceof ExprNode) found.push(c)
                }
            } else if (child instanceof ExprNode) {
                found.push(child)
            }
        }
        return found
    }
    const children = flatten(trace)
    const invocationByName = (name: string) =>
        children.find((c) => (c.props as any).name === name)
    const propsOf = (name: string) => invocationByName(name)!.props as any
    const resolutionsOf = (name: string) =>
        flatten(invocationByName(name)!).filter((c) => c.type.name === "Resolution").map((r) => r.props as any)

    it("runs the base skeleton, its consultation, and the dispatched option", () => {
        // base name carries the mark (Marked for t1, default Unmarked for t2),
        // the option supplies the activity
        const tasks = ((out.elements ?? []) as unknown as b.INode[]).filter((e) =>
            store.isTypeOf(e, b.Task))
        expect(tasks.map((e) => e.name).sort()).toEqual(["t1M", "t2"])
    })

    it("records one rule invocation per element, named after the dispatched SpecOption", () => {
        const rules = children.filter((c) => c.type.name === "RuleInvocation")
        expect(rules.map((e) => (e.props as any).name)).toEqual(["taskRuleTask_t1", "taskRuleTask_t2"])
        expect(propsOf("taskRuleTask_t1").function).toBe("taskRuleTask")
    })

    it("records the option the skeleton consulted as an ordinary sub-call of the rule", () => {
        const plain = children.filter((c) => c.type.name === "Invocation")
        expect(plain.map((e) => (e.props as any).name)).toEqual(["markedOf_t1", "unmarkedOf_t2"])
        expect(propsOf("markedOf_t1").parent.props.$refByName).toBe("taskRuleTask_t1")
        expect(propsOf("unmarkedOf_t2").parent.props.$refByName).toBe("taskRuleTask_t2")
    })

    it("keeps the consultation's resolution on its own invocation", () => {
        const explicit = resolutionsOf("markedOf_t1")
        expect(explicit.length).toBe(1)
        expect(explicit[0].byDefault).toBe(false)

        const fallback = resolutionsOf("unmarkedOf_t2")
        expect(fallback.length).toBe(1)
        expect(fallback[0].byDefault).toBe(true)
    })
})
