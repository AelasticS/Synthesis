import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from "@synthesis/jsx-runtime"
import * as tm from "./trace-meta.model"

export type ITraceModelProps = WithRefProps<tm.ITraceModel> & { store?: IStore };

export const TraceModel: CpxTemplate<ITraceModelProps, tm.ITraceModel> = (props) => {
  return new ExprNode(tm.TraceModel, props, undefined)
}

export const TraceEntry: Template<tm.ITraceEntry> = (props) => {
  return new ExprNode(tm.TraceEntry, props, "traceEntries")
}

export const TargetElement: Template<tm.ITraceEntry> = (props) => {
  return new ExprNode(tm.TraceEntry, props, "targets")
}
