// BPM (Business Process Model) metamodel.
// JSX template components are exposed both flat (for named imports) and under
// the `components` namespace. The data-type model is exposed under the
// `model` namespace to avoid identifier clashes (e.g. `Process` is both a
// Type and a Template).
//
// The supplementary `organization.model.type` and `example-department`
// fixtures are NOT re-exported from this barrel — they register types into
// aelastics-types' DefaultSchema at module load and would clash if loaded
// twice across test runs in the same Jest worker. Import them directly via
// `@synthesis/standard-metamodels/bpm/organization` or
// `@synthesis/standard-metamodels/bpm/example-department`.

export * from './BPM.components';
export * as components from './BPM.components';
export * as model from './BPM.meta.model.type';
