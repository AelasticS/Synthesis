import * as t from "@aelastics/types";
export declare const RelModel_TypeSchema: t.TypeSchema;
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
export declare const Domain: t.Subtype<{
    type: t.StringType;
    defaultValue: t.OptionalType<t.StringType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Column: t.Subtype<{
    type: t.StringType;
    isKey: t.BooleanType;
    ownerTable: t.LinkType;
    isForeignKey: t.BooleanType;
    references: t.OptionalType<t.StringType>;
    isNullable: t.BooleanType;
    isAutoincrement: t.BooleanType;
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
        ownerTable: t.LinkType;
        isForeignKey: t.BooleanType;
        references: t.OptionalType<t.StringType>;
        isNullable: t.BooleanType;
        isAutoincrement: t.BooleanType;
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
export type ITable = t.TypeOf<typeof Table>;
export type IRelSchema = t.TypeOf<typeof RelSchema>;
export type IDomain = t.TypeOf<typeof Domain>;
export type IColumn = t.TypeOf<typeof Column>;
