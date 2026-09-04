// JSX template components for the full relational metamodel of the
// eer-to-sql example suite. The data-type schemas live in model.ts.
import * as r from "./model.js"
import {
  CpxTemplate,
  defaultConnectionInfo,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<r.IRelSchema> & { store?: IStore }

export const RelSchema: CpxTemplate<IModelProps, r.IRelSchema> = (props) => {
  return new ExprNode(r.RelSchema, props, undefined)
}

// Kept as-is while decision 5 (Domain) is under discussion; unwired.
export const Domain: Template<r.IDomain> = (props) => {
  return new ExprNode(r.Domain, props, "domain")
}

// One Column tag for every context, connected via ordered candidates
// with first-available semantics: a contained column in a Table; the
// pair of a ForeignKeyColumn (the first Column reference fills
// fkColumn, the second refColumn); an Index's column list.
export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, defaultConnectionInfo(["columns", "fkColumn", "refColumn"]))
}

export const Table: Template<r.ITable> = (props) => {
  return new ExprNode(r.Table, props, undefined)
}

export const ForeignKey: Template<r.IForeignKey> = (props) => {
  return new ExprNode(r.ForeignKey, props, "foreignKeys")
}

export const ForeignKeyColumn: Template<r.IForeignKeyColumn> = (props) => {
  return new ExprNode(r.ForeignKeyColumn, props, "fkColumns")
}

export const Index: Template<r.IIndex> = (props) => {
  return new ExprNode(r.Index, props, "indexes")
}
