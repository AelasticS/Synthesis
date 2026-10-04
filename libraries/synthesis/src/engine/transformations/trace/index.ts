// Pure trace metamodel + JSX templates.
//
// Both files export symbols named "TraceEntry" and "TraceModel" — the former
// is the metamodel (t.subtype), the latter is the JSX template that renders
// to it. We re-export them via namespace aliases to avoid the collision.

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
} from "./trace-meta.model-components"

export type {
    ITraceModelProps,
} from "./trace-meta.model-components"
