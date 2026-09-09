import * as t from "@aelastics/types";
export declare const Workflow_TypeSchema: t.TypeSchema;
export declare const WorkflowModel: t.Subtype<{
    documents: t.ArrayType<t.LinkType>;
    definitions: t.ArrayType<t.LinkType>;
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
export declare const Document: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Step: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Sequence: t.Subtype<{
    children: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Parallel: t.Subtype<{
    children: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Choice: t.Subtype<{
    children: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Branch: t.Subtype<{
    guard: t.OptionalType<t.StringType>;
    children: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Loop: t.Subtype<{
    kind: t.StringType;
    guard: t.OptionalType<t.StringType>;
    children: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Activity: t.Subtype<{
    performer: t.OptionalType<t.StringType>;
    inputs: t.ArrayType<t.LinkType>;
    outputs: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Task: t.Subtype<{}, {
    performer: t.OptionalType<t.StringType>;
    inputs: t.ArrayType<t.LinkType>;
    outputs: t.ArrayType<t.LinkType>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Process: t.Subtype<{
    steps: t.ArrayType<t.LinkType>;
    dataObjects: t.ArrayType<t.LinkType>;
}, {
    performer: t.OptionalType<t.StringType>;
    inputs: t.ArrayType<t.LinkType>;
    outputs: t.ArrayType<t.LinkType>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const DataObject: t.Subtype<{
    document: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Invocation: t.Subtype<{
    performer: t.OptionalType<t.StringType>;
    activity: t.OptionalType<t.LinkType>;
    reads: t.ArrayType<t.LinkType>;
    writes: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export type IWorkflowModel = t.TypeOf<typeof WorkflowModel>;
export type IDocument = t.TypeOf<typeof Document>;
export type IStep = t.TypeOf<typeof Step>;
export type ISequence = t.TypeOf<typeof Sequence>;
export type IParallel = t.TypeOf<typeof Parallel>;
export type IChoice = t.TypeOf<typeof Choice>;
export type IBranch = t.TypeOf<typeof Branch>;
export type ILoop = t.TypeOf<typeof Loop>;
export type IActivity = t.TypeOf<typeof Activity>;
export type ITask = t.TypeOf<typeof Task>;
export type IProcess = t.TypeOf<typeof Process>;
export type IDataObject = t.TypeOf<typeof DataObject>;
export type IInvocation = t.TypeOf<typeof Invocation>;
