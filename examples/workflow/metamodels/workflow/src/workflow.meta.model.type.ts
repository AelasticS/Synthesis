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
import * as t from "@aelastics/types"

import { ModelElement, Model, declareNamespace } from "@aelastics/synthesis/metamodel"

export const Workflow_TypeSchema = t.schema("WorkflowSchema")

// The model root carries the model-level vocabulary: document types
// and activity definitions.
export const WorkflowModel = t.subtype(
  Model,
  {
    documentTypes: t.arrayOf(t.link(Workflow_TypeSchema, "DocumentType")),
    definitions: t.arrayOf(t.link(Workflow_TypeSchema, "Activity")),
  },
  "WorkflowModel",
  Workflow_TypeSchema
)

// A named kind of document: what activity interfaces declare and
// documents are typed by.
export const DocumentType = t.subtype(ModelElement, {}, "DocumentType", Workflow_TypeSchema)

// The unit of a process body: an operator, an invocation, or an inline
// activity.
export const Step = t.subtype(ModelElement, {}, "Step", Workflow_TypeSchema)

export const Sequence = t.subtype(
  Step,
  {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
  },
  "Sequence",
  Workflow_TypeSchema
)

export const Parallel = t.subtype(
  Step,
  {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
  },
  "Parallel",
  Workflow_TypeSchema
)

// A choice's children are its branches; the declared constraints below
// require at least one branch and admit at most one guardless branch
// (the else).
export const Choice = t.subtype(
  Step,
  {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Branch")),
  },
  "Choice",
  Workflow_TypeSchema
)

// A branch's children are an implicit sequence; a guardless branch is
// the else.
export const Branch = t.subtype(
  Step,
  {
    guard: t.optional(t.string),
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
  },
  "Branch",
  Workflow_TypeSchema
)

// One loop concept; the body is an implicit sequence. kind is "while"
// (the test precedes the body) or "repeatUntil" (the body runs before
// the test). The guard is type-level optional so an unfinished model
// renders; the declared constraint below requires it.
export const Loop = t.subtype(
  Step,
  {
    kind: t.string,
    guard: t.optional(t.string),
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
  },
  "Loop",
  Workflow_TypeSchema
)

// An activity definition: the performer and the document interface
// (inputs/outputs name the DocumentTypes the activity works over). An
// Activity IS a Step so that inline single-use authoring works.
export const Activity = t.subtype(
  Step,
  {
    performer: t.optional(t.string),
    inputs: t.arrayOf(t.link(Workflow_TypeSchema, "DocumentType")),
    outputs: t.arrayOf(t.link(Workflow_TypeSchema, "DocumentType")),
  },
  "Activity",
  Workflow_TypeSchema
)

export const Task = t.subtype(Activity, {}, "Task", Workflow_TypeSchema)

// A process's steps are an implicit sequence; its documents are the
// concrete carriers invocations bind.
export const Process = t.subtype(
  Activity,
  {
    steps: t.arrayOf(t.link(Workflow_TypeSchema, "Step")),
    documents: t.arrayOf(t.link(Workflow_TypeSchema, "Document")),
  },
  "Process",
  Workflow_TypeSchema
)

// A process scopes the names of its steps and documents: inline names
// and occurrence names are per process.
declareNamespace(Process)

// A concrete carrier typed by a DocumentType. The link is filled at
// creation from a prop; type-level optional because the store
// auto-initializes mandatory object properties, which would occupy the
// slot (the Flow.from/to idiom); the declared constraint below
// requires it.
export const Document = t.subtype(
  ModelElement,
  {
    documentType: t.optional(t.link(Workflow_TypeSchema, "DocumentType")),
  },
  "Document",
  Workflow_TypeSchema
)

// An occurrence of a definition: the activity link names what is
// called (type-level optional, the same idiom as Document.documentType),
// the optional occurrence name defaults to the definition's, and
// reads/writes bind the enclosing process's documents.
export const Invocation = t.subtype(
  Step,
  {
    activity: t.optional(t.link(Workflow_TypeSchema, "Activity")),
    reads: t.arrayOf(t.link(Workflow_TypeSchema, "Document")),
    writes: t.arrayOf(t.link(Workflow_TypeSchema, "Document")),
  },
  "Invocation",
  Workflow_TypeSchema
)

export type IWorkflowModel = t.TypeOf<typeof WorkflowModel>
export type IDocumentType = t.TypeOf<typeof DocumentType>
export type IStep = t.TypeOf<typeof Step>
export type ISequence = t.TypeOf<typeof Sequence>
export type IParallel = t.TypeOf<typeof Parallel>
export type IChoice = t.TypeOf<typeof Choice>
export type IBranch = t.TypeOf<typeof Branch>
export type ILoop = t.TypeOf<typeof Loop>
export type IActivity = t.TypeOf<typeof Activity>
export type ITask = t.TypeOf<typeof Task>
export type IProcess = t.TypeOf<typeof Process>
export type IDocument = t.TypeOf<typeof Document>
export type IInvocation = t.TypeOf<typeof Invocation>

// ── declared constraints ─────────────────────────────────────────────
// Declared on the types, run only in a validation traversal: while a
// model renders it is legitimately incomplete (an operator's children
// grow one element at a time), so these are judgments about the
// finished model, never authoring-time checks.

// Every bound document's type must be among the declared ones. A
// document without a type is skipped here: its own validator reports
// the missing type.
const documentsConform = (docs: unknown[] | undefined, declared: unknown[] | undefined): boolean => {
  const allowed = (declared ?? []) as IDocumentType[]
  for (const d of (docs ?? []) as IDocument[]) {
    const docType = d?.documentType as IDocumentType | undefined
    if (docType === undefined || docType === null) continue
    if (!allowed.includes(docType)) return false
  }
  return true
}

Invocation.addValidator({
  predicate: (v: IInvocation) => v.activity !== undefined && v.activity !== null,
  message: (_v: IInvocation, label?: string) =>
    `${label ?? "Invocation"}: an invocation names the definition it calls`,
})
Invocation.addValidator({
  predicate: (v: IInvocation) =>
    v.activity === undefined || v.activity === null
    || documentsConform(v.reads, (v.activity as IActivity).inputs),
  message: (_v: IInvocation, label?: string) =>
    `${label ?? "Invocation"}: a read document's type must be among the called definition's declared inputs`,
})
Invocation.addValidator({
  predicate: (v: IInvocation) =>
    v.activity === undefined || v.activity === null
    || documentsConform(v.writes, (v.activity as IActivity).outputs),
  message: (_v: IInvocation, label?: string) =>
    `${label ?? "Invocation"}: a written document's type must be among the called definition's declared outputs`,
})
Choice.addValidator({
  predicate: (v: IChoice) => (v.children?.length ?? 0) >= 1,
  message: (_v: IChoice, label?: string) =>
    `${label ?? "Choice"}: a choice offers at least one branch`,
})
Choice.addValidator({
  predicate: (v: IChoice) =>
    ((v.children ?? []) as IBranch[]).filter((b) => (b.guard ?? "") === "").length <= 1,
  message: (_v: IChoice, label?: string) =>
    `${label ?? "Choice"}: at most one branch may omit its guard (the else branch)`,
})
Loop.addValidator({
  predicate: (v: ILoop) => (v.guard ?? "") !== "",
  message: (_v: ILoop, label?: string) =>
    `${label ?? "Loop"}: a loop states the guard its kind tests`,
})
Document.addValidator({
  predicate: (v: IDocument) => v.documentType !== undefined && v.documentType !== null,
  message: (_v: IDocument, label?: string) =>
    `${label ?? "Document"}: a document is typed by a document type`,
})
