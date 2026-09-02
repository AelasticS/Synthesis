import * as b from "./bpmn.meta.model.type.js"
import {
  CpxTemplate,
  ExprNode,
  IStore,
  Template,
  WithRefProps,
} from "@aelastics/synthesis/jsx"

export type IModelProps = WithRefProps<b.IProcess> & { store?: IStore };

export const Process: CpxTemplate<IModelProps, b.IProcess> = (props) => {
  return new ExprNode(b.Process, props, undefined)
}

export const Task: Template<b.ITask> = (props) => {
  return new ExprNode(b.Task, props, "nodes")
}

export const StartEvent: Template<b.IStartEvent> = (props) => {
  return new ExprNode(b.StartEvent, props, "nodes")
}

export const EndEvent: Template<b.IEndEvent> = (props) => {
  return new ExprNode(b.EndEvent, props, "nodes")
}

export const Gateway: Template<b.IGateway> = (props) => {
  return new ExprNode(b.Gateway, props, "nodes")
}

export const SubProcess: Template<b.ISubProcess> = (props) => {
  return new ExprNode(b.SubProcess, props, "nodes")
}

export const Flow: Template<b.IFlow> = (props) => {
  return new ExprNode(b.Flow, props, "flows")
}
