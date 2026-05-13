// types-metamodel: an aelastics-types-aware type metamodel.
//
// JSX template components are exposed flat (and under `components`).
// Data-type model under `model` to avoid identifier clashes (e.g.
// `TypeModel` is both a Type and a Template).
export * from "./types-components"
export * from "./predefined-types"
export * from "./predefined-model"
export * as components from "./types-components"
export * as model from "./types-meta.model"
