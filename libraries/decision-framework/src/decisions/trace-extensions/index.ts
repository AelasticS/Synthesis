// Both files export a symbol named "DecisionAwareTraceModel" — the metamodel
// (t.subtype) and the JSX template that renders to it. Alias the metamodel to
// avoid the collision; JSX templates keep their natural names.

export {
  VariabilityPointTraceEntry,
  SpecializationPointTraceEntry,
  DecisionAwareTraceModel as DecisionAwareTraceModelType,
} from "./trace-extensions.meta.model"

export type {
  IVarPointTraceEntry,
  ISpecPointTraceEntry,
  IDecisionAwareTraceModel,
} from "./trace-extensions.meta.model"

export {
  DecisionAwareTraceModel,
  VarPointTraceEntry,
  SpecPointTraceEntry,
} from "./trace-extensions-components"

export type {
  IDecisionAwareTraceModelProps,
} from "./trace-extensions-components"
