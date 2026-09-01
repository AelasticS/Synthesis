/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx';
import { Property, PropertyDomain, TypeArray, TypeModel, TypeObject } from '@aelastics/synthesis/metamodels/types/components';
import { TypeBoolean, TypeString } from '@aelastics/synthesis/metamodels/types/predefined-types';
export const RelTutorialMetamodel = (store) => (createExprNode(TypeModel, { name: "RelTutorialMetamodel", store: store },
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
//# sourceMappingURL=as-model.js.map