// Full relational metamodel of the eer-to-sql example suite.
// Package convention: the bare specifier ("relational-metamodel") exports
// the JSX template components flat. The data-type schemas live behind
// "relational-metamodel/model" to avoid identifier clashes (e.g.
// `RelSchema` is both an @aelastics/types Type and a JSX template), and
// "relational-metamodel/as-model" exports the metamodel-as-model factory.
export * from "./components.js"
