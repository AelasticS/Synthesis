import * as w from "./workflow.meta.model.type.js";
import { defaultConnectionInfo, ExprNode, } from "@aelastics/synthesis/jsx";
export const WorkflowModel = (props) => {
    return new ExprNode(w.WorkflowModel, props, undefined);
};
// Model-level vocabulary: declared once, referenced by name from
// interfaces (inputs/outputs) and documents.
export const DocumentType = (props) => {
    return new ExprNode(w.DocumentType, props, "documentTypes");
};
// An activity connects into the first containment its parent declares:
// an operator's children when nested, a process body's steps, the
// model's definitions at top level.
const activityConnection = defaultConnectionInfo(["children", "steps", "definitions"]);
export const Task = (props) => {
    return new ExprNode(w.Task, props, activityConnection);
};
export const Process = (props) => {
    return new ExprNode(w.Process, props, activityConnection);
};
// Operators and invocations are steps only: an operator's children
// when nested, a process body's steps otherwise.
const stepConnection = defaultConnectionInfo(["children", "steps"]);
export const Sequence = (props) => {
    return new ExprNode(w.Sequence, props, stepConnection);
};
export const Parallel = (props) => {
    return new ExprNode(w.Parallel, props, stepConnection);
};
export const Choice = (props) => {
    return new ExprNode(w.Choice, props, stepConnection);
};
export const Branch = (props) => {
    return new ExprNode(w.Branch, props, "children");
};
export const Loop = (props) => {
    return new ExprNode(w.Loop, props, stepConnection);
};
// A document nests in the process whose carriers it belongs to.
export const Document = (props) => {
    return new ExprNode(w.Document, props, "documents");
};
// The general invocation tag: the activity prop names the called
// definition, reads/writes bind the enclosing process's documents.
export const Invoke = (props) => {
    return new ExprNode(w.Invocation, props, stepConnection);
};
// Process-call sugar over the SAME Invocation concept (the alias
// idiom): <SubProcess $refByName="X" /> invokes the process definition
// X, so the $refByName names the callee and becomes the activity link
// rather than an element reference.
export const SubProcess = (props) => {
    const { $refByName, ...rest } = props;
    if ($refByName === undefined) {
        return new ExprNode(w.Invocation, props, stepConnection);
    }
    const activity = new ExprNode(w.Process, { $refByName }, undefined);
    return new ExprNode(w.Invocation, { ...rest, activity }, stepConnection);
};
//# sourceMappingURL=workflow-components.js.map