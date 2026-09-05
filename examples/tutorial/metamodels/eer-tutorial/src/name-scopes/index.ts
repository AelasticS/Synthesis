// Name-scopes tutorial EER metamodel (model-to-model tutorial, Part 4).
// Package convention: "eer-tutorial-metamodel/name-scopes" exports the JSX
// template components flat. The data-type schemas live behind
// "eer-tutorial-metamodel/name-scopes/model" to avoid identifier clashes
// (e.g. `EERSchema` is both an @aelastics/types Type and a JSX template).
export * from "./EER-name-scopes-components.js"
