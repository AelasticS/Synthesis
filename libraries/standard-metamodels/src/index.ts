// Root barrel intentionally empty: each subpath registers its own
// @aelastics/types schemas, and eagerly loading every one of them at once
// triggers cross-subpath name clashes (e.g. NameType in multiple schemas).
// Consumers should import from the dedicated subpaths:
//   @synthesis/standard-metamodels/eer
//   @synthesis/standard-metamodels/relational
//   @synthesis/standard-metamodels/bpm
//   @synthesis/standard-metamodels/types-metamodel
export {}
