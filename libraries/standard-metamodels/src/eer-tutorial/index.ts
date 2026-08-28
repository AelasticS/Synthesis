// Simplified EER metamodel for the developer-guide tutorial.
// JSX template components are re-exported flat and under the `components`
// namespace. The data-type model is exposed only under the `model`
// namespace to avoid identifier clashes (e.g. `EERSchema` is both an
// @aelastics/types Type and a JSX template).
export * from "./EER-tutorial-components"
export * as components from "./EER-tutorial-components"
export * as model from "./EER-tutorial.meta.model.type"
