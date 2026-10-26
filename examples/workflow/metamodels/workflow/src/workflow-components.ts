import * as w from "./workflow.meta.model.type.js"
import {
  CpxTemplate,
  defaultConnectionInfo,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<w.IWorkflowModel> & { store?: IStore };

export const WorkflowModel: CpxTemplate<IModelProps, w.IWorkflowModel> = (props) => {
  return new ExprNode(w.WorkflowModel, props, undefined)
}

// Model-level vocabulary: declared once, referenced by name from
// interfaces (inputs/outputs) and data objects.
export const Document: Template<w.IDocument> = (props) => {
  return new ExprNode(w.Document, props, "documents")
}

// An activity connects into the first containment its parent declares:
// an operator's children when nested, a process body's steps, the
// model's definitions at top level.
const activityConnection = defaultConnectionInfo(["children", "steps", "definitions"])

export const Task: Template<w.ITask> = (props) => {
  return new ExprNode(w.Task, props, activityConnection)
}

export const Process: Template<w.IProcess> = (props) => {
  return new ExprNode(w.Process, props, activityConnection)
}

// Operators and invocations are steps only: an operator's children
// when nested, a process body's steps otherwise.
const stepConnection = defaultConnectionInfo(["children", "steps"])

// The abstract step, for a base skeleton at a specialization point: the
// option's concrete step is merged into it and attaches the same way.
export const Step: Template<w.IStep> = (props) => {
  return new ExprNode(w.Step, props, stepConnection)
}

export const Sequence: Template<w.ISequence> = (props) => {
  return new ExprNode(w.Sequence, props, stepConnection)
}

export const Parallel: Template<w.IParallel> = (props) => {
  return new ExprNode(w.Parallel, props, stepConnection)
}

export const Choice: Template<w.IChoice> = (props) => {
  return new ExprNode(w.Choice, props, stepConnection)
}

export const Branch: Template<w.IBranch> = (props) => {
  return new ExprNode(w.Branch, props, "children")
}

export const Loop: Template<w.ILoop> = (props) => {
  return new ExprNode(w.Loop, props, stepConnection)
}

// A data object nests in the process whose carriers it belongs to.
export const DataObject: Template<w.IDataObject> = (props) => {
  return new ExprNode(w.DataObject, props, "dataObjects")
}

// The general invocation tag: the activity prop names the called
// definition, reads/writes bind the enclosing process's data objects.
export const Invoke: Template<w.IInvocation> = (props) => {
  return new ExprNode(w.Invocation, props, stepConnection)
}

// Process-call sugar over the SAME Invocation concept (the alias
// idiom): <SubProcess $refByName="X" /> invokes the process definition
// X, so the $refByName names the callee and becomes the activity link
// rather than an element reference.
export const SubProcess: Template<w.IInvocation> = (props) => {
  const { $refByName, ...rest } = props as { $refByName?: string } & Record<string, unknown>
  if ($refByName === undefined) {
    return new ExprNode(w.Invocation, props, stepConnection)
  }
  const activity = new ExprNode(w.Process, { $refByName } as WithRefProps<w.IProcess>, undefined)
  return new ExprNode(w.Invocation, { ...rest, activity } as WithRefProps<w.IInvocation>, stepConnection)
}
