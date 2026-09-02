import * as w from "./workflow.meta.model.type.js"
import {
  allowedAsTopLevelElement,
  CpxTemplate,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<w.IProcess> & { store?: IStore };

export const Process: CpxTemplate<IModelProps, w.IProcess> = (props) => {
  return new ExprNode(w.Process, props, undefined)
}

// Every activity may nest inside another activity (via `children`) or
// sit at the top level of a process.
export const Task: Template<w.ITask> = (props) => {
  return new ExprNode(w.Task, props, allowedAsTopLevelElement("children"))
}

export const Sequence: Template<w.ISequence> = (props) => {
  return new ExprNode(w.Sequence, props, allowedAsTopLevelElement("children"))
}

export const Parallel: Template<w.IParallel> = (props) => {
  return new ExprNode(w.Parallel, props, allowedAsTopLevelElement("children"))
}

export const SubProcess: Template<w.ISubProcess> = (props) => {
  return new ExprNode(w.SubProcess, props, allowedAsTopLevelElement("children"))
}
