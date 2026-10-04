import * as t from "@aelastics/types"
import {Model, ModelElement} from "../../../metamodel-core"
import * as gdm from "../1.decision-model/decision-meta.model"
import {BindingModel} from "../2.binding-model/binding-meta.model"

export const ConfigurationModel_TypeSchema = t.schema("ConfigurationModel_TypeSchema")

// export const Option = t.subtype(
//     ModelElement,
//     {
//         //TODO: Type of defaultValue should be determined based on the option type
//         // defaultValue: t.optional(getOptionType(option)),
//         defaultValue: t.string, // defaultValue is a string for simplicity
//     },
//     "SimpleOption",
//     ConfigurationModel_TypeSchema)
//
// export const OpeningOption = t.subtype(
//     Option,
//     {
//         choices: t.arrayOf(t.link(ConfigurationModel_TypeSchema, "Choice")),
//     },
//     "CompositeOption",
// )

const getOptionType = (option: gdm.IOption): t.Any => {
    return t.string
}

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

export type IConfigurationModel = t.TypeOf<typeof ConfigurationModel>;
export type IChoice = t.TypeOf<typeof Choice>;
export type IElementLevelChoice = t.TypeOf<typeof ElementLevelChoice>;
export type IModelLevelChoice = t.TypeOf<typeof ModelLevelChoice>;


