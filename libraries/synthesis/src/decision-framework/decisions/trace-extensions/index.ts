// Both files export symbols named "DecisionAwareTraceModel", "Resolution"
// and "DecisionTraceEntry" — the metamodel (t.subtype) and the JSX template
// that renders to it. Alias the metamodel types to avoid the collision; JSX
// templates keep their natural names.

export {
  Resolution as ResolutionType,
  DecisionTraceEntry as DecisionTraceEntryType,
  DecisionAwareTraceModel as DecisionAwareTraceModelType,
} from "./trace-extensions.meta.model"

export type {
  IResolution,
  IDecisionTraceEntry,
  IDecisionAwareTraceModel,
} from "./trace-extensions.meta.model"

export {
  DecisionAwareTraceModel,
  DecisionTraceEntry,
  Resolution,
} from "./trace-extensions-components"

export type {
  IDecisionAwareTraceModelProps,
} from "./trace-extensions-components"
