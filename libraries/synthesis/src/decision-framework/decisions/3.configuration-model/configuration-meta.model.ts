import * as t from "@aelastics/types"
import {Model, ModelElement} from "../../../metamodel-core"
import * as gdm from "../1.decision-model/decision-meta.model"
import {BindingModel} from "../2.binding-model/binding-meta.model"

export const ConfigurationModel_TypeSchema = t.schema("ConfigurationModel_TypeSchema")

export const Choice = t.subtype(
    ModelElement,
    {
        assumptions: t.optional(t.string),
        justification: t.optional(t.string),
        consequences: t.optional(t.string),
        selectedOption: gdm.Option,

    },
    "Choice",
    ConfigurationModel_TypeSchema,
)

export const ElementLevelChoice = t.subtype(
    Choice,
    {
        element: ModelElement,

    },
    "ElementLevelChoice",
    ConfigurationModel_TypeSchema,
)

export const ModelLevelChoice = t.subtype(
    Choice,
    {},
    "ModelLevelChoice",
    ConfigurationModel_TypeSchema,
)

export const ConfigurationModel = t.subtype(
    Model,
    {
        choices: t.arrayOf(Choice),
        sourceModel: Model,
        bindingModel: BindingModel,
    },
    "ConfigurationModel",
    ConfigurationModel_TypeSchema,
)

// All issues of a decision model: the top-level ones plus the sub-issues
// opened by OpeningOptions, transitively.
const collectIssues = (issues: readonly gdm.IIssue[], out: Set<gdm.IIssue> = new Set()): Set<gdm.IIssue> => {
    for (const issue of issues) {
        if (out.has(issue)) continue
        out.add(issue)
        for (const option of issue.options) {
            collectIssues((option as gdm.IOpeningOption).subIssues ?? [], out)
        }
    }
    return out
}

ConfigurationModel.addValidator({
    predicate: (v: IConfigurationModel) => {
        const issues = collectIssues(v.bindingModel.decisionModel.issues)
        return v.choices.every((c) => issues.has(c.selectedOption.parentIssue))
    },
    message: (_v: IConfigurationModel, label?: string) =>
        `${label ?? "ConfigurationModel"}: a choice selects an option whose issue is not in the binding model's decision model`,
})

// The concrete type of an instance, from its '@@aelastics/type' tag
// ("<schema>/<TypeName>"); validators receive the bare instance, not a store.
const hasType = (el: unknown, type: t.Any): boolean => {
    const tag = (el as { "@@aelastics/type"?: string })["@@aelastics/type"]
    return typeof tag === "string" && tag.split("/").pop() === type.name
}

ConfigurationModel.addValidator({
    predicate: (v: IConfigurationModel) => {
        const seen = new Map<unknown, Set<unknown>>()
        for (const c of (v as IConfigurationModel).choices) {
            if (!hasType(c, ElementLevelChoice)) continue
            const ec = c as IElementLevelChoice
            const issues = seen.get(ec.element) ?? new Set<unknown>()
            if (issues.has(ec.selectedOption.parentIssue)) return false
            issues.add(ec.selectedOption.parentIssue)
            seen.set(ec.element, issues)
        }
        return true
    },
    message: (_v: IConfigurationModel, label?: string) =>
        `${label ?? "ConfigurationModel"}: more than one element-level choice for the same element and issue`,
})

ConfigurationModel.addValidator({
    predicate: (v: IConfigurationModel) => {
        const seen = new Set<unknown>()
        for (const c of (v as IConfigurationModel).choices) {
            if (!hasType(c, ModelLevelChoice)) continue
            const issue = (c as IModelLevelChoice).selectedOption.parentIssue
            if (seen.has(issue)) return false
            seen.add(issue)
        }
        return true
    },
    message: (_v: IConfigurationModel, label?: string) =>
        `${label ?? "ConfigurationModel"}: more than one model-level choice for the same issue`,
})

ElementLevelChoice.addValidator({
    predicate: (v: IElementLevelChoice) =>
        hasType(v.selectedOption.parentIssue, gdm.ElementLevelIssue),
    message: (_v: IElementLevelChoice, label?: string) =>
        `${label ?? "ElementLevelChoice"}: selected option does not belong to an element-level issue`,
})

ModelLevelChoice.addValidator({
    predicate: (v: IModelLevelChoice) =>
        hasType(v.selectedOption.parentIssue, gdm.ModelLevelIssue),
    message: (_v: IModelLevelChoice, label?: string) =>
        `${label ?? "ModelLevelChoice"}: selected option does not belong to a model-level issue`,
})

export type IConfigurationModel = t.TypeOf<typeof ConfigurationModel>;
export type IChoice = t.TypeOf<typeof Choice>;
export type IElementLevelChoice = t.TypeOf<typeof ElementLevelChoice>;
export type IModelLevelChoice = t.TypeOf<typeof ModelLevelChoice>;