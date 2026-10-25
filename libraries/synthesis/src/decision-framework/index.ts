// Decision framework root barrel.
//
// We deliberately keep the public surface narrow at this entry to avoid
// name clashes between metamodels and their JSX wrappers (e.g. Option,
// DecisionModel, BindingModel are exported by both the metamodel and its
// components file). Consumers needing the JSX wrappers should import from
// the explicit subpaths.

// Re-export the engine's public surface so consumers that pull from
// this barrel can transitively reach engine symbols.
export * from "../engine"

// Decision-aware M2M
export * from "./decisions/decision-aware-m2m/decision-aware-m2m"

// Variability decorators + eval operators (orthogonal to metamodel/component clashes)
export * from "./variability/var-decorators"
export * from "./variability/eval-operators"
