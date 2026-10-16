/*
 * Copyright (c) AelasticS 2020.
 *
 */

import * as t from "@aelastics/types"

import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel"

// tslint:disable-next-line:variable-name
export const RelModel_TypeSchema = t.schema("RelModel_TypeSchema");

export const RelSchema = t.subtype(Model, {
}, "RelSchema", RelModel_TypeSchema);

export const Domain = t.subtype(ModelElement, {
  type: t.string,
  defaultValue: t.optional(t.string)
}, "Domain", RelModel_TypeSchema);

export const Column = t.subtype(ModelElement, {
  domain: Domain,
  isKey: t.boolean,
  ownerTable: t.link(RelModel_TypeSchema, 'Table'),
  indexes: t.arrayOf(t.link(RelModel_TypeSchema, "Index")),
  // foreignKeys: t.arrayOf(t.link(RelModel_TypeSchema, "ForeignKey")),
}, "Column", RelModel_TypeSchema);

export const Index = t.subtype(ModelElement, {
  ownerTable: t.link(RelModel_TypeSchema, 'Table'),
  columns: t.arrayOf(Column),
  isUnique: t.boolean
}, "Index", RelModel_TypeSchema);

export const ForeignKeyColumn = t.subtype(ModelElement, {
  fkColumn: Column,
  refColumn: Column
}, 'ForeignKeyColumn', RelModel_TypeSchema);

export const ForeignKey = t.subtype(ModelElement, {
  ownerTable: t.link(RelModel_TypeSchema, 'Table'),
  fkColumns: t.arrayOf(ForeignKeyColumn),
  isUnique: t.boolean,
  referencedTable: t.link(RelModel_TypeSchema, 'Table')
}, "ForeignKey", RelModel_TypeSchema);

export const Table = t.subtype(ModelElement, {
  columns: t.arrayOf(Column),
  indexes: t.arrayOf(Index),
  foreignKeys: t.arrayOf(ForeignKey)
}, "Table", RelModel_TypeSchema);

t.inverseProps(Table, "columns", Column, "ownerTable")
t.inverseProps(Table, "foreignKeys", ForeignKey, "ownerTable")
t.inverseProps(Table, "indexes", Index, "ownerTable")

// ── declared constraints, run at the validation point ───────────────

// Membership: a key or index may only name columns of the table it
// belongs to, and a foreign key's referenced columns must be columns
// of the referenced table.
const inTable = (table: ITable | undefined, col: IColumn | undefined): boolean =>
  table !== undefined && col !== undefined && ((table.columns ?? []) as IColumn[]).includes(col);

ForeignKey.addValidator({
  predicate: (v: IForeignKey) =>
    ((v.fkColumns ?? []) as IForeignKeyColumn[]).every(
      (p) =>
        inTable(v.ownerTable as ITable | undefined, p.fkColumn as IColumn | undefined) &&
        inTable(v.referencedTable as ITable | undefined, p.refColumn as IColumn | undefined),
    ),
  message: (_v: IForeignKey, label?: string) =>
    `${label ?? "ForeignKey"}: every foreign key column must belong to the owning table and every referenced column to the referenced table`,
});

Index.addValidator({
  predicate: (v: IIndex) =>
    ((v.columns ?? []) as IColumn[]).every((c) => inTable(v.ownerTable as ITable | undefined, c)),
  message: (_v: IIndex, label?: string) =>
    `${label ?? "Index"}: every index column must be a column of the owning table`,
});

// A table scopes its columns', keys', and indexes' names.
declareNamespace(Table)

export type ITable = t.TypeOf<typeof Table>
export type IRelSchema = t.TypeOf<typeof RelSchema>
export type IDomain = t.TypeOf<typeof Domain>
export type IColumn = t.TypeOf<typeof Column>
export type IIndex = t.TypeOf<typeof Index>
export type IForeignKey = t.TypeOf<typeof ForeignKey>
export type IForeignKeyColumn = t.TypeOf<typeof ForeignKeyColumn>

