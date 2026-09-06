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
export declare const ReferentialAction: t.StringType;
export declare const Domain: t.Subtype<{
    type: t.StringType;
    check: t.OptionalType<t.StringType>;
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
    isNullable: t.BooleanType;
    isAutoincrement: t.BooleanType;
    domain: t.OptionalType<t.LinkType>;
    ownerTable: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const ForeignKeyColumn: t.Subtype<{
    fkColumn: t.OptionalType<t.LinkType>;
    refColumn: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const ForeignKey: t.Subtype<{
    fkColumns: t.ArrayType<t.Subtype<{
        fkColumn: t.OptionalType<t.LinkType>;
        refColumn: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    isUnique: t.BooleanType;
    onConnect: t.OptionalType<t.StringType>;
    onDelete: t.OptionalType<t.StringType>;
    onUpdate: t.OptionalType<t.StringType>;
    referencedTable: t.OptionalType<t.LinkType>;
    ownerTable: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Index: t.Subtype<{
    columns: t.ArrayType<t.LinkType>;
    isUnique: t.BooleanType;
    ownerTable: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const PrimaryKey: t.Subtype<{
    columns: t.ArrayType<t.LinkType>;
    ownerTable: t.OptionalType<t.LinkType>;
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
        isNullable: t.BooleanType;
        isAutoincrement: t.BooleanType;
        domain: t.OptionalType<t.LinkType>;
        ownerTable: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    primaryKey: t.OptionalType<t.Subtype<{
        columns: t.ArrayType<t.LinkType>;
        ownerTable: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    foreignKeys: t.ArrayType<t.Subtype<{
        fkColumns: t.ArrayType<t.Subtype<{
            fkColumn: t.OptionalType<t.LinkType>;
            refColumn: t.OptionalType<t.LinkType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
        isUnique: t.BooleanType;
        onConnect: t.OptionalType<t.StringType>;
        onDelete: t.OptionalType<t.StringType>;
        onUpdate: t.OptionalType<t.StringType>;
        referencedTable: t.OptionalType<t.LinkType>;
        ownerTable: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    indexes: t.ArrayType<t.Subtype<{
        columns: t.ArrayType<t.LinkType>;
        isUnique: t.BooleanType;
        ownerTable: t.OptionalType<t.LinkType>;
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
export type IForeignKey = t.TypeOf<typeof ForeignKey>;
export type IForeignKeyColumn = t.TypeOf<typeof ForeignKeyColumn>;
export type IIndex = t.TypeOf<typeof Index>;
export type IPrimaryKey = t.TypeOf<typeof PrimaryKey>;
