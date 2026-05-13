import * as t from "@aelastics/types"
import { Model, ModelElement } from "@synthesis/metamodel-core"

export const TraceModel_TypeSchema = t.schema("TraceModel_TypeSchema")

export const TraceEntry = t.subtype(
  ModelElement,
  {
    rule: t.string,
    timestamp: t.number,
    source: ModelElement,
    targets: t.arrayOf(ModelElement),
    ruleType: t.string.derive().oneOf(["RegularRule"]),
  },
  "TraceEntry",
  TraceModel_TypeSchema,
)

export const TraceModel = t.subtype(
  Model,
  {
    transformationSpec: t.string,
    source: Model,
    targets: t.arrayOf(Model),
    traceEntries: t.arrayOf(TraceEntry),
    timestamp: t.string,
    rule: t.string,
    ruleType: t.string.derive().oneOf(["RegularRule"]),
  },
  "TraceModel",
  TraceModel_TypeSchema,
)

export type ITraceModel = t.TypeOf<typeof TraceModel>;
export type ITraceEntry = t.TypeOf<typeof TraceEntry>;
