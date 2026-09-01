// The root of @aelastics/synthesis deliberately exports nothing.
// Consumers import from the namespaced subpaths (see design/consolidation.md):
// during stage 1 of the consolidation these mirror the pre-merge package
// layout (./jsx-runtime, ./metamodel-core, ./engine, ./decision-framework,
// ./metamodels/types); stage 2 replaces them with the final surface
// (./jsx, ./metamodel, ./store, ./m2m, ./m2t, ./variability, ./metamodels/*).
export {}
