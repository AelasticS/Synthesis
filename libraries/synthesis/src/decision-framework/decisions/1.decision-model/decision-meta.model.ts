import * as t from "@aelastics/types"
import {Model, ModelElement} from "../../../metamodel-core"
import {Type} from "../../../metamodels/types/types-meta.model"


export const Decision_TypeSchema = t.schema("Decision_TypeSchema")

export const Issue = t.subtype(
    ModelElement,
    {
        options: t.arrayOf(t.link(Decision_TypeSchema, "Option")),
    },
    "Issue",
    Decision_TypeSchema,
)

export const ElementIssue = t.subtype(
    Issue,
    {},
    "ElementIssue",
    Decision_TypeSchema,
)

export const ModelIssue = t.subtype(
    Issue,
    {},
    "ModelIssue",
    Decision_TypeSchema,
)

export const DecisionModel = t.subtype(
    Model,
    {
        issues: t.arrayOf(Issue),
    },
    "DecisionModel",
    Decision_TypeSchema,
);

export const Option = t.subtype(
    ModelElement,
    {
        parentIssue: Issue,
        Pros: t.string,
        Cons: t.string,
        isDefault: t.optional(t.boolean), // if is not optional, default value is true  // TODO: set default value for boolean to false
        valueType: t.optional(Type),
    },
    "Option",
    Decision_TypeSchema,
)

t.inverseProps(Option, 'parentIssue', Issue, 'options');

export const OpeningOption = t.subtype(Option,
    {
        subIssues: t.arrayOf(Issue),
    },
    "OpeningOption",
    Decision_TypeSchema,
)

export const ConstraintType = t.string.derive("ConstraintType").oneOf(["Requires", "Exclude"])
export const Constraint = t.subtype(
    ModelElement,
    {
        type: ConstraintType,
        source: Option,
        target: Option,
    },
    "Constraint",
    Decision_TypeSchema,
)

export type IDecisionModel = t.TypeOf<typeof DecisionModel>;
export type IElementIssue = t.TypeOf<typeof ElementIssue>;
export type IModelIssue = t.TypeOf<typeof ModelIssue>;
export type IOption = t.TypeOf<typeof Option>;
export type IDependency = t.TypeOf<typeof Constraint>;
export type IConstraintType = t.TypeOf<typeof ConstraintType>;
export type IOpeningOption = t.TypeOf<typeof OpeningOption>;
export type IIssue = t.TypeOf<typeof Issue>;