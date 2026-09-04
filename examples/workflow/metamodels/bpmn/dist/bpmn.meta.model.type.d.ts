import * as t from "@aelastics/types";
export declare const Bpmn_TypeSchema: t.TypeSchema;
export declare const Node: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Process: t.Subtype<{
    nodes: t.ArrayType<t.LinkType>;
    flows: t.ArrayType<t.LinkType>;
}, {
    elements: t.ArrayType<t.EntityType<{
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, readonly ["name"]>>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Task: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const StartEvent: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const EndEvent: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Gateway: t.Subtype<{
    kind: t.StringType;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const SubProcess: t.Subtype<{
    nodes: t.ArrayType<t.LinkType>;
    flows: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Flow: t.Subtype<{
    from: t.OptionalType<t.LinkType>;
    to: t.OptionalType<t.LinkType>;
    guard: t.OptionalType<t.StringType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export type IProcess = t.TypeOf<typeof Process>;
export type INode = t.TypeOf<typeof Node>;
export type ITask = t.TypeOf<typeof Task>;
export type IStartEvent = t.TypeOf<typeof StartEvent>;
export type IEndEvent = t.TypeOf<typeof EndEvent>;
export type IGateway = t.TypeOf<typeof Gateway>;
export type ISubProcess = t.TypeOf<typeof SubProcess>;
export type IFlow = t.TypeOf<typeof Flow>;
