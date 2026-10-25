import * as e from "./EER.meta.model.type.js"
import {
  allowedAsTopLevelElement,
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

export const Kernel: Template<e.IKernel> = (props) => {
  return new ExprNode(
    e.Kernel,
    // { objectClassification: "Kernel", ...props },
    props,
    undefined,
  )
}

export const ERConcept: Template<e.IERConcept> = (props) => {
  // If the props contain a $refByName, we assume it's a reference to an existing ERConcept
  // if (props.$refByName) {
  return new ExprNode(e.ERConcept, props, "elements")
  // }
}

export const Weak: Template<e.IWeak> = (props) => {
  return new ExprNode(
    e.Weak,
    // { objectClassification: "Weak", ...props },
    props,
    undefined,
  )
}

// An Attribute nests in an Entity (via attributes) or, one level deep,
// in a composite parent Attribute (via components); ordered candidates
// with first-available semantics pick the right one per context.
export const Attribute: Template<e.IAttribute> = (props) => {
  return new ExprNode(e.Attribute, props, defaultConnectionInfo(["attributes", "components"]))
}

// A Domain is declared once as model-level vocabulary (a direct child
// of the schema connects into `elements`) or types an attribute (a
// child of an Attribute connects into `attrDomain`). Model-level
// declaration matters under entity scopes: a domain declared inside an
// entity would land in that entity's scope.
export const Domain: Template<e.IDomain> = (props) => {
  return new ExprNode(e.Domain, props, defaultConnectionInfo(["attrDomain", "elements"]))
}

export const Relationship: Template<e.IRelationship> = (props) => {
  return new ExprNode(e.Relationship, props, undefined)
}

export const OrdinaryMapping: Template<e.IOrdinaryMapping> = (props) => {
  return new ExprNode(e.OrdinaryMapping, props, "roles")
}

// Nested in its weak entity (via weakMap; the inverse fills the
// codomain): the identification dependency is authored where it
// semantically lives.
export const WeakMapping: Template<e.IWeakMapping> = (props) => {
  return new ExprNode(e.WeakMapping, props, "weakMap")
}

// A first-class entity, authored at top level like any other; its
// membership is the supertype reference
// (supertype={<Specialization $refByName="Person/personRoles" />},
// scope-qualified because entities are name scopes). The "subtypes"
// connection also admits a membership graft, a Subtype reference
// child of a re-opened Specialization.
export const Subtype: Template<e.ISubtype> = (props) => {
  return new ExprNode(e.Subtype, props, allowedAsTopLevelElement("subtypes"))
}

// A specialization IS a mapping and nests inside its root entity,
// connecting into `mappings`; the inverse fills its domain (the root)
// at creation. Several specializations inside one entity are several
// independent categories of subtyping.
// allowedAsTopLevelElement keeps the re-opening idiom working
// (<Specialization $refByName="SubA/S1"> with membership children);
// a NEW specialization authored at top level renders but fails the
// declared root-presence constraint.
export const Specialization: Template<e.ISpecialization> = (props) => {
  return new ExprNode(e.Specialization, props, allowedAsTopLevelElement("mappings"))
}

export const Aggregation: Template<e.IAggregation> = (props) => {
  return new ExprNode(e.Aggregation, props, undefined)
}

export const AggregationMapping: Template<e.IAggregationMapping> = (props) => {
  return new ExprNode(e.AggregationMapping, props, "agrMapp")
}

export const Role: Template<e.IOrdinaryMapping> = (props) => {
  return new ExprNode(e.OrdinaryMapping, props, "roles")
}

export const Entity: Template<e.IKernel> = (props) => {
  return new ExprNode(e.Kernel, props, undefined)
}
