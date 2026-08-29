// Relational (REL) metamodel: canonical v1 only.
//
// v2 and legacy variants share aelastics-types schema/array names with v1
// (e.g. NameType, ColumnArray, ...). Loading more than one variant via this
// barrel triggers "OperationNotAllowed: Type ... already exists" at module
// init. Reach them via the dedicated subpaths:
//   @synthesis/standard-metamodels/relational/model-v2
//   @synthesis/standard-metamodels/relational/components-v2
//   @synthesis/standard-metamodels/relational/model-legacy
//   @synthesis/standard-metamodels/relational/components-legacy
//
// Same flat + `components` + `model` convention as `eer`.
export * from "./REL-components"
export * as components from "./REL-components"
export * as model from "./REL.meta.model.type"
