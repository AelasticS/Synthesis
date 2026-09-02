import * as b from "./bpmn.meta.model.type.js";
import { ExprNode, } from "@aelastics/synthesis/jsx";
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
//# sourceMappingURL=bpmn-components.js.map