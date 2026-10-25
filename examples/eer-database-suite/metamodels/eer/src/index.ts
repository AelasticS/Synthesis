// Full EER (Extended Entity-Relationship) metamodel of the eer-to-sql
// example suite.
// Package convention: the bare specifier ("eer-metamodel") exports the JSX
// template components flat. The data-type schemas live behind
// "eer-metamodel/model" to avoid identifier clashes (e.g. `EERSchema` is
// both an @aelastics/types Type and a JSX template), and
// "eer-metamodel/as-model" exports the metamodel-as-model factory.
export * from "./EER-components.js"
