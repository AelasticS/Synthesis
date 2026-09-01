import * as t from "@aelastics/types";
export declare const RelModel_TypeSchema: t.TypeSchema;
export declare const RelSchema: t.Subtype<{}, {
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
export declare const Domain: t.Subtype<{
    type: t.StringType;
    defaultValue: t.OptionalType<t.StringType>;
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
export declare const Column: t.Subtype<{
    type: t.StringType;
    isKey: t.BooleanType;
    ownerTable: t.LinkType;
    isForeignKey: t.BooleanType;
    references: t.OptionalType<t.StringType>;
    isNullable: t.BooleanType;
    isAutoincrement: t.BooleanType;
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
export declare const Table: t.Subtype<{
    columns: t.ArrayType<t.Subtype<{
        type: t.StringType;
        isKey: t.BooleanType;
        ownerTable: t.LinkType;
        isForeignKey: t.BooleanType;
        references: t.OptionalType<t.StringType>;
        isNullable: t.BooleanType;
        isAutoincrement: t.BooleanType;
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
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>>;
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
export type ITable = t.TypeOf<typeof Table>;
export type IRelSchema = t.TypeOf<typeof RelSchema>;
export type IDomain = t.TypeOf<typeof Domain>;
export type IColumn = t.TypeOf<typeof Column>;
