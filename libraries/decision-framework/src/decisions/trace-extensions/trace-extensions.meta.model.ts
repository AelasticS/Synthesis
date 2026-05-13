import * as t from "@aelastics/types"
import {
  TraceEntryType as TraceEntry,
  TraceModelType as TraceModel,
  TraceModel_TypeSchema,
} from "@synthesis/engine"
import { Choice, ConfigurationModel } from "../3.configuration-model/configuration-meta.model"

export const VariabilityPointTraceEntry = t.subtype(
  TraceEntry,
  {
    ruleType: t.literal("VariabilityPoint"),
    variabilityOption: t.string,
    choices: t.arrayOf(Choice),
  },
  "VariabilityPointTraceEntry",
  TraceModel_TypeSchema,
)

export const SpecializationPointTraceEntry = t.subtype(
  TraceEntry,
  {
    ruleType: t.literal("SpecializationPoint"),
    specializationOption: t.string,
    sourceType: t.string,
  },
  "SpecializationPointTraceEntry",
  TraceModel_TypeSchema,
)

export const DecisionAwareTraceModel = t.subtype(
  TraceModel,
  {
    config: t.optional(ConfigurationModel),
    variabilityOption: t.optional(t.string),
    choices: t.optional(t.arrayOf(Choice)),
  },
  "DecisionAwareTraceModel",
  TraceModel_TypeSchema,
)

export type IVarPointTraceEntry = t.TypeOf<typeof VariabilityPointTraceEntry>;
export type ISpecPointTraceEntry = t.TypeOf<typeof SpecializationPointTraceEntry>;
export type IDecisionAwareTraceModel = t.TypeOf<typeof DecisionAwareTraceModel>;
