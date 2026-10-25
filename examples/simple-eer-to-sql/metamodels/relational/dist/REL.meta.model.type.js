/*
 * Copyright (c) AelasticS 2020.
 *
 */
import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";
// tslint:disable-next-line:variable-name
export const RelModel_TypeSchema = t.schema("RelModel_TypeSchema");
export const RelSchema = t.subtype(Model, {}, "RelSchema", RelModel_TypeSchema);
export const Domain = t.subtype(ModelElement, {
    type: t.string,
    defaultValue: t.optional(t.string)
}, "Domain", RelModel_TypeSchema);
export const Column = t.subtype(ModelElement, {
    type: t.string,
    isKey: t.boolean,
    ownerTable: t.link(RelModel_TypeSchema, 'Table'),
    // isForeignKey: t.link(RelModel_TypeSchema, 'Column'),
    isForeignKey: t.boolean,
    references: t.optional(t.string),
    isNullable: t.boolean,
    isAutoincrement: t.boolean,
}, "Column", RelModel_TypeSchema);
export const Table = t.subtype(ModelElement, {
    columns: t.arrayOf(Column),
}, "Table", RelModel_TypeSchema);
t.inverseProps(Table, "columns", Column, "ownerTable");
// A table scopes its columns' names.
declareNamespace(Table);
//# sourceMappingURL=REL.meta.model.type.js.map