import * as w from "./workflow.meta.model.type.js";
import { defaultConnectionInfo, ExprNode, } from "@aelastics/synthesis/jsx";
export const Process = (props) => {
    return new ExprNode(w.Process, props, undefined);
};
// Every activity connects into the first containment its parent
// declares: the process body at the top level, a block's children when
// nested. A second top-level block is refused (the body is single).
const activityConnection = {
    ...defaultConnectionInfo(["body", "children"]),
    isReconnectAllowed: false,
};
export const Task = (props) => {
    return new ExprNode(w.Task, props, activityConnection);
};
export const Sequence = (props) => {
    return new ExprNode(w.Sequence, props, activityConnection);
};
export const Parallel = (props) => {
    return new ExprNode(w.Parallel, props, activityConnection);
};
export const SubProcess = (props) => {
    return new ExprNode(w.SubProcess, props, activityConnection);
};
//# sourceMappingURL=workflow-components.js.map