import * as t from "@aelastics/types";
export declare const Org_TypeSchema: t.TypeSchema;
export declare const Worker: t.Subtype<{
    role: t.OptionalType<t.StringType>;
    worksIn: t.OptionalType<t.LinkType>;
}, {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>;
export declare const OrgUnit: t.Subtype<{
    parent: t.OptionalType<t.LinkType>;
    subUnits: t.ArrayType<t.LinkType>;
    members: t.ArrayType<t.Subtype<{
        role: t.OptionalType<t.StringType>;
        worksIn: t.OptionalType<t.LinkType>;
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
export declare const Department: t.Subtype<{
    manager: t.OptionalType<t.LinkType>;
}, {
    parent: t.OptionalType<t.LinkType>;
    subUnits: t.ArrayType<t.LinkType>;
    members: t.ArrayType<t.Subtype<{
        role: t.OptionalType<t.StringType>;
        worksIn: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Board: t.Subtype<{}, {
    parent: t.OptionalType<t.LinkType>;
    subUnits: t.ArrayType<t.LinkType>;
    members: t.ArrayType<t.Subtype<{
        role: t.OptionalType<t.StringType>;
        worksIn: t.OptionalType<t.LinkType>;
    }, {
        name: t.StringType;
        label: t.OptionalType<t.StringType>;
        description: t.OptionalType<t.StringType>;
        path: t.OptionalType<t.StringType>;
        parentModel: t.OptionalType<t.LinkType>;
    }, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly ["name"]>>>;
} & {
    name: t.StringType;
    label: t.OptionalType<t.StringType>;
    description: t.OptionalType<t.StringType>;
    path: t.OptionalType<t.StringType>;
    parentModel: t.OptionalType<t.LinkType>;
}, t.ObjectType<import("@aelastics/types/lib/complex-types/ObjectType.js").InterfaceDecl, readonly string[]>>;
export declare const Organization: t.Subtype<{
    topUnit: t.OptionalType<t.LinkType>;
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
export type IWorker = t.TypeOf<typeof Worker>;
export type IOrgUnit = t.TypeOf<typeof OrgUnit>;
export type IDepartment = t.TypeOf<typeof Department>;
export type IBoard = t.TypeOf<typeof Board>;
export type IOrganization = t.TypeOf<typeof Organization>;
