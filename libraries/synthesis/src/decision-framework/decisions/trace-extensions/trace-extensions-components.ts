import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from "../../../jsx-runtime"
import * as tm from "./trace-extensions.meta.model"

export type IDecisionAwareTraceModelProps = WithRefProps<tm.IDecisionAwareTraceModel> & { store?: IStore };

export const DecisionAwareTraceModel: CpxTemplate<IDecisionAwareTraceModelProps, tm.IDecisionAwareTraceModel> = (props) => {
  return new ExprNode(tm.DecisionAwareTraceModel, props, undefined)
}

export const VarPointTraceEntry: Template<tm.IVarPointTraceEntry> = (props) => {
  return new ExprNode(tm.VariabilityPointTraceEntry, props, "traceEntries")
}

export const SpecPointTraceEntry: Template<tm.ISpecPointTraceEntry> = (props) => {
  return new ExprNode(tm.SpecializationPointTraceEntry, props, "traceEntries")
}
