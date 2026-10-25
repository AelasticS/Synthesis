/** @jsx createExprNode */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { Property, PropertyDomain, TypeArray, TypeModel, TypeObject, } from "@aelastics/synthesis/metamodels/types/components";
import { TypeBoolean, TypeString } from "@aelastics/synthesis/metamodels/types/predefined-types";
/**
 * The simple relational metamodel as a model, mirroring the content of
 * REL.meta.model.type.ts: tables with flat columns (type, key and
 * foreign-key flags, optional reference, nullability, autoincrement),
 * and domains.
 */
export const RELModel = (store) => (createExprNode(TypeModel, { name: "RELMetamodel", store: store },
    createExprNode(TypeString, { name: "string" }),
    createExprNode(TypeBoolean, { name: "boolean" }),
    createExprNode(TypeObject, { name: "Domain" },
        createExprNode(Property, { name: "domainType" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "domainDefault" },
            createExprNode(PropertyDomain, { "$refByName": "string" }))),
    createExprNode(TypeObject, { name: "Column" },
        createExprNode(Property, { name: "type" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "isKey" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" })),
        createExprNode(Property, { name: "isForeignKey" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" })),
        createExprNode(Property, { name: "references" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "isNullable" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" })),
        createExprNode(Property, { name: "isAutoincrement" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "Table", isNamespace: true },
        createExprNode(Property, { name: "tableColumns", domain: createExprNode(TypeArray, { name: "ArrayOfColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) })),
    createExprNode(TypeObject, { name: "RelSchema" },
        createExprNode(Property, { name: "tables", domain: createExprNode(TypeArray, { name: "ArrayOfTables", elementType: createExprNode(TypeObject, { "$refByName": "Table" }) }) }))));
//# sourceMappingURL=as-model.js.map