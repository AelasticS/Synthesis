// Pure trace metamodel + JSX templates.
//
// Both files export symbols named "TraceEntry" and "TraceModel" — the former
// is the metamodel (t.subtype), the latter is the JSX template that renders
// to it. We re-export them via namespace aliases to avoid the collision.

export {
  TraceModel_TypeSchema,
  TraceEntry as TraceEntryType,
  TraceModel as TraceModelType,
} from "./trace-meta.model"

export type {
  ITraceEntry,
  ITraceModel,
} from "./trace-meta.model"

export {
  TraceEntry,
  TraceModel,
  TargetElement,
} from "./trace-model-meta.model-components"

export type {
  ITraceModelProps,
} from "./trace-model-meta.model-components"
