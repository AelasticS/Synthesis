import * as b from "./bpmn.meta.model.type.js";
import { defaultConnectionInfo, ExprNode, } from "@aelastics/synthesis/jsx";
export const Process = (props) => {
    return new ExprNode(b.Process, props, undefined);
};
export const Task = (props) => {
    return new ExprNode(b.Task, props, "nodes");
};
export const StartEvent = (props) => {
    return new ExprNode(b.StartEvent, props, "nodes");
};
export const EndEvent = (props) => {
    return new ExprNode(b.EndEvent, props, "nodes");
};
export const Gateway = (props) => {
    return new ExprNode(b.Gateway, props, "nodes");
};
export const SubProcess = (props) => {
    return new ExprNode(b.SubProcess, props, "nodes");
};
export const Flow = (props) => {
    return new ExprNode(b.Flow, props, "flows");
};
// The abstract supertype, exported for reference use: serialized models
// name flow endpoints as <Node $refByName="..." />, whatever the
// concrete kind of the target. Not meant for creating nodes.
export const Node = (props) => {
    return new ExprNode(b.Node, props, {
        ...defaultConnectionInfo(["from", "to"]),
        isReconnectAllowed: false,
    });
};
// Reference tags for flow endpoints: a flow names its source and target
// nodes as children, whatever their concrete kind.
export const FromNode = (props) => {
    return new ExprNode(b.Node, props, "from");
};
export const ToNode = (props) => {
    return new ExprNode(b.Node, props, "to");
};
//# sourceMappingURL=bpmn-components.js.map