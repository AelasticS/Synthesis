/** @jsx createExprNode */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { Property, PropertyDomain, TypeArray, TypeModel, TypeObject, } from "@aelastics/synthesis/metamodels/types/components";
import { TypeBoolean, TypeString } from "@aelastics/synthesis/metamodels/types/predefined-types";
/**
 * The relational metamodel as a model, mirroring the rich content of
 * model.ts: tables with columns, foreign keys (composite capable via
 * ForeignKeyColumn pairs), and indexes. Its role is to stand for the
 * source metamodel of the Rel to DDL transformation so the DDL binding
 * model has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
 */
export const RELModel = (store) => (createExprNode(TypeModel, { name: "RELMetamodel", store: store },
    createExprNode(TypeString, { name: "string" }),
    createExprNode(TypeBoolean, { name: "boolean" }),
    createExprNode(TypeObject, { name: "Domain" },
        createExprNode(Property, { name: "domainType" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "domainCheck" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "domainDefault" },
            createExprNode(PropertyDomain, { "$refByName": "string" }))),
    createExprNode(TypeObject, { name: "Column" },
        createExprNode(Property, { name: "type" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "columnDomain", domain: createExprNode(TypeObject, { "$refByName": "Domain" }) }),
        createExprNode(Property, { name: "isNullable" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" })),
        createExprNode(Property, { name: "isAutoincrement" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "ForeignKeyColumn" },
        createExprNode(Property, { name: "fkColumn", domain: createExprNode(TypeObject, { "$refByName": "Column" }) }),
        createExprNode(Property, { name: "refColumn", domain: createExprNode(TypeObject, { "$refByName": "Column" }) })),
    createExprNode(TypeObject, { name: "ForeignKey" },
        createExprNode(Property, { name: "fkPairs", domain: createExprNode(TypeArray, { name: "ArrayOfForeignKeyColumns", elementType: createExprNode(TypeObject, { "$refByName": "ForeignKeyColumn" }) }) }),
        createExprNode(Property, { name: "fkIsUnique" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" })),
        createExprNode(Property, { name: "fkOnConnect" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "fkOnDelete" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "fkOnUpdate" },
            createExprNode(PropertyDomain, { "$refByName": "string" }))),
    createExprNode(TypeObject, { name: "Index" },
        createExprNode(Property, { name: "indexColumns", domain: createExprNode(TypeArray, { name: "ArrayOfIndexColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) }),
        createExprNode(Property, { name: "indexIsUnique" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "PrimaryKey" },
        createExprNode(Property, { name: "pkColumns", domain: createExprNode(TypeArray, { name: "ArrayOfPrimaryKeyColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) })),
    createExprNode(TypeObject, { name: "Table", isNamespace: true },
        createExprNode(Property, { name: "tablePrimaryKey", domain: createExprNode(TypeObject, { "$refByName": "PrimaryKey" }) }),
        createExprNode(Property, { name: "tableColumns", domain: createExprNode(TypeArray, { name: "ArrayOfColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) }),
        createExprNode(Property, { name: "foreignKeys", domain: createExprNode(TypeArray, { name: "ArrayOfForeignKeys", elementType: createExprNode(TypeObject, { "$refByName": "ForeignKey" }) }) }),
        createExprNode(Property, { name: "indexes", domain: createExprNode(TypeArray, { name: "ArrayOfIndexes", elementType: createExprNode(TypeObject, { "$refByName": "Index" }) }) }),
        createExprNode(Property, { name: "tableHistoryOf", domain: createExprNode(TypeObject, { "$refByName": "Table" }) })),
    createExprNode(TypeObject, { name: "RelSchema" },
        createExprNode(Property, { name: "tables", domain: createExprNode(TypeArray, { name: "ArrayOfTables", elementType: createExprNode(TypeObject, { "$refByName": "Table" }) }) }))));
//# sourceMappingURL=as-model.js.map