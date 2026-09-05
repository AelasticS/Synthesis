import * as e from "./EER-name-scopes.meta.model.type.js"
import {
  CpxTemplate,
  defaultConnectionInfo,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<e.IEERSchema> & { store?: IStore };

export const EERSchema: CpxTemplate<IModelProps, e.IEERSchema> = (props) => {
  return new ExprNode(e.EERSchema, props, undefined)
}

export const Entity: Template<e.IEntity> = (props) => {
  return new ExprNode(e.Entity, props, undefined)
}

export const Attribute: Template<e.IAttribute> = (props) => {
  return new ExprNode(e.Attribute, props, "attributes")
}

// In the scoped world a Domain appears in two contexts: declared once as
// model-level vocabulary (a direct child of the schema connects into
// `elements`) or referenced from an attribute (a child of an Attribute
// connects into `attrDomain`). Ordered candidates with first-available
// semantics pick the right one per context.
export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, defaultConnectionInfo(["attrDomain", "elements"]))
}

export const Relationship: Template<e.IRelationship> = (props) => {
  return new ExprNode(e.Relationship, props, undefined)
}

export const Role: Template<e.IOrdinaryMapping> = (props) => {
  return new ExprNode(e.OrdinaryMapping, props, "roles")
}
