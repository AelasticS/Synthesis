// Relational (REL) metamodel.
//
// The former v1 and v2 variants are gone; the legacy files are now the one
// relational metamodel and this barrel re-exports them. The dedicated
// subpaths remain temporarily for compatibility until the examples
// restructure:
//   @synthesis/standard-metamodels/relational/model-legacy
//   @synthesis/standard-metamodels/relational/components-legacy
//
// Same flat + `components` + `model` convention as `eer`.
export * from "./REL-components.legacy"
export * as components from "./REL-components.legacy"
export * as model from "./REL.meta.model.type.legacy"
