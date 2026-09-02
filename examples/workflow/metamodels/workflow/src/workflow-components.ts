import * as w from "./workflow.meta.model.type.js"
import {
  ConnectionInfo,
  CpxTemplate,
  defaultConnectionInfo,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<w.IProcess> & { store?: IStore };

export const Process: CpxTemplate<IModelProps, w.IProcess> = (props) => {
  return new ExprNode(w.Process, props, undefined)
}

// Every activity connects into the first containment its parent
// declares: the process body at the top level, a block's children when
// nested. A second top-level block is refused (the body is single).
const activityConnection: ConnectionInfo = {
  ...defaultConnectionInfo(["body", "children"]),
  isReconnectAllowed: false,
}
export const Task: Template<w.ITask> = (props) => {
  return new ExprNode(w.Task, props, activityConnection)
}

export const Sequence: Template<w.ISequence> = (props) => {
  return new ExprNode(w.Sequence, props, activityConnection)
}

export const Parallel: Template<w.IParallel> = (props) => {
  return new ExprNode(w.Parallel, props, activityConnection)
}

export const SubProcess: Template<w.ISubProcess> = (props) => {
  return new ExprNode(w.SubProcess, props, activityConnection)
}
