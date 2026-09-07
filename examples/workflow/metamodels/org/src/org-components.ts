import * as o from "./org.meta.model.type.js"
import {
  allowedAsTopLevelElement,
  CpxTemplate,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<o.IOrganization> & { store?: IStore };

export const Organization: CpxTemplate<IModelProps, o.IOrganization> = (props) => {
  return new ExprNode(o.Organization, props, undefined)
}

// A unit nests in its parent unit (subUnits; the inverse fills parent)
// or sits at the organization's top level with `parent` authored as a
// reference prop, which is how the sample lays the hierarchy flat.
const unitConnection = allowedAsTopLevelElement(["subUnits"])

export const OrgUnit: Template<o.IOrgUnit> = (props) => {
  return new ExprNode(o.OrgUnit, props, unitConnection)
}

export const Department: Template<o.IDepartment> = (props) => {
  return new ExprNode(o.Department, props, unitConnection)
}

export const Board: Template<o.IBoard> = (props) => {
  return new ExprNode(o.Board, props, unitConnection)
}

// A worker nests in the unit it works in; the inverse fills worksIn.
export const Worker: Template<o.IWorker> = (props) => {
  return new ExprNode(o.Worker, props, "members")
}

// Reference tag for the department's manager: the manager is one of
// the department's own members, so <Manager $refByName="X" /> is
// authored after the workers, when X exists (the FromNode/ToNode
// idiom).
export const Manager: Template<o.IWorker> = (props) => {
  return new ExprNode(o.Worker, props, "manager")
}

// Reference tag for the organization's top unit, authored after the
// units exist.
export const TopUnit: Template<o.IOrgUnit> = (props) => {
  return new ExprNode(o.OrgUnit, props, "topUnit")
}
