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

// A Domain is declared once at model level (a direct child of the
// schema connects into `elements`) or referenced from a column's
// `domain` prop; ordered candidates pick the context.
export const Domain: Template<r.IDomain> = (props) => {
  return new ExprNode(r.Domain, props, defaultConnectionInfo(["domain", "elements"]))
}

// One Column tag for every context, connected via ordered candidates
// with first-available semantics: a contained column in a Table; the
// pair of a ForeignKeyColumn (the first Column reference fills
// fkColumn, the second refColumn); an Index's column list.
export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, {
    ...defaultConnectionInfo(["columns", "fkColumn", "refColumn"]),
    // the Flow.from/to idiom: an occupied pair slot is skipped, never
    // reconnected, so the first reference fills fkColumn, the second
    // refColumn
    isReconnectAllowed: false,
  })
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
