import { CpxTemplate, ExprNode, IStore, Template, WithRefProps } from "../../../jsx-runtime"
import * as tm from "./trace-meta.model"

export type ITraceModelProps = WithRefProps<tm.ITraceModel> & { store?: IStore };

export const TraceModel: CpxTemplate<ITraceModelProps, tm.ITraceModel> = (props) => {
  return new ExprNode(tm.TraceModel, props, undefined)
}

export const TraceEntry: Template<tm.ITraceEntry> = (props) => {
  return new ExprNode(tm.TraceEntry, props, "traceEntries")
}

// A target reference inside an entry. The explicit tag name makes the
// serialized form read as what it is (the type would serialize it as a
// misleading "TraceEntry" tag otherwise).
export const TargetElement: Template<tm.ITraceEntry> = (props) => {
  return new ExprNode(tm.TraceEntry, props, "targets", "TargetElement")
}

export const ReadRecord: Template<tm.IReadRecord> = (props) => {
  return new ExprNode(tm.ReadRecord, props, "reads")
}
