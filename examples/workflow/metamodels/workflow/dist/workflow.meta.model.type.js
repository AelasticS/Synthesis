/*
 * Block-structured workflow metamodel: a workflow model is a process
 * tree. Definitions and invocations are separate concepts: DocumentType
 * and Activity definitions (Task, Process) live at model level, a
 * process body invokes them through Invocation steps with their own
 * occurrence identity, and an inline Task or Process in a body is an
 * anonymous single-use definition fused with its sole occurrence. The
 * operators (Sequence, Parallel, Choice, Loop) complete the classical
 * structured control-flow patterns. There are no edges here; the graph
 * view is what the workflow-to-bpmn transformation produces.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel";
export const Workflow_TypeSchema = t.schema("WorkflowSchema");
// The model root carries the model-level vocabulary: document types
// and activity definitions.
export const WorkflowModel = t.subtype(Model, {
    documentTypes: t.arrayOf(t.link(Workflow_TypeSchema, "DocumentType")),
    definitions: t.arrayOf(t.link(Workflow_TypeSchema, "Activity")),
}, "WorkflowModel", Workflow_TypeSchema);
// A named kind of document: what activity interfaces declare and
// documents are typed by.
export const DocumentType = t.subtype(ModelElement, {}, "DocumentType", Workflow_TypeSchema);
// The unit of a process body: an operator, an invocation, or an inline
// activity.
export const Step = t.subtype(ModelElement, {}, "Step", Workflow_TypeSchema);
export const Sequence = t.subtype(Step, {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
}, "Sequence", Workflow_TypeSchema);
export const Parallel = t.subtype(Step, {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
}, "Parallel", Workflow_TypeSchema);
// A choice's children are its branches; the declared constraints below
// require at least one branch and admit at most one guardless branch
// (the else).
export const Choice = t.subtype(Step, {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Branch")),
}, "Choice", Workflow_TypeSchema);
// A branch's children are an implicit sequence; a guardless branch is
// the else.
export const Branch = t.subtype(Step, {
    guard: t.optional(t.string),
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
}, "Branch", Workflow_TypeSchema);
// One loop concept; the body is an implicit sequence. kind is "while"
// (the test precedes the body) or "repeatUntil" (the body runs before
// the test). The guard is type-level optional so an unfinished model
// renders; the declared constraint below requires it.
export const Loop = t.subtype(Step, {
    kind: t.string,
    guard: t.optional(t.string),
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
}, "Loop", Workflow_TypeSchema);
// An activity definition: the performer and the document interface
// (inputs/outputs name the DocumentTypes the activity works over). An
// Activity IS a Step so that inline single-use authoring works.
export const Activity = t.subtype(Step, {
    performer: t.optional(t.string),
    inputs: t.arrayOf(t.link(Workflow_TypeSchema, "DocumentType")),
    outputs: t.arrayOf(t.link(Workflow_TypeSchema, "DocumentType")),
}, "Activity", Workflow_TypeSchema);
export const Task = t.subtype(Activity, {}, "Task", Workflow_TypeSchema);
// A process's steps are an implicit sequence; its documents are the
// concrete carriers invocations bind.
export const Process = t.subtype(Activity, {
    steps: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
    documents: t.arrayOf(t.link(Workflow_TypeSchema, "Document")),
}, "Process", Workflow_TypeSchema);
// A process scopes the names of its steps and documents: inline names
// and occurrence names are per process.
declareNamespace(Process);
// A concrete carrier typed by a DocumentType. The link is filled at
// creation from a prop; type-level optional because the store
// auto-initializes mandatory object properties, which would occupy the
// slot (the Flow.from/to idiom); the declared constraint below
// requires it.
export const Document = t.subtype(ModelElement, {
    documentType: t.optional(t.link(Workflow_TypeSchema, "DocumentType")),
}, "Document", Workflow_TypeSchema);
// An occurrence of a definition: the activity link names what is
// called (type-level optional, the same idiom as Document.documentType),
// the optional occurrence name defaults to the definition's, the
// optional performer overrides the called definition's (as in BPMN,
// where a call activity carries its own resource assignment), and
// reads/writes bind the enclosing process's documents.
export const Invocation = t.subtype(Step, {
    performer: t.optional(t.string),
    activity: t.optional(t.link(Workflow_TypeSchema, "Activity")),
    reads: t.arrayOf(t.link(Workflow_TypeSchema, "Document")),
    writes: t.arrayOf(t.link(Workflow_TypeSchema, "Document")),
}, "Invocation", Workflow_TypeSchema);
// ── declared constraints ─────────────────────────────────────────────
// Declared on the types, run only in a validation traversal: while a
// model renders it is legitimately incomplete (an operator's children
// grow one element at a time), so these are judgments about the
// finished model, never authoring-time checks.
// Every bound document's type must be among the declared ones. A
// document without a type is skipped here: its own validator reports
// the missing type.
const documentsConform = (docs, declared) => {
    const allowed = (declared ?? []);
    for (const d of (docs ?? [])) {
        const docType = d?.documentType;
        if (docType === undefined || docType === null)
            continue;
        if (!allowed.includes(docType))
            return false;
    }
    return true;
};
Invocation.addValidator({
    predicate: (v) => v.activity !== undefined && v.activity !== null,
    message: (_v, label) => `${label ?? "Invocation"}: an invocation names the definition it calls`,
});
Invocation.addValidator({
    predicate: (v) => v.activity === undefined || v.activity === null
        || documentsConform(v.reads, v.activity.inputs),
    message: (_v, label) => `${label ?? "Invocation"}: a read document's type must be among the called definition's declared inputs`,
});
Invocation.addValidator({
    predicate: (v) => v.activity === undefined || v.activity === null
        || documentsConform(v.writes, v.activity.outputs),
    message: (_v, label) => `${label ?? "Invocation"}: a written document's type must be among the called definition's declared outputs`,
});
// An invocation calls into the model-level vocabulary: the called
// definition must be among the model's definitions, never an inline
// activity sitting in a process body or operator (an inline activity
// is fused with its sole occurrence and is not callable). The
// navigation runs through parentModel, the containment inverse the
// core metamodel declares against Model.elements; membership in the
// model's definitions is what makes a definition model-level. An
// invocation without a reachable activity or model is skipped: the
// first validator reports the missing activity.
Invocation.addValidator({
    predicate: (v) => {
        const called = v.activity;
        if (called === undefined || called === null)
            return true;
        const model = v.parentModel;
        if (model === undefined || model === null)
            return true;
        return (model.definitions ?? []).includes(called);
    },
    message: (_v, label) => `${label ?? "Invocation"}: an invocation calls a model-level definition, not an inline step`,
});
Choice.addValidator({
    predicate: (v) => (v.children?.length ?? 0) >= 1,
    message: (_v, label) => `${label ?? "Choice"}: a choice offers at least one branch`,
});
Choice.addValidator({
    predicate: (v) => (v.children ?? []).filter((b) => (b.guard ?? "") === "").length <= 1,
    message: (_v, label) => `${label ?? "Choice"}: at most one branch may omit its guard (the else branch)`,
});
Loop.addValidator({
    predicate: (v) => (v.guard ?? "") !== "",
    message: (_v, label) => `${label ?? "Loop"}: a loop states the guard its kind tests`,
});
Document.addValidator({
    predicate: (v) => v.documentType !== undefined && v.documentType !== null,
    message: (_v, label) => `${label ?? "Document"}: a document is typed by a document type`,
});
//# sourceMappingURL=workflow.meta.model.type.js.map