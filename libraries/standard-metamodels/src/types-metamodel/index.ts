// The types meta-model — JSX template components are exposed both flat (for
// named imports) and under the `components` namespace. The data-type model is
// exposed under the `model` namespace to avoid identifier clashes
// (e.g. `TypeModel` is both a Type and a Template).

export * from './types-components';
export * as components from './types-components';
export * as model from './types-meta.model';

// `models-component` and `types-components` both export an `IModelProps`
// interface; here we expose the generic-model components and drop the
// duplicate `IModelProps` (callers can still reach it through a direct
// `models-component` import if they need it).
export { Model, Element } from './models-component';

export * from './predefined-types';
export * from './predefined-model';
