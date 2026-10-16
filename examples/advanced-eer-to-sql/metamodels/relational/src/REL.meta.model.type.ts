/*
 * Copyright (c) AelasticS 2020.
 *
 * Data-type schemas of the full relational metamodel, owned by the
 * eer-to-sql example suite: tables with real foreign keys (composite
 * capable, carrying referential actions) and indexes, and wired
 * domains (v2). The JSX template components over these schemas live in
 * components.ts. Table is a namespace: column names are unique per
 * table, not per model.
 */

import * as t from "@aelastics/types"

import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel"

// tslint:disable-next-line:variable-name
export const RelModel_TypeSchema = t.schema("RelModel_TypeSchema");

export const RelSchema = t.subtype(Model, {
}, "RelSchema", RelModel_TypeSchema);

// The referential actions of standard SQL, dialect-neutral: what
// happens to the referencing rows when the referenced row is deleted
// (onDelete) or its key modified (onUpdate).
export const ReferentialAction = t.string.derive().oneOf(["Restrict", "Cascade", "SetNull", "SetDefault"]);

// A wired domain (v2, decision 5 of design/eer-to-relational-v2.md): a
// named type with an optional check (a boolean SQL expression over
// VALUE) and default. Columns may reference one; Column.type always
// keeps the resolved SQL type string, so a model without domains works
// exactly as before.
export const Domain = t.subtype(ModelElement, {
  type: t.string,
  check: t.optional(t.string),
  defaultValue: t.optional(t.string)
}, "Domain", RelModel_TypeSchema);

export const Column = t.subtype(ModelElement, {
  type: t.string,
  isNullable: t.boolean,
  isAutoincrement: t.boolean,
  domain: t.optional(t.link(RelModel_TypeSchema, 'Domain')),
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
  // The disconnect rule as declarative actions; the connect rule has
  // no declarative SQL form in any dialect, so a non-Restrict
  // onConnect is emitted as insert/update triggers by the DDL layer.
  onConnect: t.optional(ReferentialAction),
  onDelete: t.optional(ReferentialAction),
  onUpdate: t.optional(ReferentialAction),
  referencedTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
  ownerTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "ForeignKey", RelModel_TypeSchema);

export const Index = t.subtype(ModelElement, {
  columns: t.arrayOf(t.link(RelModel_TypeSchema, "Column")),
  isUnique: t.boolean,
  ownerTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "Index", RelModel_TypeSchema);

// The primary key as a first-class named constraint: an ORDERED list
// of the owner table's columns, symmetric with ForeignKey. Key-ness
// of a column IS membership in this list, stated once, per the
// derived-fact principle: a fact is not stored beside where it could
// disagree.
export const PrimaryKey = t.subtype(ModelElement, {
  columns: t.arrayOf(t.link(RelModel_TypeSchema, "Column")),
  ownerTable: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "PrimaryKey", RelModel_TypeSchema);

export const Table = t.subtype(ModelElement, {
  columns: t.arrayOf(Column),
  // Semantically every base table has one; type-level optional for the
  // creation order (the key nests after its columns exist).
  primaryKey: t.optional(PrimaryKey),
  foreignKeys: t.arrayOf(ForeignKey),
  indexes: t.arrayOf(Index),
  // A history table names the base table whose row versions it keeps
  // (design/row-history.md). Deliberately NOT a foreign key: history
  // outlives the deletion of the base row, so the link is a declarative
  // fact for the DDL layer's capture triggers, never a referential
  // constraint.
  historyOf: t.optional(t.link(RelModel_TypeSchema, 'Table')),
}, "Table", RelModel_TypeSchema);

t.inverseProps(Table, "columns", Column, "ownerTable")
t.inverseProps(Table, "primaryKey", PrimaryKey, "ownerTable")
t.inverseProps(Table, "foreignKeys", ForeignKey, "ownerTable")
t.inverseProps(Table, "indexes", Index, "ownerTable")

// ── declared constraints, run at the validation point ───────────────
// A primary key names at least one column.
PrimaryKey.addValidator({
  predicate: (v: IPrimaryKey) => (v.columns?.length ?? 0) >= 1,
  message: (_v: IPrimaryKey, label?: string) =>
    `${label ?? "PrimaryKey"}: a primary key lists at least one column`,
});

// Membership: a key or index may only name columns of the table it
// belongs to, and a foreign key's referenced columns must be columns
// of the referenced table.
const inTable = (table: ITable | undefined, col: IColumn | undefined): boolean =>
  table !== undefined && col !== undefined && ((table.columns ?? []) as IColumn[]).includes(col);

PrimaryKey.addValidator({
  predicate: (v: IPrimaryKey) =>
    ((v.columns ?? []) as IColumn[]).every((c) => inTable(v.ownerTable as ITable | undefined, c)),
  message: (_v: IPrimaryKey, label?: string) =>
    `${label ?? "PrimaryKey"}: every primary key column must be a column of the owning table`,
});

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
export type IForeignKey = t.TypeOf<typeof ForeignKey>
export type IForeignKeyColumn = t.TypeOf<typeof ForeignKeyColumn>
export type IIndex = t.TypeOf<typeof Index>
export type IPrimaryKey = t.TypeOf<typeof PrimaryKey>
