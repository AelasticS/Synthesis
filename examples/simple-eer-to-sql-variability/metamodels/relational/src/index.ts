// Simple relational metamodel of the simple-eer-to-sql-variability example suite.
// Package convention: the bare specifier ("simple-relational-metamodel-variability")
// exports the JSX template components flat. The data-type schemas live
// behind "simple-relational-metamodel-variability/model" to avoid identifier clashes
// (e.g. `RelSchema` is both an @aelastics/types Type and a JSX template),
// and "simple-relational-metamodel-variability/as-model" exports the
// metamodel-as-model factory.
export * from "./REL-components.js"
