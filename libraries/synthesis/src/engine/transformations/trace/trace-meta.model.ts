import * as t from "@aelastics/types"
import {Model, ModelElement} from "../../../metamodel-core"
import {
    Choice,
    ConfigurationModel,
} from "../../../decision-framework/decisions/3.configuration-model/configuration-meta.model";


export const TraceModel_TypeSchema = t.schema("TraceModel_TypeSchema")

// Reserved for incremental transformation (see
// design/synchronizing-transformations/): one dependency record of an
// invocation: an element (optionally narrowed to a property), a
// produced invocation consulted via resolveTarget, or a configuration issue.
// Unpopulated in v1; declared now so dependency data lands later
// without a metamodel migration.
export const ReadRecord = t.subtype(
    ModelElement,
    {
        element: t.optional(ModelElement),
        property: t.optional(t.string),
        entry: t.optional(t.link(TraceModel_TypeSchema, "Invocation")),
        issue: t.optional(t.string),
    },
    "ReadRecord",
    TraceModel_TypeSchema,
)

// One consultation of a variability point (@VarPoint): `choices` are the
// configuration choices for the issue in scope for the invocation's
// element, including those whose option was not executed (its condition
// was not met); `byDefault` is true when no condition was met and the
// @Default option ran. The executed option is the carrying invocation's
// `function`.
export const Resolution = t.subtype(
    ModelElement,
    {
        byDefault: t.boolean,
        choices: t.arrayOf(Choice)
    },
    "Resolution",
    TraceModel_TypeSchema,
)

// One executed function call. Calls are traced where decorators intercept
// them: an @E2E rule is a RuleInvocation; an option method (@VarOption,
// @SpecOption) executed outside any @E2E rule is a plain Invocation.
// `function` names the concrete method that ran (a dispatched option
// method for specialization and variability points; how dispatch routed
// there is not recorded, the name is the record). `parent` is the
// invocation that was executing when this one began (absent at top
// level, e.g. a call made directly from main()). `resolutions` are the
// variability points consulted by the option this invocation executed.
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

// The outcome record of an executed @E2E rule: the source element it was
// applied to and the target elements it produced. Identity is
// (function, source element), stable across re-runs of the same input;
// repeated executions of the same pair are disambiguated by name.
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
