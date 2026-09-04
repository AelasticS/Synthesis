import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from "../../../jsx-runtime"
import * as tm from "./trace-extensions.meta.model"

export type IDecisionAwareTraceModelProps = WithRefProps<tm.IDecisionAwareTraceModel> & { store?: IStore };

export const DecisionAwareTraceModel: CpxTemplate<IDecisionAwareTraceModelProps, tm.IDecisionAwareTraceModel> = (props) => {
  return new ExprNode(tm.DecisionAwareTraceModel, props, undefined)
}

export const DecisionTraceEntry: Template<tm.IDecisionTraceEntry> = (props) => {
  return new ExprNode(tm.DecisionTraceEntry, props, "traceEntries")
}

// Connects into `resolutions` on both carriers: a DecisionTraceEntry
// and the DecisionAwareTraceModel itself declare the property.
export const Resolution: Template<tm.IResolution> = (props) => {
  return new ExprNode(tm.Resolution, props, "resolutions")
}
