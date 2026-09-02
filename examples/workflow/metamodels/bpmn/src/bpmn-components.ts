import * as b from "./bpmn.meta.model.type.js"
import {
  CpxTemplate,
  defaultConnectionInfo,
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

// The abstract supertype, exported for reference use: serialized models
// name flow endpoints as <Node $refByName="..." />, whatever the
// concrete kind of the target. Not meant for creating nodes.
export const Node: Template<b.INode> = (props) => {
  return new ExprNode(b.Node, props, {
    ...defaultConnectionInfo(["from", "to"]),
    isReconnectAllowed: false,
  })
}

// Reference tags for flow endpoints: a flow names its source and target
// nodes as children, whatever their concrete kind.
export const FromNode: Template<b.INode> = (props) => {
  return new ExprNode(b.Node, props, "from")
}

export const ToNode: Template<b.INode> = (props) => {
  return new ExprNode(b.Node, props, "to")
}
