/*
 * Simplified graph-based BPMN metamodel: a process is nodes connected by
 * sequence flows. Nodes are tasks, gateways, events, and sub-processes
 * (which carry their own nodes and flows). A gateway's `kind` is
 * "parallel" or "exclusive"; whether it splits or joins is determined by
 * its flows, as in BPMN. Exclusive gateways are part of the metamodel
 * although the v1 workflow-to-bpmn transformation emits only parallel
 * ones, because the block-structured source has no conditional construct
 * yet.
 */
import * as t from "@aelastics/types";
import { ModelElement, Model } from "@aelastics/synthesis/metamodel";
export const Bpmn_TypeSchema = t.schema("BpmnSchema");
export const Node = t.subtype(ModelElement, {}, "Node", Bpmn_TypeSchema);
export const Process = t.subtype(Model, {
    nodes: t.arrayOf(t.link(Bpmn_TypeSchema, "Node")),
    flows: t.arrayOf(t.link(Bpmn_TypeSchema, "Flow")),
}, "Process", Bpmn_TypeSchema);
export const Task = t.subtype(Node, {}, "Task", Bpmn_TypeSchema);
export const StartEvent = t.subtype(Node, {}, "StartEvent", Bpmn_TypeSchema);
export const EndEvent = t.subtype(Node, {}, "EndEvent", Bpmn_TypeSchema);
export const Gateway = t.subtype(Node, {
    // "parallel" or "exclusive"
    kind: t.string,
}, "Gateway", Bpmn_TypeSchema);
export const SubProcess = t.subtype(Node, {
    nodes: t.arrayOf(t.link(Bpmn_TypeSchema, "Node")),
    flows: t.arrayOf(t.link(Bpmn_TypeSchema, "Flow")),
}, "SubProcess", Bpmn_TypeSchema);
export const Flow = t.subtype(ModelElement, {
    from: t.link(Bpmn_TypeSchema, "Node"),
    to: t.link(Bpmn_TypeSchema, "Node"),
    // Optional guard label, meaningful on flows out of an exclusive
    // gateway.
    guard: t.optional(t.string),
}, "Flow", Bpmn_TypeSchema);
//# sourceMappingURL=bpmn.meta.model.type.js.map