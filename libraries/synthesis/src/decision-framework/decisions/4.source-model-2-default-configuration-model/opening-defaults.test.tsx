/** @jsx createExprNode */
/*
 * Default-configuration generation over composite options: when the
 * chosen (default) option of an issue is a CompositeOption, the
 * generator also answers the sub-issues that option opens, recursively
 * and in the same decision context (the element's decision, or a
 * global choice). Sub-issues behind options the defaults do NOT choose
 * are omitted: the generated configuration answers exactly the path
 * the defaults take.
 */
import {createExprNode, Context} from "../../../jsx-runtime"
import {ModelStore} from "../../../engine"
import {Process, Sequence, Task} from "../../../engine/test/bpm-metamodel"
import * as b from "../../../engine/test/bpm-metamodel/BPM.meta.model.type"
import {
    DecisionModel,
    ElementIssue,
    ModelIssue,
    ElementSubIssue,
    ModelSubIssue,
    Option,
    OpeningOption,
} from "../1.decision-model/decision-meta.model-components"
import * as dmT from "../1.decision-model/decision-meta.model"
import {BindingModel, Binding} from "../2.binding-model/binding-meta.model-components"
import * as bmT from "../2.binding-model/binding-meta.model"
import * as cmT from "../3.configuration-model/configuration-meta.model"
import {SourceModelToDefaultConfigurationModel} from "./SourceModel2DefaultConfigurationModel"

describe("default configurations traverse chosen composite options", () => {
    const store = new ModelStore()

    const proc = (
        <Process name="P" store={store}>
            <Sequence name="s1">
                <Task name="t1" activity="a"/>
                <Task name="t2" activity="a"/>
            </Sequence>
        </Process>
    ).render(new Context()) as b.IProcess

    // The binding matches source elements by type name; any element
    // named like the type serves as the metamodel stand-in (production
    // uses the metamodel-as-model concepts the same way).
    const meta = (
        <Process name="Meta" store={store}>
            <Sequence name="ms">
                <Task name="Task" activity="a"/>
            </Sequence>
        </Process>
    ).render(new Context()) as b.IProcess
    const taskConcept = ((meta.elements ?? []) as b.INode[]).find((e) => e.name === "Task")!

    // Retention's default KeepHistory is composite and opens HistoryKind,
    // whose default Timestamped is composite again (recursion), while the
    // unchosen NoRetention hides PurgeSchedule entirely.
    const dm = (
        <DecisionModel name="CompositeDesign" description="composite defaults" store={store}>
            <ElementIssue name="Retention" description="whether history is kept">
                <OpeningOption name="NoRetention" description="none" isDefault={false}>
                    <ElementSubIssue name="PurgeSchedule" description="behind the unchosen option">
                        <Option name="Daily" description="daily" isDefault={true}/>
                    </ElementSubIssue>
                </OpeningOption>
                <OpeningOption name="KeepHistory" description="kept" isDefault={true}>
                    <ElementSubIssue name="HistoryKind" description="what marks a version">
                        <Option name="Counted" description="a counter" isDefault={false}/>
                        <OpeningOption name="Timestamped" description="a timestamp" isDefault={true}>
                            <ElementSubIssue name="TimestampPrecision" description="how precise">
                                <Option name="Seconds" description="seconds" isDefault={true}/>
                                <Option name="Millis" description="milliseconds" isDefault={false}/>
                            </ElementSubIssue>
                        </OpeningOption>
                    </ElementSubIssue>
                </OpeningOption>
            </ElementIssue>
            <ElementIssue name="Style" description="a flat control issue">
                <Option name="Plain" description="plain" isDefault={true}/>
                <Option name="Fancy" description="fancy" isDefault={false}/>
            </ElementIssue>
            <ModelIssue name="GlobalMode" description="a global composite">
                <Option name="Unmanaged" description="unmanaged" isDefault={false}/>
                <OpeningOption name="Managed" description="managed" isDefault={true}>
                    <ModelSubIssue name="ManagedDetail" description="opened by Managed">
                        <Option name="DetailA" description="A" isDefault={true}/>
                        <Option name="DetailB" description="B" isDefault={false}/>
                    </ModelSubIssue>
                </OpeningOption>
            </ModelIssue>
        </DecisionModel>
    ).render(new Context()) as dmT.IDecisionModel

    const retention = (dm.issues as dmT.IIssue[]).find((i) => i.name === "Retention")!
    const style = (dm.issues as dmT.IIssue[]).find((i) => i.name === "Style")!

    const bm = (
        <BindingModel name="CompositeBindings" description="bindings" sourceModel={proc}
                      decisionModel={dm} store={store}>
            <Binding name="taskBinding" description="tasks decide retention and style"
                     element={taskConcept} issues={[retention, style]}/>
        </BindingModel>
    ).render(new Context()) as bmT.IBindingModel

    const generator = new SourceModelToDefaultConfigurationModel(store, {bindingModel: bm})
    const cfg = generator.transform(proc) as cmT.IConfigurationModel

    const choices = (cfg.choices ?? []) as cmT.IChoice[]
    const optionNamesFor = (prefix: string): string[] =>
        choices
            .filter((c) => String(c.name).startsWith(prefix))
            .map((c) => String((c.selectedOption as dmT.IOption).name))

    it("answers an element issue and, transitively, the sub-issues its default opens", () => {
        expect(optionNamesFor("ec_t1_")).toEqual(["KeepHistory", "Timestamped", "Seconds", "Plain"])
    })

    it("generates the same expansion per bound element", () => {
        expect(optionNamesFor("ec_t2_")).toEqual(["KeepHistory", "Timestamped", "Seconds", "Plain"])
    })

    it("answers a global issue's sub-issues as global choices", () => {
        const globalNames = choices
            .filter((c) => String(c.name).startsWith("gc_"))
            .map((c) => [String(c.name), [String((c.selectedOption as dmT.IOption).name)]])
        expect(globalNames).toEqual([
            ["gc_GlobalMode", ["Managed"]],
            ["gc_ManagedDetail", ["DetailA"]],
        ])
    })

    it("stays quiet about sub-issues behind unchosen options", () => {
        const allOptions = choices.map((c) => String((c.selectedOption as dmT.IOption).name))
        expect(allOptions).not.toContain("Daily")
        const allChoiceNames = choices.map((c) => String(c.name))
        expect(allChoiceNames).not.toContain("gc_PurgeSchedule")
    })
})
