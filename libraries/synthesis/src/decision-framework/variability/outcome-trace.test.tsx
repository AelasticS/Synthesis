/** @jsx createExprNode */
/*
 * Outcome-shaped tracing and per-element decision resolution.
 *
 * The scenario: a Process with two tasks and three issues. TaskStyle
 * (per element, stacked @E2E @VarPoint rule), TaskMark (per element,
 * consulted through a nested helper VarPoint), Naming (global,
 * consulted from template() outside any rule). The configuration
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
    ElementIssue,
    ModelIssue,
    Option as OptionDecl,
} from "../decisions/1.decision-model/decision-meta.model-components"
import * as dmT from "../decisions/1.decision-model/decision-meta.model"
import {BindingModel} from "../decisions/2.binding-model/binding-meta.model-components"
import * as bmT from "../decisions/2.binding-model/binding-meta.model"
import {
    ConfigurationModel,
    ElementChoice,
    GlobalChoice,
    Choice,
} from "../decisions/3.configuration-model/configuration-meta.model-components"
import * as cmT from "../decisions/3.configuration-model/configuration-meta.model"

class Tx extends DecisionAwareM2M<b.IProcess, b.IProcess, {}, cmT.IConfigurationModel> {
    constructor(store: ModelStore, configModel?: cmT.IConfigurationModel) {
        super(store, {}, configModel)
    }

    template(m: b.IProcess) {
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
            <ElementIssue name="TaskStyle" description="how a task renders">
                <OptionDecl name="Fancy" description="fancy" isDefault={false}/>
                <OptionDecl name="Plain" description="plain" isDefault={true}/>
            </ElementIssue>
            <ElementIssue name="TaskMark" description="whether a task is marked">
                <OptionDecl name="Marked" description="marked" isDefault={false}/>
                <OptionDecl name="Unmarked" description="unmarked" isDefault={true}/>
            </ElementIssue>
            <ModelIssue name="Naming" description="how names are written">
                <OptionDecl name="Upper" description="upper case" isDefault={false}/>
                <OptionDecl name="Lower" description="lower case" isDefault={true}/>
            </ModelIssue>
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
            <ElementChoice name="ec_t1" description="for t1" element={t1}
                           selectedOption={optionOf(styleIssue, "Fancy")}/>
            <ElementChoice name="ec_t2" description="for t2" element={t2}
                           selectedOption={optionOf(markIssue, "Marked")}/>
            <GlobalChoice name="gc_naming" description="upper everywhere"
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
    const entries = children.filter((c) => c.type.name === "DecisionTraceEntry")
    const modelResolutions = children.filter((c) => c.type.name === "Resolution")
    const entryByName = (name: string) => entries.find((e) => (e.props as any).name === name)
    const resolutionsOf = (entry: ExprNode<any>) =>
        flatten(entry).filter((c) => c.type.name === "Resolution")

    it("records one entry per executed rule, named for its rule and source", () => {
        const names = entries.map((e) => (e.props as any).name)
        expect(names).toContain("fancyTask_t1")
        expect(names).toContain("plainTask_t2")
    })

    it("names the entry's rule after the executed option method, not the point", () => {
        expect((entryByName("fancyTask_t1")!.props as any).rule).toBe("fancyTask")
        expect((entryByName("plainTask_t2")!.props as any).rule).toBe("plainTask")
    })

    it("records targets as full-path references to the actual created elements", () => {
        const targets = (entryByName("fancyTask_t1")!.props as any).targets as ExprNode<any>[]
        expect(targets.length).toBe(1)
        expect((targets[0].props as any).$refByName).toMatch(/^\/\/.*PROC2\/t1_f$/)
    })

    it("attaches resolutions to the entry of the element they decide, explicit and by default", () => {
        const t1Res = resolutionsOf(entryByName("fancyTask_t1")!).map((r) => r.props as any)
        // The stacked choice: explicit, with a choice reference, no element
        // reference (the entry's source is implied).
        const style = t1Res.find((r) => r.issue === "TaskStyle")!
        expect(style.option).toBe("Fancy")
        expect(style.byDefault).toBeUndefined()
        expect(style.choice).toBeDefined()
        expect(style.element).toBeUndefined()
        // The nested consultation: recorded on the same element's entry,
        // resolved by default (no choice for t1 on TaskMark).
        const mark = t1Res.find((r) => r.issue === "TaskMark")!
        expect(mark.option).toBe("Unmarked")
        expect(mark.byDefault).toBe(true)
        expect(mark.choice).toBeUndefined()

        const t2Res = resolutionsOf(entryByName("plainTask_t2")!).map((r) => r.props as any)
        const style2 = t2Res.find((r) => r.issue === "TaskStyle")!
        expect(style2.option).toBe("Plain")
        expect(style2.byDefault).toBe(true)
        const mark2 = t2Res.find((r) => r.issue === "TaskMark")!
        expect(mark2.option).toBe("Marked")
        expect(mark2.byDefault).toBeUndefined()
        expect(mark2.choice).toBeDefined()
    })

    it("records global resolutions once, at model level", () => {
        const naming = modelResolutions.map((r) => r.props as any).filter((r) => r.issue === "Naming")
        expect(naming.length).toBe(1)
        expect(naming[0].option).toBe("Upper")
        expect(naming[0].byDefault).toBeUndefined()
        expect(naming[0].element).toBeUndefined()
    })

    it("references the configuration and the transformation on the trace model", () => {
        const props = trace.props as any
        expect(props.transformation).toBe("Tx")
        expect(props.config).toBeDefined()
        expect((props.config.props as any).$refByName).toMatch(/TestCfg$/)
    })
})
