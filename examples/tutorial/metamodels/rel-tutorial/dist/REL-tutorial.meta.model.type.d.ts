import * as t from "@aelastics/types";
export declare const RelTutorial_TypeSchema: t.TypeSchema;
export declare const RelSchema: t.Subtype<{}, {
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
export declare const Column: t.Subtype<{
    type: t.StringType;
    isKey: t.BooleanType;
    isNullable: t.BooleanType;
    isAutoincrement: t.BooleanType;
    references: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Table: t.Subtype<{
    columns: t.ArrayType<t.Subtype<{
        type: t.StringType;
        isKey: t.BooleanType;
        isNullable: t.BooleanType;
        isAutoincrement: t.BooleanType;
        references: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export type IRelSchema = t.TypeOf<typeof RelSchema>;
export type IColumn = t.TypeOf<typeof Column>;
export type ITable = t.TypeOf<typeof Table>;
