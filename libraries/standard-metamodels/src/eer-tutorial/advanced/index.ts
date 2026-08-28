// Advanced tutorial EER metamodel (model-to-model tutorial, Part 2 and
// later): the basic stage plus the Kernel/Weak entity subtypes.
// JSX template components are re-exported flat and under the `components`
// namespace. The data-type model is exposed only under the `model`
// namespace to avoid identifier clashes (e.g. `EERSchema` is both an
// @aelastics/types Type and a JSX template).
export * from "./EER-advanced-components"
export * as components from "./EER-advanced-components"
export * as model from "./EER-advanced.meta.model.type"
