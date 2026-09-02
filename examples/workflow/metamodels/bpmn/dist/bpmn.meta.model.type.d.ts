import * as t from "@aelastics/types";
export declare const Bpmn_TypeSchema: t.TypeSchema;
export declare const Node: t.Subtype<{}, {
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
    nodes: t.ArrayType<t.LinkType>;
    flows: t.ArrayType<t.LinkType>;
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
export declare const StartEvent: t.Subtype<{}, {
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
export declare const EndEvent: t.Subtype<{}, {
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
export declare const Gateway: t.Subtype<{
    kind: t.StringType;
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
export declare const SubProcess: t.Subtype<{
    nodes: t.ArrayType<t.LinkType>;
    flows: t.ArrayType<t.LinkType>;
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
export declare const Flow: t.Subtype<{
    from: t.LinkType;
    to: t.LinkType;
    guard: t.OptionalType<t.StringType>;
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
export type IProcess = t.TypeOf<typeof Process>;
export type INode = t.TypeOf<typeof Node>;
export type ITask = t.TypeOf<typeof Task>;
export type IStartEvent = t.TypeOf<typeof StartEvent>;
export type IEndEvent = t.TypeOf<typeof EndEvent>;
export type IGateway = t.TypeOf<typeof Gateway>;
export type ISubProcess = t.TypeOf<typeof SubProcess>;
export type IFlow = t.TypeOf<typeof Flow>;
