// JSX template components for the full relational metamodel of the
// eer-to-sql example suite. The data-type schemas live in model.ts.
import * as r from "./model.js"
import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<r.IRelSchema> & { store?: IStore }

export const RelSchema: CpxTemplate<IModelProps, r.IRelSchema> = (props) => {
  return new ExprNode(r.RelSchema, props, undefined)
}

export const Domain: Template<r.IDomain> = (props) => {
  return new ExprNode(r.Domain, props, "domain")
}

export const Column: Template<r.IColumn> = (props) => {
  return new ExprNode(r.Column, props, "columns")
}

export const Table: Template<r.ITable> = (props) => {
  return new ExprNode(r.Table, props, undefined)
}

