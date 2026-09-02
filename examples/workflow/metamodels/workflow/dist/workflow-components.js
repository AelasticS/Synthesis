import * as w from "./workflow.meta.model.type.js";
import { allowedAsTopLevelElement, ExprNode, } from "@aelastics/synthesis/jsx";
export const Process = (props) => {
    return new ExprNode(w.Process, props, undefined);
};
// Every activity may nest inside another activity (via `children`) or
// sit at the top level of a process.
export const Task = (props) => {
    return new ExprNode(w.Task, props, allowedAsTopLevelElement("children"));
};
export const Sequence = (props) => {
    return new ExprNode(w.Sequence, props, allowedAsTopLevelElement("children"));
};
export const Parallel = (props) => {
    return new ExprNode(w.Parallel, props, allowedAsTopLevelElement("children"));
};
export const SubProcess = (props) => {
    return new ExprNode(w.SubProcess, props, allowedAsTopLevelElement("children"));
};
//# sourceMappingURL=workflow-components.js.map