/** @jsx createExprNode */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { Property, PropertyDomain, TypeArray, TypeModel, TypeObject, } from "@aelastics/synthesis/metamodels/types/components";
import { TypeBoolean, TypeString } from "@aelastics/synthesis/metamodels/types/predefined-types";
/**
 * The simple relational metamodel as a model, mirroring the content of
 * REL.meta.model.type.ts: tables with columns, foreign keys (composite
 * capable, via ForeignKeyColumn pairs), and indexes. Links that would
 * point forward to a type defined later (Column.indexes, the
 * referencedTable of a ForeignKey) are omitted so definition order
 * stays acyclic.
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
        createExprNode(Property, { name: "columnDomain", domain: createExprNode(TypeObject, { "$refByName": "Domain" }) }),
        createExprNode(Property, { name: "isKey" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "Index" },
        createExprNode(Property, { name: "indexColumns", domain: createExprNode(TypeArray, { name: "ArrayOfIndexColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) }),
        createExprNode(Property, { name: "indexIsUnique" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "ForeignKeyColumn" },
        createExprNode(Property, { name: "fkColumn", domain: createExprNode(TypeObject, { "$refByName": "Column" }) }),
        createExprNode(Property, { name: "refColumn", domain: createExprNode(TypeObject, { "$refByName": "Column" }) })),
    createExprNode(TypeObject, { name: "ForeignKey" },
        createExprNode(Property, { name: "fkColumns", domain: createExprNode(TypeArray, { name: "ArrayOfForeignKeyColumns", elementType: createExprNode(TypeObject, { "$refByName": "ForeignKeyColumn" }) }) }),
        createExprNode(Property, { name: "fkIsUnique" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "Table", isNamespace: true },
        createExprNode(Property, { name: "tableColumns", domain: createExprNode(TypeArray, { name: "ArrayOfColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) }),
        createExprNode(Property, { name: "tableIndexes", domain: createExprNode(TypeArray, { name: "ArrayOfIndexes", elementType: createExprNode(TypeObject, { "$refByName": "Index" }) }) }),
        createExprNode(Property, { name: "foreignKeys", domain: createExprNode(TypeArray, { name: "ArrayOfForeignKeys", elementType: createExprNode(TypeObject, { "$refByName": "ForeignKey" }) }) })),
    createExprNode(TypeObject, { name: "RelSchema" },
        createExprNode(Property, { name: "tables", domain: createExprNode(TypeArray, { name: "ArrayOfTables", elementType: createExprNode(TypeObject, { "$refByName": "Table" }) }) }))));
//# sourceMappingURL=as-model.js.map