/** @jsx createExprNode */
/*
 * Outcome-shaped tracing and per-element decision resolution.
 *
 * The scenario: a Process with two tasks and three issues. TaskStyle
 * (per element, stacked @E2E @VarPoint rule), TaskMark (per element,
 * consulted through a nested helper VarPoint), Naming (global,
 * consulted from main() outside any rule). The configuration
 * chooses Fancy for t1 only, Marked for t2 only, Upper globally.
 *
 * Correct per-element resolution: a decision recorded for one element
 * must never leak to another. t1 renders fancy and unmarked, t2
 * renders plain (its default) and marked.
 */
import {createExprNode, Context, ExprNode} from "../../jsx-runtime"
import {ModelStore, E2E} from "../../engine"
import {Process, Sequence, Task} from "../../engine/test/bpm-metamodel"
import * as b from "../../engine/test/bpm-metamodel/BPM.meta.model.type"
import {VarPoint, VarOption, Default} from "./var-decorators"
import {Option} from "./eval-operators"
import {DecisionAwareM2M} from "../decisions/decision-aware-m2m/decision-aware-m2m"
import {
    DecisionModel,
    ElementLevelIssue,
    ModelLevelIssue,
    Option as OptionDecl,
} from "../decisions/1.decision-model/decision-meta.model-components"
import * as dmT from "../decisions/1.decision-model/decision-meta.model"
import {BindingModel} from "../decisions/2.binding-model/binding-meta.model-components"
import * as bmT from "../decisions/2.binding-model/binding-meta.model"
import {
    ConfigurationModel,
    ElementLevelChoice,
    ModelLevelChoice,
    Choice,
} from "../decisions/3.configuration-model/configuration-meta.model-components"
import * as cmT from "../decisions/3.configuration-model/configuration-meta.model"

class Tx extends DecisionAwareM2M<b.IProcess, b.IProcess, {}, cmT.IConfigurationModel> {
    constructor(store: ModelStore, configModel?: cmT.IConfigurationModel) {
        super(store, {}, configModel)
    }

    main(m: b.IProcess) {
        const tasks = ((m.elements ?? []) as b.INode[]).filter((e) =>
            this.context.store.isTypeOf(e, b.Task),
        ) as b.ITask[]
        return (
            <Process name={this.decorateName("Proc2")} store={this.context.store}>
                <Sequence name="seq2">
                    {tasks.map((t) => this.taskRule(t))}
                </Sequence>
            </Process>
        )
    }

    @E2E()
    @VarPoint("TaskStyle")
    taskRule(t: b.ITask): ExprNode<b.ITask> {
        throw new Error("Not implemented VarOptions for VarPoint TaskStyle")
    }

    @VarOption("taskRule", Option("Fancy"))
    fancyTask(t: b.ITask): ExprNode<b.ITask> {
        return <Task name={`${t.name}_f${this.markOf(t)}`} activity="fancy"/>
    }

    @Default()
    @VarOption("taskRule", Option("Plain"))
    plainTask(t: b.ITask): ExprNode<b.ITask> {
        return <Task name={`${t.name}_p${this.markOf(t)}`} activity="plain"/>
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

    @VarPoint("Naming")
    decorateName(n: string): string {
        throw new Error("Not implemented VarOptions for VarPoint Naming")
    }

    @VarOption("decorateName", Option("Upper"))
    upperName(n: string): string {
        return n.toUpperCase()
    }

    @Default()
    @VarOption("decorateName", Option("Lower"))
    lowerName(n: string): string {
        return n.toLowerCase()
    }
}

describe("per-element decision resolution and the outcome trace", () => {
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
    const t2 = elements.find((e) => e.name === "t2") as b.ITask

    const dm = (
        <DecisionModel name="TestDesign" description="test design space" store={store}>
            <ElementLevelIssue name="TaskStyle" description="how a task renders">
                <OptionDecl name="Fancy" description="fancy" isDefault={false}/>
                <OptionDecl name="Plain" description="plain" isDefault={true}/>
            </ElementLevelIssue>
            <ElementLevelIssue name="TaskMark" description="whether a task is marked">
                <OptionDecl name="Marked" description="marked" isDefault={false}/>
                <OptionDecl name="Unmarked" description="unmarked" isDefault={true}/>
            </ElementLevelIssue>
            <ModelLevelIssue name="Naming" description="how names are written">
                <OptionDecl name="Upper" description="upper case" isDefault={false}/>
                <OptionDecl name="Lower" description="lower case" isDefault={true}/>
            </ModelLevelIssue>
        </DecisionModel>
    ).render(new Context()) as dmT.IDecisionModel

    const issueByName = (name: string): dmT.IIssue =>
        (dm.issues as dmT.IIssue[]).find((i) => i.name === name)!
    const optionOf = (issue: dmT.IIssue, name: string): dmT.IOption =>
        (issue.options as dmT.IOption[]).find((o) => o.name === name)!

    const styleIssue = issueByName("TaskStyle")
    const markIssue = issueByName("TaskMark")
    const namingIssue = issueByName("Naming")

    const bm = (
        <BindingModel name="TestBindings" description="bindings" sourceModel={proc}
                      decisionModel={dm} store={store}/>
    ).render(new Context()) as bmT.IBindingModel

    const cfg = (
        <ConfigurationModel name="TestCfg" description="the run's choices"
                            sourceModel={proc} bindingModel={bm} store={store}>
            <ElementLevelChoice name="ec_t1" description="for t1" element={t1}
                                selectedOption={optionOf(styleIssue, "Fancy")}/>
            <ElementLevelChoice name="ec_t2" description="for t2" element={t2}
                                selectedOption={optionOf(markIssue, "Marked")}/>
            <ModelLevelChoice name="gc_naming" description="upper everywhere"
                              selectedOption={optionOf(namingIssue, "Upper")}/>
        </ConfigurationModel>
    ).render(new Context()) as cmT.IConfigurationModel

    const tx = new Tx(store, cfg)
    const out = tx.transform(proc)
    const outNames = ((out.elements ?? []) as b.INode[]).map((e) => e.name)

    it("applies a per-element decision only to its own element", () => {
        // t1: Fancy was chosen for t1; TaskMark was NOT chosen for t1, so
        // its default (Unmarked) applies.
        expect(outNames).toContain("t1_f")
        // t2: TaskStyle was NOT chosen for t2, so its default (Plain)
        // applies; Marked was chosen for t2.
        expect(outNames).toContain("t2_pM")
    })

    it("applies a global decision everywhere", () => {
        expect(out.name).toBe("PROC2")
    })

    // The outcome-shaped trace: walk the trace model's JSX expression.
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
    const ruleInvocations = children.filter((c) => c.type.name === "RuleInvocation")
    const plainInvocations = children.filter((c) => c.type.name === "Invocation")
    const invocationByName = (name: string) =>
        children.find((c) => (c.props as any).name === name)
    const resolutionsOf = (invocation: ExprNode<any>) =>
        flatten(invocation).filter((c) => c.type.name === "Resolution").map((r) => r.props as any)
    const choiceNames = (r: any) =>
        ((r.choices ?? []) as ExprNode<any>[]).map((c) => (c.props as any).$refByName.split("/").pop())
    const parentOf = (name: string) => (invocationByName(name)!.props as any).parent?.props.$refByName

    it("records one RuleInvocation per executed @E2E rule, named for its function and source", () => {
        expect(ruleInvocations.map((e) => (e.props as any).name)).toEqual(["fancyTask_t1", "plainTask_t2"])
    })

    it("names the rule's function after the executed option method, not the point", () => {
        expect((invocationByName("fancyTask_t1")!.props as any).function).toBe("fancyTask")
        expect((invocationByName("plainTask_t2")!.props as any).function).toBe("plainTask")
    })

    it("records targets as full-path references to the actual created elements", () => {
        const targets = (invocationByName("fancyTask_t1")!.props as any).targets as ExprNode<any>[]
        expect(targets.length).toBe(1)
        expect((targets[0].props as any).$refByName).toMatch(/^\/\/.*PROC2\/t1_f$/)
    })

    it("records option methods executed outside a rule as plain Invocations, linked to their caller", () => {
        expect(plainInvocations.map((e) => (e.props as any).name)).toEqual([
            "upperName",
            "unmarkedOf_t1",
            "markedOf_t2",
        ])
        // called from main(), outside any rule: no parent
        expect(parentOf("upperName")).toBeUndefined()
        // called inside the rule's executed option method: the rule is the parent
        expect(parentOf("unmarkedOf_t1")).toBe("fancyTask_t1")
        expect(parentOf("markedOf_t2")).toBe("plainTask_t2")
        // rules are top-level here
        expect(parentOf("fancyTask_t1")).toBeUndefined()
    })

    it("attaches the point's resolution to the invocation that executed the option", () => {
        // explicit choice: not by default, the issue's choice for t1 is recorded
        const style = resolutionsOf(invocationByName("fancyTask_t1")!)
        expect(style.length).toBe(1)
        expect(style[0].byDefault).toBe(false)
        expect(choiceNames(style[0])).toEqual(["ec_t1"])

        // no TaskMark choice for t1: the @Default option ran
        const mark = resolutionsOf(invocationByName("unmarkedOf_t1")!)
        expect(mark.length).toBe(1)
        expect(mark[0].byDefault).toBe(true)
        expect(choiceNames(mark[0])).toEqual([])

        // no TaskStyle choice for t2: the @Default option ran
        const style2 = resolutionsOf(invocationByName("plainTask_t2")!)
        expect(style2.length).toBe(1)
        expect(style2[0].byDefault).toBe(true)

        const mark2 = resolutionsOf(invocationByName("markedOf_t2")!)
        expect(mark2[0].byDefault).toBe(false)
        expect(choiceNames(mark2[0])).toEqual(["ec_t2"])
    })

    it("records a global resolution once, on the invocation of the option executed from main()", () => {
        const naming = resolutionsOf(invocationByName("upperName")!)
        expect(naming.length).toBe(1)
        expect(naming[0].byDefault).toBe(false)
        expect(choiceNames(naming[0])).toEqual(["gc_naming"])
    })

    it("references the configuration and the transformation on the trace model", () => {
        const props = trace.props as any
        expect(props.transformation).toBe("Tx")
        expect(props.config).toBeDefined()
        expect((props.config.props as any).$refByName).toMatch(/TestCfg$/)
    })

    it("rejects an @E2E rule called with something that is not a ModelElement", () => {
        const fresh = new Tx(store, cfg)
        expect(() => fresh.taskRule("not an element" as any)).toThrow(
            /@E2E "taskRule": the first argument must be a ModelElement, got string/,
        )
        expect(() => fresh.taskRule(undefined as any)).toThrow(/must be a ModelElement/)
    })
})
