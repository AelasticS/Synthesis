import * as t from "@aelastics/types";
export declare const EERModel_TypeSchema: t.TypeSchema;
export declare const IntegityRule: t.StringType;
export declare const ERConcept: t.Subtype<{
    conceptType: t.StringType;
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
export declare const Domain: t.Subtype<{}, {
    conceptType: t.StringType;
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
export declare const Submodel: t.Subtype<{
    concepts: t.ArrayType<t.Subtype<{
        conceptType: t.StringType;
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
    conceptType: t.StringType;
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
export declare const EERSchema: t.Subtype<{
    submodels: t.ArrayType<t.Subtype<{
        concepts: t.ArrayType<t.Subtype<{
            conceptType: t.StringType;
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
        conceptType: t.StringType;
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
export declare const Attribute: t.Subtype<{
    attrDomain: t.Subtype<{}, {
        conceptType: t.StringType;
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
    attrEntity: t.LinkType;
    isKey: t.BooleanType;
    defaultValue: t.OptionalType<t.StringType>;
}, {
    conceptType: t.StringType;
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
export declare const Entity: t.Subtype<{
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
            conceptType: t.StringType;
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
        defaultValue: t.OptionalType<t.StringType>;
    }, {
        conceptType: t.StringType;
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
    mappings: t.ArrayType<t.LinkType>;
}, {
    conceptType: t.StringType;
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
export declare const Kernel: t.Subtype<{}, {
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
            conceptType: t.StringType;
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
        defaultValue: t.OptionalType<t.StringType>;
    }, {
        conceptType: t.StringType;
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
    mappings: t.ArrayType<t.LinkType>;
} & {
    conceptType: t.StringType;
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
    weakMap: t.OptionalType<t.LinkType>;
}, {
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
            conceptType: t.StringType;
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
        defaultValue: t.OptionalType<t.StringType>;
    }, {
        conceptType: t.StringType;
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
    mappings: t.ArrayType<t.LinkType>;
} & {
    conceptType: t.StringType;
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
export declare const Aggregation: t.Subtype<{
    agrMapp: t.ArrayType<t.LinkType>;
}, {
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
            conceptType: t.StringType;
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
        defaultValue: t.OptionalType<t.StringType>;
    }, {
        conceptType: t.StringType;
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
    mappings: t.ArrayType<t.LinkType>;
} & {
    conceptType: t.StringType;
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
export declare const Subtype: t.Subtype<{
    supertype: t.LinkType;
    cnSupertype: t.StringType;
    dcnSupertype: t.StringType;
    cnSubtype: t.StringType;
    dcnSubtype: t.StringType;
}, {
    attributes: t.ArrayType<t.Subtype<{
        attrDomain: t.Subtype<{}, {
            conceptType: t.StringType;
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
        attrEntity: t.LinkType;
        isKey: t.BooleanType;
        defaultValue: t.OptionalType<t.StringType>;
    }, {
        conceptType: t.StringType;
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
    mappings: t.ArrayType<t.LinkType>;
} & {
    conceptType: t.StringType;
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
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    }, {
        conceptType: t.StringType;
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
    lb: t.StringType;
    ub: t.StringType;
    cnMapp: t.StringType;
    dcnMapp: t.StringType;
}, {
    conceptType: t.StringType;
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
export declare const WeakMapping: t.Subtype<{
    codomain: t.Subtype<{
        weakMap: t.OptionalType<t.LinkType>;
    }, {
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    } & {
        conceptType: t.StringType;
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
    cnWeakOwner: t.StringType;
    dcnWeakOwner: t.StringType;
}, {
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    }, {
        conceptType: t.StringType;
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
    lb: t.StringType;
    ub: t.StringType;
    cnMapp: t.StringType;
    dcnMapp: t.StringType;
} & {
    conceptType: t.StringType;
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
export declare const AggregationMapping: t.Subtype<{
    codomain: t.Subtype<{
        agrMapp: t.ArrayType<t.LinkType>;
    }, {
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    } & {
        conceptType: t.StringType;
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
    cnAggrOwner: t.StringType;
    dcnAggrOwner: t.StringType;
}, {
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    }, {
        conceptType: t.StringType;
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
    lb: t.StringType;
    ub: t.StringType;
    cnMapp: t.StringType;
    dcnMapp: t.StringType;
} & {
    conceptType: t.StringType;
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
export declare const OrdinaryMapping: t.Subtype<{
    relationship: t.LinkType;
}, {
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    }, {
        conceptType: t.StringType;
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
    lb: t.StringType;
    ub: t.StringType;
    cnMapp: t.StringType;
    dcnMapp: t.StringType;
} & {
    conceptType: t.StringType;
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
export declare const SpecializationMapping: t.Subtype<{
    specialization: t.OptionalType<t.LinkType>;
}, {
    domain: t.Subtype<{
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    }, {
        conceptType: t.StringType;
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
    lb: t.StringType;
    ub: t.StringType;
    cnMapp: t.StringType;
    dcnMapp: t.StringType;
} & {
    conceptType: t.StringType;
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
export declare const Specialization: t.Subtype<{
    mapping: t.OptionalType<t.Subtype<{
        specialization: t.OptionalType<t.LinkType>;
    }, {
        domain: t.Subtype<{
            attributes: t.ArrayType<t.Subtype<{
                attrDomain: t.Subtype<{}, {
                    conceptType: t.StringType;
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
                attrEntity: t.LinkType;
                isKey: t.BooleanType;
                defaultValue: t.OptionalType<t.StringType>;
            }, {
                conceptType: t.StringType;
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
            mappings: t.ArrayType<t.LinkType>;
        }, {
            conceptType: t.StringType;
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
        lb: t.StringType;
        ub: t.StringType;
        cnMapp: t.StringType;
        dcnMapp: t.StringType;
    } & {
        conceptType: t.StringType;
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
    subtypes: t.ArrayType<t.Subtype<{
        supertype: t.LinkType;
        cnSupertype: t.StringType;
        dcnSupertype: t.StringType;
        cnSubtype: t.StringType;
        dcnSubtype: t.StringType;
    }, {
        attributes: t.ArrayType<t.Subtype<{
            attrDomain: t.Subtype<{}, {
                conceptType: t.StringType;
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
            attrEntity: t.LinkType;
            isKey: t.BooleanType;
            defaultValue: t.OptionalType<t.StringType>;
        }, {
            conceptType: t.StringType;
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
        mappings: t.ArrayType<t.LinkType>;
    } & {
        conceptType: t.StringType;
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
    conceptType: t.StringType;
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
                    conceptType: t.StringType;
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
                attrEntity: t.LinkType;
                isKey: t.BooleanType;
                defaultValue: t.OptionalType<t.StringType>;
            }, {
                conceptType: t.StringType;
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
            mappings: t.ArrayType<t.LinkType>;
        }, {
            conceptType: t.StringType;
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
        lb: t.StringType;
        ub: t.StringType;
        cnMapp: t.StringType;
        dcnMapp: t.StringType;
    } & {
        conceptType: t.StringType;
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
    conceptType: t.StringType;
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
export type IERConcept = t.TypeOf<typeof ERConcept>;
export type IDomain = t.TypeOf<typeof Domain>;
export type ISubmodel = t.TypeOf<typeof Submodel>;
export type IEERSchema = t.TypeOf<typeof EERSchema>;
export type IAttribute = t.TypeOf<typeof Attribute>;
export type IEntity = t.TypeOf<typeof Entity>;
export type IKernel = t.TypeOf<typeof Kernel>;
export type IWeak = t.TypeOf<typeof Weak>;
export type IAggregation = t.TypeOf<typeof Aggregation>;
export type ISubtype = t.TypeOf<typeof Subtype>;
export type ISpecialization = t.TypeOf<typeof Specialization>;
export type IMapping = t.TypeOf<typeof Mapping>;
export type IWeakMapping = t.TypeOf<typeof WeakMapping>;
export type IAggregationMapping = t.TypeOf<typeof AggregationMapping>;
export type IOrdinaryMapping = t.TypeOf<typeof OrdinaryMapping>;
export type ISpecializationMapping = t.TypeOf<typeof SpecializationMapping>;
export type IRelationship = t.TypeOf<typeof Relationship>;
export declare const getCodomain: (mapping: IOrdinaryMapping) => IEntity;
export declare const getInverse: (mapping: IOrdinaryMapping) => IOrdinaryMapping;
