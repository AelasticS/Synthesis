/** @jsx createExprNode */
import { createExprNode } from "@aelastics/synthesis/jsx-runtime";
import { Property, PropertyDomain, TypeArray, TypeModel, TypeObject, } from "@aelastics/synthesis/metamodels/types/components";
import { TypeBoolean, TypeString } from "@aelastics/synthesis/metamodels/types/predefined-types";
/**
 * Minimal relational metamodel model, mirroring er-metamodel.tsx of the
 * eer-to-relational example. Its role here is to stand for the source
 * metamodel of the Rel to DDL transformation so the DDL binding model
 * has a real sourceModel to reference, the same way ER_Bindings
 * references ERMetamodel.
 */
export const RELModel = (store) => (createExprNode(TypeModel, { name: "RELMetamodel", store: store },
    createExprNode(TypeString, { name: "string" }),
    createExprNode(TypeBoolean, { name: "boolean" }),
    createExprNode(TypeObject, { name: "Column" },
        createExprNode(Property, { name: "type" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "isKey" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "Table" },
        createExprNode(Property, { name: "columns", domain: createExprNode(TypeArray, { name: "ArrayOfColumns", elementType: createExprNode(TypeObject, { "$refByName": "Column" }) }) })),
    createExprNode(TypeObject, { name: "RelSchema" },
        createExprNode(Property, { name: "tables", domain: createExprNode(TypeArray, { name: "ArrayOfTables", elementType: createExprNode(TypeObject, { "$refByName": "Table" }) }) }))));
//# sourceMappingURL=rel-metamodel.js.map