import * as t from "@aelastics/types";
export declare const Workflow_TypeSchema: t.TypeSchema;
export declare const Activity: t.Subtype<{
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Process: t.Subtype<{
    body: t.OptionalType<t.LinkType>;
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
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Sequence: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Parallel: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const SubProcess: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export type IProcess = t.TypeOf<typeof Process>;
export type IActivity = t.TypeOf<typeof Activity>;
export type ITask = t.TypeOf<typeof Task>;
export type ISequence = t.TypeOf<typeof Sequence>;
export type IParallel = t.TypeOf<typeof Parallel>;
export type ISubProcess = t.TypeOf<typeof SubProcess>;
