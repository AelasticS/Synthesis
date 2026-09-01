// Simplified relational metamodel for the developer-guide tutorial.
// Package convention: the bare specifier ("rel-tutorial-metamodel") exports
// the JSX template components flat. The data-type schemas live behind
// "rel-tutorial-metamodel/model" to avoid identifier clashes (e.g.
// `RelSchema` is both an @aelastics/types Type and a JSX template), and
// "rel-tutorial-metamodel/as-model" exports the metamodel-as-model factory.
export * from "./REL-tutorial-components.js"
