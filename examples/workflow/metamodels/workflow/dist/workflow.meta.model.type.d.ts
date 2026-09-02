import * as t from "@aelastics/types";
export declare const Workflow_TypeSchema: t.TypeSchema;
export declare const Activity: t.Subtype<{
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
}, {
    path: t.OptionalType<t.StringType>;
    label: t.StringType;
    content: t.StringType;
    parentModel: t.OptionalType<t.LinkType>;
    namespace: t.OptionalType<t.LinkType>;
} & {
    id: t.StringType;
    name: t.StringType;
    description: t.StringType;
    ownerRepository: t.StringType;
    ownerPackage: t.StringType;
    category: t.StringType;
    objectClassification: t.StringType;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Process: t.Subtype<{
    body: t.OptionalType<t.LinkType>;
}, {
    MDA_level: t.OptionalType<t.StringType>;
    diagrams: t.ArrayType<t.Subtype<{
        text: t.StringType;
        nodeDataArray: t.ArrayType<t.Subtype<{
            location: t.StringType;
            text: t.StringType;
            width: t.NumberType;
            height: t.NumberType;
            category: t.StringType;
            font: t.OptionalType<t.StringType>;
            isUnderline: t.BooleanType;
            keys: t.ArrayType<t.ObjectType<{
                name: t.StringType;
                selected: t.BooleanType;
            }, []>>;
            attributes: t.ArrayType<t.ObjectType<{
                name: t.StringType;
                selected: t.BooleanType;
            }, []>>;
        }, {
            id: t.StringType;
            key: t.NumberType;
            modelElementId: t.OptionalType<t.StringType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["id"]>>>;
        hasGrid: t.BooleanType;
        linkDataArray: t.ArrayType<t.Subtype<{
            from: t.NumberType;
            to: t.NumberType;
            category: t.StringType;
            fromCardinality: t.StringType;
            toCardinality: t.StringType;
            fromDirection: t.StringType;
            toDirection: t.StringType;
        }, {
            id: t.StringType;
            key: t.NumberType;
            modelElementId: t.OptionalType<t.StringType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["id"]>>>;
    }, {
        id: t.StringType;
        key: t.NumberType;
        modelElementId: t.OptionalType<t.StringType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["id"]>>>;
} & {
    elements: t.ArrayType<t.Subtype<{
        path: t.OptionalType<t.StringType>;
        label: t.StringType;
        content: t.StringType;
        parentModel: t.OptionalType<t.LinkType>;
        namespace: t.OptionalType<t.LinkType>;
    }, {
        id: t.StringType;
        name: t.StringType;
        description: t.StringType;
        ownerRepository: t.StringType;
        ownerPackage: t.StringType;
        category: t.StringType;
        objectClassification: t.StringType;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
} & {
    path: t.OptionalType<t.StringType>;
    label: t.StringType;
    content: t.StringType;
    parentModel: t.OptionalType<t.LinkType>;
    namespace: t.OptionalType<t.LinkType>;
} & {
    id: t.StringType;
    name: t.StringType;
    description: t.StringType;
    ownerRepository: t.StringType;
    ownerPackage: t.StringType;
    category: t.StringType;
    objectClassification: t.StringType;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Task: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    path: t.OptionalType<t.StringType>;
    label: t.StringType;
    content: t.StringType;
    parentModel: t.OptionalType<t.LinkType>;
    namespace: t.OptionalType<t.LinkType>;
} & {
    id: t.StringType;
    name: t.StringType;
    description: t.StringType;
    ownerRepository: t.StringType;
    ownerPackage: t.StringType;
    category: t.StringType;
    objectClassification: t.StringType;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Sequence: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    path: t.OptionalType<t.StringType>;
    label: t.StringType;
    content: t.StringType;
    parentModel: t.OptionalType<t.LinkType>;
    namespace: t.OptionalType<t.LinkType>;
} & {
    id: t.StringType;
    name: t.StringType;
    description: t.StringType;
    ownerRepository: t.StringType;
    ownerPackage: t.StringType;
    category: t.StringType;
    objectClassification: t.StringType;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Parallel: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    path: t.OptionalType<t.StringType>;
    label: t.StringType;
    content: t.StringType;
    parentModel: t.OptionalType<t.LinkType>;
    namespace: t.OptionalType<t.LinkType>;
} & {
    id: t.StringType;
    name: t.StringType;
    description: t.StringType;
    ownerRepository: t.StringType;
    ownerPackage: t.StringType;
    category: t.StringType;
    objectClassification: t.StringType;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const SubProcess: t.Subtype<{}, {
    children: t.ArrayType<t.LinkType>;
    parent: t.OptionalType<t.LinkType>;
} & {
    path: t.OptionalType<t.StringType>;
    label: t.StringType;
    content: t.StringType;
    parentModel: t.OptionalType<t.LinkType>;
    namespace: t.OptionalType<t.LinkType>;
} & {
    id: t.StringType;
    name: t.StringType;
    description: t.StringType;
    ownerRepository: t.StringType;
    ownerPackage: t.StringType;
    category: t.StringType;
    objectClassification: t.StringType;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export type IProcess = t.TypeOf<typeof Process>;
export type IActivity = t.TypeOf<typeof Activity>;
export type ITask = t.TypeOf<typeof Task>;
export type ISequence = t.TypeOf<typeof Sequence>;
export type IParallel = t.TypeOf<typeof Parallel>;
export type ISubProcess = t.TypeOf<typeof SubProcess>;
