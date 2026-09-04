// The one-stop trace surface: the base trace metamodel and templates
// (engine barrel), the decision-aware extensions, and the reference
// templates a serialized trace file needs (its source, target, element,
// and choice references serialize with their type names as tags).
export * from '../../engine/transformations/trace'
export {
  DecisionAwareTraceModel,
  DecisionTraceEntry,
  Resolution,
  ResolutionType,
  DecisionTraceEntryType,
  DecisionAwareTraceModelType,
} from '../../decision-framework/decisions/trace-extensions'
export type {
  IResolution,
  IDecisionTraceEntry,
  IDecisionAwareTraceModel,
} from '../../decision-framework/decisions/trace-extensions'
export { Model, Element as ModelElement } from '../../jsx-runtime'
export { Choice } from '../../decision-framework/decisions/3.configuration-model/configuration-meta.model-components'
