// Relational metamodel barrel. Three variants exist (v1, v2, legacy) — they
// register overlapping `arrayOf(Column)` etc. into aelastics-types' shared
// schema state and therefore CANNOT be loaded together. The barrel only
// re-exports v1; callers that need v2 or legacy must import them from their
// dedicated subpaths:
//   - `@synthesis/standard-metamodels/relational/model-v2`
//   - `@synthesis/standard-metamodels/relational/components-v2`
//   - `@synthesis/standard-metamodels/relational/model-legacy`
//   - `@synthesis/standard-metamodels/relational/components-legacy`

export * from './REL-components';
export * as components from './REL-components';
export * as model from './REL.meta.model.type';
