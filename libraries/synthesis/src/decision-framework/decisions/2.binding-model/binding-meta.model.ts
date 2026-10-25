import * as t from "@aelastics/types";
import { Model, ModelElement } from "../../../metamodel-core";
import * as ddM from "../1.decision-model/decision-meta.model";

export const BindingModel_TypeSchema = t.schema("BindingModel_TypeSchema");

export const BindingElement = t.subtype(
    ModelElement,
    {
        element: ModelElement,
        issues: t.arrayOf(ddM.ElementLevelIssue),
        condition: t.optional(t.string),
    },
    "BindingElement",
    BindingModel_TypeSchema
);

export const BindingModel = t.subtype(
    Model,
    {
        sourceModel: Model,
        decisionModel: ddM.DecisionModel,
        bindings: t.arrayOf(BindingElement),
    },
    "BindingModel",
    BindingModel_TypeSchema
);

// All issues of a decision model: the top-level ones plus the sub-issues
// opened by OpeningOptions, transitively.
export const collectIssues = (issues: readonly ddM.IIssue[], out: Set<ddM.IIssue> = new Set()): Set<ddM.IIssue> => {
    for (const issue of issues) {
        if (out.has(issue)) continue
        out.add(issue)
        for (const option of issue.options) {
            collectIssues((option as ddM.IOpeningOption).subIssues ?? [], out)
        }
    }
    return out
}

BindingElement.addValidator({
    predicate: (v: IBindingElement) => {
        const bm = v.parentModel as IBindingModel | undefined
        if (!bm) return true // not attached to a binding model yet
        const allowed = collectIssues(bm.decisionModel.issues)
        return v.issues.every((i) => allowed.has(i))
    },
    message: (_v: unknown, label?: string) =>
        `${label ?? "BindingElement"}: references an issue that is not in the binding model's decision model`,
})

export type IBindingModel = t.TypeOf<typeof BindingModel>;
export type IBindingElement = t.TypeOf<typeof BindingElement>;