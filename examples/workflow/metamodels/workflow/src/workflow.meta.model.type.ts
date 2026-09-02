/*
 * Block-structured workflow metamodel: the domain the documentation's
 * template examples are written in. A process is a tree of activities:
 * tasks, sequences, parallels, and sub-processes (whose body is
 * implicitly sequential). There are no edges here; the graph view is
 * what the workflow-to-bpmn transformation produces.
 */
import * as t from "@aelastics/types"

import { ModelElement, Model } from "@aelastics/synthesis/metamodel"

export const Workflow_TypeSchema = t.schema("WorkflowSchema")

export const Activity = t.subtype(
  ModelElement,
  {
    children: t.arrayOf(t.link(Workflow_TypeSchema, "Activity")),
    parent: t.optional(t.link(Workflow_TypeSchema, "Activity")),
  },
  "Activity",
  Workflow_TypeSchema
)

// The process owns exactly one top-level block. Optional at the type
// level because the process is created before its body connects (the
// store auto-initializes mandatory object properties, which would
// occupy the slot); semantically mandatory, enforced by consumers.
export const Process = t.subtype(
  Model,
  {
    body: t.optional(t.link(Workflow_TypeSchema, "Activity")),
  },
  "Process",
  Workflow_TypeSchema
)

export const Task = t.subtype(Activity, {}, "Task", Workflow_TypeSchema)

export const Sequence = t.subtype(Activity, {}, "Sequence", Workflow_TypeSchema)

export const Parallel = t.subtype(Activity, {}, "Parallel", Workflow_TypeSchema)

// A sub-process contains its own activities; the body is implicitly a
// sequence.
export const SubProcess = t.subtype(Activity, {}, "SubProcess", Workflow_TypeSchema)

t.inverseProps(Activity, "children", Activity, "parent")

export type IProcess = t.TypeOf<typeof Process>
export type IActivity = t.TypeOf<typeof Activity>
export type ITask = t.TypeOf<typeof Task>
export type ISequence = t.TypeOf<typeof Sequence>
export type IParallel = t.TypeOf<typeof Parallel>
export type ISubProcess = t.TypeOf<typeof SubProcess>
