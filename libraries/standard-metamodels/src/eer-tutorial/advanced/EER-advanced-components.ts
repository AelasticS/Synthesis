import * as e from "./EER-advanced.meta.model.type"
import {
  CpxTemplate,
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

export const Kernel: Template<e.IKernel> = (props) => {
  return new ExprNode(e.Kernel, props, undefined)
}

export const Weak: Template<e.IWeak> = (props) => {
  return new ExprNode(e.Weak, props, undefined)
}

export const Attribute: Template<e.IAttribute> = (props) => {
  return new ExprNode(e.Attribute, props, "attributes")
}

export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, "attrDomain")
}

export const Relationship: Template<e.IRelationship> = (props) => {
  return new ExprNode(e.Relationship, props, undefined)
}

export const Role: Template<e.IOrdinaryMapping> = (props) => {
  return new ExprNode(e.OrdinaryMapping, props, "roles")
}
