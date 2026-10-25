/*
 * Name-scopes stage of the tutorial relational metamodel (model-to-model
 * tutorial, Part 4). Structurally identical to the base stage; the one
 * difference is a naming rule. Table is declared a name scope, so column
 * names are unique per table rather than per model: every table can
 * carry its own `id`, and a reference into another table's scope is a
 * path such as `Author/id`.
 *
 * Everything the base stage deliberately excludes stays excluded here:
 * composite foreign keys (a reference is still a single column link),
 * foreign key constraints as first class elements, and indexes. Those
 * belong to the full relational metamodel of the eer-database-suite.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";
export const RelTutorialNameScopes_TypeSchema = t.schema("RelTutorialNameScopesSchema");
export const RelSchema = t.subtype(Model, {}, "RelSchema", RelTutorialNameScopes_TypeSchema);
export const Column = t.subtype(ModelElement, {
    type: t.string,
    isKey: t.boolean,
    isNullable: t.boolean,
    isAutoincrement: t.boolean,
    // The primary key column this column points at, when it is a
    // foreign key. One column, never several: the tutorial does not
    // model composite keys.
    references: t.optional(t.link(RelTutorialNameScopes_TypeSchema, "Column")),
}, "Column", RelTutorialNameScopes_TypeSchema);
export const Table = t.subtype(ModelElement, {
    columns: t.arrayOf(Column),
}, "Table", RelTutorialNameScopes_TypeSchema);
// A table scopes its columns' names.
declareNamespace(Table);
//# sourceMappingURL=REL-name-scopes.meta.model.type.js.map