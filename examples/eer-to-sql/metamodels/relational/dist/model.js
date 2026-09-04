/*
 * Copyright (c) AelasticS 2020.
 *
 * Data-type schemas of the full relational metamodel, owned by the
 * eer-to-sql example suite: tables with real foreign keys (composite
 * capable) and indexes. The JSX template components over these schemas
 * live in components.ts. Table is a namespace: column names are unique
 * per table, not per model.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";
// tslint:disable-next-line:variable-name
export const RelModel_TypeSchema = t.schema("RelModel_TypeSchema");
export const RelSchema = t.subtype(Model, {}, "RelSchema", RelModel_TypeSchema);
// Kept as-is while decision 5 of the flagship record (Domain in the
// relational metamodel) is under discussion; currently unwired, Column
// carries a plain SQL type string.
export const Domain = t.subtype(ModelElement, {
    type: t.string,
    defaultValue: t.optional(t.string)
}, "Domain", RelModel_TypeSchema);
export const Column = t.subtype(ModelElement, {
    type: t.string,
    isKey: t.boolean,
    isNullable: t.boolean,
    isAutoincrement: t.boolean,
    ownerTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "Column", RelModel_TypeSchema);
// One pair per participating column; several pairs on one ForeignKey
// form a composite foreign key. The links are type-level optional for
// the creation-order reason established by Flow.from/to; the DDL
// generator checks semantic completeness.
export const ForeignKeyColumn = t.subtype(ModelElement, {
    fkColumn: t.optional(t.link(RelModel_TypeSchema, 'Column')),
    refColumn: t.optional(t.link(RelModel_TypeSchema, 'Column')),
}, 'ForeignKeyColumn', RelModel_TypeSchema);
export const ForeignKey = t.subtype(ModelElement, {
    fkColumns: t.arrayOf(ForeignKeyColumn),
    isUnique: t.boolean,
    referencedTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
    ownerTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "ForeignKey", RelModel_TypeSchema);
export const Index = t.subtype(ModelElement, {
    columns: t.arrayOf(t.link(RelModel_TypeSchema, "Column")),
    isUnique: t.boolean,
    ownerTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "Index", RelModel_TypeSchema);
export const Table = t.subtype(ModelElement, {
    columns: t.arrayOf(Column),
    foreignKeys: t.arrayOf(ForeignKey),
    indexes: t.arrayOf(Index),
}, "Table", RelModel_TypeSchema);
t.inverseProps(Table, "columns", Column, "ownerTable");
t.inverseProps(Table, "foreignKeys", ForeignKey, "ownerTable");
t.inverseProps(Table, "indexes", Index, "ownerTable");
// A table scopes its columns', keys', and indexes' names.
declareNamespace(Table);
//# sourceMappingURL=model.js.map