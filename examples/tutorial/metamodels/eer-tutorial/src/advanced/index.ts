// Advanced tutorial EER metamodel (model-to-model tutorial, Part 2 and
// later): the basic stage plus the Kernel/Weak entity subtypes.
// Package convention: "eer-tutorial-metamodel/advanced" exports the JSX
// template components flat. The data-type schemas live behind
// "eer-tutorial-metamodel/advanced/model" to avoid identifier clashes
// (e.g. `EERSchema` is both an @aelastics/types Type and a JSX template),
// and "eer-tutorial-metamodel/advanced/as-model" exports the
// metamodel-as-model factory.
export * from "./EER-advanced-components.js"
