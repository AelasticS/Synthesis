// Simple relational metamodel of the simple-eer-to-sql example suite.
// Package convention: the bare specifier ("simple-relational-metamodel")
// exports the JSX template components flat. The data-type schemas live
// behind "simple-relational-metamodel/model" to avoid identifier clashes
// (e.g. `RelSchema` is both an @aelastics/types Type and a JSX template),
// and "simple-relational-metamodel/as-model" exports the
// metamodel-as-model factory.
export * from "./REL-components.js"
