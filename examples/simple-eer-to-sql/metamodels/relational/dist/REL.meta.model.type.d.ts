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
    domain: t.Subtype<{
        type: t.StringType;
        defaultValue: t.OptionalType<t.StringType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
    isKey: t.BooleanType;
    ownerTable: t.LinkType;
    indexes: t.ArrayType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Index: t.Subtype<{
    ownerTable: t.LinkType;
    columns: t.ArrayType<t.Subtype<{
        domain: t.Subtype<{
            type: t.StringType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        isKey: t.BooleanType;
        ownerTable: t.LinkType;
        indexes: t.ArrayType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    isUnique: t.BooleanType;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const ForeignKeyColumn: t.Subtype<{
    fkColumn: t.Subtype<{
        domain: t.Subtype<{
            type: t.StringType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        isKey: t.BooleanType;
        ownerTable: t.LinkType;
        indexes: t.ArrayType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
    refColumn: t.Subtype<{
        domain: t.Subtype<{
            type: t.StringType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        isKey: t.BooleanType;
        ownerTable: t.LinkType;
        indexes: t.ArrayType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const ForeignKey: t.Subtype<{
    ownerTable: t.LinkType;
    fkColumns: t.ArrayType<t.Subtype<{
        fkColumn: t.Subtype<{
            domain: t.Subtype<{
                type: t.StringType;
                defaultValue: t.OptionalType<t.StringType>;
            }, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
            isKey: t.BooleanType;
            ownerTable: t.LinkType;
            indexes: t.ArrayType<t.LinkType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        refColumn: t.Subtype<{
            domain: t.Subtype<{
                type: t.StringType;
                defaultValue: t.OptionalType<t.StringType>;
            }, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
            isKey: t.BooleanType;
            ownerTable: t.LinkType;
            indexes: t.ArrayType<t.LinkType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    isUnique: t.BooleanType;
    referencedTable: t.LinkType;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Table: t.Subtype<{
    columns: t.ArrayType<t.Subtype<{
        domain: t.Subtype<{
            type: t.StringType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        isKey: t.BooleanType;
        ownerTable: t.LinkType;
        indexes: t.ArrayType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    indexes: t.ArrayType<t.Subtype<{
        ownerTable: t.LinkType;
        columns: t.ArrayType<t.Subtype<{
            domain: t.Subtype<{
                type: t.StringType;
                defaultValue: t.OptionalType<t.StringType>;
            }, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
            isKey: t.BooleanType;
            ownerTable: t.LinkType;
            indexes: t.ArrayType<t.LinkType>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
        isUnique: t.BooleanType;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
    foreignKeys: t.ArrayType<t.Subtype<{
        ownerTable: t.LinkType;
        fkColumns: t.ArrayType<t.Subtype<{
            fkColumn: t.Subtype<{
                domain: t.Subtype<{
                    type: t.StringType;
                    defaultValue: t.OptionalType<t.StringType>;
                }, {
                    name: t.StringType;
                    label: t.OptionalType<t.StringType>;
                    description: t.OptionalType<t.StringType>;
                    path: t.OptionalType<t.StringType>;
                    parentModel: t.OptionalType<t.LinkType>;
                }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
                isKey: t.BooleanType;
                ownerTable: t.LinkType;
                indexes: t.ArrayType<t.LinkType>;
            }, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
            refColumn: t.Subtype<{
                domain: t.Subtype<{
                    type: t.StringType;
                    defaultValue: t.OptionalType<t.StringType>;
                }, {
                    name: t.StringType;
                    label: t.OptionalType<t.StringType>;
                    description: t.OptionalType<t.StringType>;
                    path: t.OptionalType<t.StringType>;
                    parentModel: t.OptionalType<t.LinkType>;
                }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
                isKey: t.BooleanType;
                ownerTable: t.LinkType;
                indexes: t.ArrayType<t.LinkType>;
            }, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        }, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
        isUnique: t.BooleanType;
        referencedTable: t.LinkType;
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
export type IIndex = t.TypeOf<typeof Index>;
export type IForeignKey = t.TypeOf<typeof ForeignKey>;
export type IForeignKeyColumn = t.TypeOf<typeof ForeignKeyColumn>;
