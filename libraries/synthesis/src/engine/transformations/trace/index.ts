// Pure trace metamodel + JSX templates.
//
// The metamodel and the JSX templates export symbols with the same names
// (Invocation, RuleInvocation, Resolution, TraceModel, ReadRecord): the
// former are the types (t.subtype), the latter the JSX templates that
// render to them. The types are re-exported under a "Type" suffix to avoid
// the collision.

export {
    TraceModel_TypeSchema,
    Invocation as InvocationType,
    RuleInvocation as RuleInvocationType,
    Resolution as ResolutionType,
    TraceModel as TraceModelType,
    ReadRecord as ReadRecordType,
} from "./trace-meta.model"

export type {
    ITraceModel,
    IRuleInvocation,
    IInvocation,
    IResolution,
    IReadRecord,
} from "./trace-meta.model"

export {
    RuleInvocation,
    TraceModel,
    TargetElement,
    ReadRecord,
    Invocation,
    Resolution,
} from "./trace-meta.model-components"

export type {
    ITraceModelProps,
} from "./trace-meta.model-components"
