import * as t from "@aelastics/types";
export declare const EERTutorialBasic_TypeSchema: t.TypeSchema;
export declare const EERSchema: t.Subtype<{}, {
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
export declare const Domain: t.Subtype<{}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Attribute: t.Subtype<{
    attrDomain: t.Subtype<{}, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
    attrEntity: t.LinkType;
    isKey: t.BooleanType;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const Entity: t.Subtype<{
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
            name: t.StringType;
            label: t.OptionalType<t.StringType>;
            description: t.OptionalType<t.StringType>;
            path: t.OptionalType<t.StringType>;
            parentModel: t.OptionalType<t.LinkType>;
        }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
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
export declare const Mapping: t.Subtype<{
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
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
    lb: t.StringType;
    ub: t.StringType;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const OrdinaryMapping: t.Subtype<{
    relationship: t.LinkType;
}, {
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                name: t.StringType;
                label: t.OptionalType<t.StringType>;
                description: t.OptionalType<t.StringType>;
                path: t.OptionalType<t.StringType>;
                parentModel: t.OptionalType<t.LinkType>;
            }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
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
    lb: t.StringType;
    ub: t.StringType;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Relationship: t.Subtype<{
    roles: t.ArrayType<t.Subtype<{
        relationship: t.LinkType;
    }, {
        domain: t.Subtype<{
            attributes: t.ArrayType<t.Subtype<{
                attrDomain: t.Subtype<{}, {
                    name: t.StringType;
                    label: t.OptionalType<t.StringType>;
                    description: t.OptionalType<t.StringType>;
                    path: t.OptionalType<t.StringType>;
                    parentModel: t.OptionalType<t.LinkType>;
                }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
                attrEntity: t.LinkType;
                isKey: t.BooleanType;
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
        lb: t.StringType;
        ub: t.StringType;
    } & {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export type IEERSchema = t.TypeOf<typeof EERSchema>;
export type IDomain = t.TypeOf<typeof Domain>;
export type IAttribute = t.TypeOf<typeof Attribute>;
export type IEntity = t.TypeOf<typeof Entity>;
export type IMapping = t.TypeOf<typeof Mapping>;
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>;
export type IRelationship = t.TypeOf<typeof Relationship>;
