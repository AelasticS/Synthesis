// BPM metamodel.
//
// `organization` is reachable only via its dedicated module
// (./organization.model.type). It registers types
// (e.g. NameType) into a way that conflicts with the canonical BPM schema
// when eagerly co-loaded.
export * from "./BPM.components"
export * as components from "./BPM.components"
export * as model from "./BPM.meta.model.type"
