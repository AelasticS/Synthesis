// Basic tutorial EER metamodel (model-to-model tutorial, Part 1).
// JSX template components are re-exported flat and under the `components`
// namespace. The data-type model is exposed only under the `model`
// namespace to avoid identifier clashes (e.g. `EERSchema` is both an
// @aelastics/types Type and a JSX template).
export * from "./EER-basic-components"
export * as components from "./EER-basic-components"
export * as model from "./EER-basic.meta.model.type"
