// EER (Extended Entity-Relationship) metamodel.
// JSX template components are exposed both flat (for named imports) and under
// the `components` namespace (for `import { components as e } from ...`). The
// data-type model is exposed under the `model` namespace to avoid identifier
// clashes (e.g. `EERSchema` is both a Type and a Template).

export * from './EER-components';
export * as components from './EER-components';
export * as model from './EER.meta.model.type';
