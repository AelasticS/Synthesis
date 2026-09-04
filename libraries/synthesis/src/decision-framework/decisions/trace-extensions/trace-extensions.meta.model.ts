import * as t from "@aelastics/types"
import { ModelElement } from "../../../metamodel-core"
import {
  TraceEntryType as TraceEntry,
  TraceModelType as TraceModel,
  TraceModel_TypeSchema,
} from "../../../engine"
import { Choice, ConfigurationModel } from "../3.configuration-model/configuration-meta.model"

// One resolved configuration outcome: which option answered which
// issue. `element` is set when the consultation was scoped to an
// element other than the carrying entry's source (and always at model
// level for element-scoped facts); it is absent for global issues.
// `choice` references the configuration's explicit Choice; `byDefault`
// marks a fallback to the issue's default option (no explicit choice
// existed for this issue and element).
export const Resolution = t.subtype(
  ModelElement,
  {
    issue: t.string,
    option: t.string,
    byDefault: t.optional(t.boolean),
    element: t.optional(ModelElement),
    choice: t.optional(Choice),
  },
  "Resolution",
  TraceModel_TypeSchema,
)

// The decision-aware entry: a plain outcome entry plus the resolutions
// that shaped this rule execution's result.
export const DecisionTraceEntry = t.subtype(
  TraceEntry,
  {
    resolutions: t.arrayOf(Resolution),
  },
  "DecisionTraceEntry",
  TraceModel_TypeSchema,
)

// The decision-aware trace model: records the configuration in use and
// carries model-level resolutions (global issues, and element-scoped
// consultations whose element no rule transformed).
export const DecisionAwareTraceModel = t.subtype(
  TraceModel,
  {
    config: t.optional(ConfigurationModel),
    resolutions: t.arrayOf(Resolution),
  },
  "DecisionAwareTraceModel",
  TraceModel_TypeSchema,
)

export type IResolution = t.TypeOf<typeof Resolution>;
export type IDecisionTraceEntry = t.TypeOf<typeof DecisionTraceEntry>;
export type IDecisionAwareTraceModel = t.TypeOf<typeof DecisionAwareTraceModel>;
