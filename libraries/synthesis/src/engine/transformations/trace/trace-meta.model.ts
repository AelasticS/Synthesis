import * as t from "@aelastics/types"
import { Model, ModelElement } from "../../../metamodel-core"

export const TraceModel_TypeSchema = t.schema("TraceModel_TypeSchema")

// Reserved for incremental transformation (see
// design/synchronizing-transformations/): one dependency record of a
// rule execution, an element (optionally narrowed to a property), a
// produced entry consulted via resolveTarget, or a configuration issue.
// Unpopulated in v1; declared now so dependency data lands later
// without a metamodel migration.
export const ReadRecord = t.subtype(
  ModelElement,
  {
    element: t.optional(ModelElement),
    property: t.optional(t.string),
    entry: t.optional(t.link(TraceModel_TypeSchema, "TraceEntry")),
    issue: t.optional(t.string),
  },
  "ReadRecord",
  TraceModel_TypeSchema,
)

// One entry per executed rule: the outcome record. `rule` names the
// concrete method that produced the targets (a dispatched option method
// for specialization and variability points; how dispatch routed there
// is not recorded, the name is the record). Entry identity is
// (rule, source element), stable across re-runs of the same input;
// repeated executions of the same pair are disambiguated by name.
export const TraceEntry = t.subtype(
  ModelElement,
  {
    rule: t.string,
    source: ModelElement,
    targets: t.arrayOf(ModelElement),
    reads: t.arrayOf(ReadRecord),
    parentRule: t.optional(t.link(TraceModel_TypeSchema, "TraceEntry")),
  },
  "TraceEntry",
  TraceModel_TypeSchema,
)

export const TraceModel = t.subtype(
  Model,
  {
    source: Model,
    targets: t.arrayOf(Model),
    traceEntries: t.arrayOf(TraceEntry),
    timestamp: t.string,
    // Version slots for incremental transformation: which transformation
    // produced this trace, against which source model version. Optional;
    // populated by hosts that version their artifacts.
    transformation: t.optional(t.string),
    transformationVersion: t.optional(t.string),
    sourceVersion: t.optional(t.string),
  },
  "TraceModel",
  TraceModel_TypeSchema,
)

export type ITraceModel = t.TypeOf<typeof TraceModel>;
export type ITraceEntry = t.TypeOf<typeof TraceEntry>;
export type IReadRecord = t.TypeOf<typeof ReadRecord>;
