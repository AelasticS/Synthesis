/** @jsx createExprNode */
import { createExprNode } from '@aelastics/synthesis/jsx-runtime';
import { Property, PropertyDomain, TypeArray, TypeModel, TypeObject, } from '@aelastics/synthesis/metamodels/types/components';
import { TypeBoolean, TypeString } from '@aelastics/synthesis/metamodels/types/predefined-types';
export const EERTutorialMetamodel = (store) => (createExprNode(TypeModel, { name: "EERTutorialMetamodel", store: store },
    createExprNode(TypeString, { name: "string" }),
    createExprNode(TypeBoolean, { name: "boolean" }),
    createExprNode(TypeObject, { name: "Domain" }),
    createExprNode(TypeObject, { name: "Attribute" },
        createExprNode(Property, { name: "attrDomain" },
            createExprNode(PropertyDomain, { "$refByName": "Domain" })),
        createExprNode(Property, { name: "isKey" },
            createExprNode(PropertyDomain, { "$refByName": "boolean" }))),
    createExprNode(TypeObject, { name: "Entity" },
        createExprNode(Property, { name: "attributes", domain: createExprNode(TypeArray, { name: "ArrayOfAttributes", elementType: createExprNode(TypeObject, { "$refByName": "Attribute" }) }) })),
    createExprNode(TypeObject, { name: "Role" },
        createExprNode(Property, { name: "domain" },
            createExprNode(PropertyDomain, { "$refByName": "Entity" })),
        createExprNode(Property, { name: "lb" },
            createExprNode(PropertyDomain, { "$refByName": "string" })),
        createExprNode(Property, { name: "ub" },
            createExprNode(PropertyDomain, { "$refByName": "string" }))),
    createExprNode(TypeObject, { name: "Relationship" },
        createExprNode(Property, { name: "roles", domain: createExprNode(TypeArray, { name: "ArrayOfRoles", elementType: createExprNode(TypeObject, { "$refByName": "Role" }) }) }))));
//# sourceMappingURL=eer-metamodel.js.map