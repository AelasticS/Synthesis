import * as t from "@aelastics/types"
import {Model, ModelElement} from "../../../metamodel-core"
import {
    Choice,
    ConfigurationModel,
} from "../../../decision-framework/decisions/3.configuration-model/configuration-meta.model";


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

export const Resolution = t.subtype(
    ModelElement,
    {
        byDefault: t.boolean,
        choices: t.arrayOf(Choice)
    },
    "Resolution",
    TraceModel_TypeSchema,
)

// One entry per executed rule: the outcome record. `function` names the
// concrete method that produced the targets (a dispatched option method
// for specialization and variability points; how dispatch routed there
// is not recorded, the name is the record). Entry identity is
// (rule, source element), stable across re-runs of the same input;
// repeated executions of the same pair are disambiguated by name.
export const Invocation = t.subtype(
    ModelElement,
    {
        function: t.string,
        reads: t.optional(t.arrayOf(ReadRecord)),
        parent: t.optional(t.link(TraceModel_TypeSchema, "Invocation")),
        resolutions: t.optional(t.arrayOf(Resolution)),
    },
    "Invocation",
    TraceModel_TypeSchema,
)

export const RuleInvocation = t.subtype(
    Invocation,
    {
        source: ModelElement,
        targets: t.arrayOf(ModelElement),
    },
    "RuleInvocation",
    TraceModel_TypeSchema,
)


export const TraceModel = t.subtype(
    Model,
    {
        source: Model,
        targets: t.arrayOf(Model),
        invocations: t.arrayOf(Invocation),
        timestamp: t.string,
        // Version slots for incremental transformation: which transformation
        // produced this trace, against which source model version. Optional;
        // populated by hosts that version their artifacts.
        transformation: t.optional(t.string),
        transformationVersion: t.optional(t.string),
        sourceVersion: t.optional(t.string),
        config: t.optional(ConfigurationModel),
    },
    "TraceModel",
    TraceModel_TypeSchema,
)

export type ITraceModel = t.TypeOf<typeof TraceModel>;
export type IReadRecord = t.TypeOf<typeof ReadRecord>;
export type IResolution = t.TypeOf<typeof Resolution>;
export type IInvocation = t.TypeOf<typeof Invocation>;
export type IRuleInvocation = t.TypeOf<typeof RuleInvocation>;
