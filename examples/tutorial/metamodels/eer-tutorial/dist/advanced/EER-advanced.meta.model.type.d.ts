import * as t from "@aelastics/types";
export declare const EERTutorialAdvanced_TypeSchema: t.TypeSchema;
export declare const EERSchema: t.Subtype<{}, {
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
export declare const Domain: t.Subtype<{}, {
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
export declare const Attribute: t.Subtype<{
    attrDomain: t.Subtype<{}, {
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
    attrEntity: t.LinkType;
    isKey: t.BooleanType;
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
export declare const Entity: t.Subtype<{
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
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
export declare const Kernel: t.Subtype<{}, {
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
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
export declare const Weak: t.Subtype<{
    owner: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
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
}, {
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
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
export declare const Mapping: t.Subtype<{
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
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
    lb: t.StringType;
    ub: t.StringType;
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
export declare const OrdinaryMapping: t.Subtype<{
    relationship: t.LinkType;
}, {
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
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
    lb: t.StringType;
    ub: t.StringType;
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
export declare const Relationship: t.Subtype<{
    roles: t.ArrayType<t.Subtype<{
        relationship: t.LinkType;
    }, {
        domain: t.Subtype<{
            attributes: t.ArrayType<t.Subtype<{
                attrDomain: t.Subtype<{}, {
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
                attrEntity: t.LinkType;
                isKey: t.BooleanType;
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
        lb: t.StringType;
        ub: t.StringType;
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
export type IEERSchema = t.TypeOf<typeof EERSchema>;
export type IDomain = t.TypeOf<typeof Domain>;
export type IAttribute = t.TypeOf<typeof Attribute>;
export type IEntity = t.TypeOf<typeof Entity>;
export type IKernel = t.TypeOf<typeof Kernel>;
export type IWeak = t.TypeOf<typeof Weak>;
export type IMapping = t.TypeOf<typeof Mapping>;
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>;
export type IRelationship = t.TypeOf<typeof Relationship>;
