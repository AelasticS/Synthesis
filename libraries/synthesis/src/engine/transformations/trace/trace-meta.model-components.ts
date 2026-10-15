import {CpxTemplate, ExprNode, IStore, Template, WithRefProps} from "../../../jsx-runtime"
import {IModelElement, ModelElement} from "../../../metamodel-core"
import * as tm from "./trace-meta.model"

export type ITraceModelProps = WithRefProps<tm.ITraceModel> & { store?: IStore };

export const TraceModel: CpxTemplate<ITraceModelProps, tm.ITraceModel> = (props) => {
    return new ExprNode(tm.TraceModel, props, undefined)
}

// The outcome record of an executed @E2E rule (source and targets):
// rides into TraceModel.invocations.
export const RuleInvocation: Template<tm.IRuleInvocation> = (props) => {
    return new ExprNode(tm.RuleInvocation, props, "invocations")
}

// An executed function/method without an @E2E decorator (no source or
// targets of its own): rides into TraceModel.invocations.
export const Invocation: Template<tm.IInvocation> = (props) => {
    return new ExprNode(tm.Invocation, props, "invocations")
}

// A target reference inside a RuleInvocation. The explicit tag name makes
// the serialized form read as what it is (the type would serialize it as
// a misleading "ModelElement" tag otherwise).
export const TargetElement: Template<IModelElement> = (props) => {
    return new ExprNode(ModelElement, props, "targets", "TargetElement")
}

export const ReadRecord: Template<tm.IReadRecord> = (props) => {
    return new ExprNode(tm.ReadRecord, props, "reads")
}

// One consultation of a variability point by the invocation that carries
// it: rides into Invocation.resolutions.
export const Resolution: Template<tm.IResolution> = (props) => {
    return new ExprNode(tm.Resolution, props, "resolutions")
}
