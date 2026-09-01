/** @jsx createExprNode */
import * as jsx_1 from "@aelastics/synthesis/jsx";
import * as components_1 from "@aelastics/synthesis/metamodels/types/components";
import * as predefined_types_1 from "@aelastics/synthesis/metamodels/types/predefined-types";
/**
 * Minimal relational metamodel model, mirroring `er-metamodel.tsx` of the
 * eer-to-rel-small example. Its role here is to stand for the source
 * metamodel of the Rel->DDL transformation so the DDL binding model has a
 * real `sourceModel` to reference — the same way `ER_Bindings` references
 * `ERMetamodel`.
 */
const RELModel = (store) => ((0, jsx_1.createExprNode)(components_1.TypeModel, { name: "RELMetamodel", store: store },
    (0, jsx_1.createExprNode)(predefined_types_1.TypeString, { name: "string" }),
    (0, jsx_1.createExprNode)(predefined_types_1.TypeBoolean, { name: "boolean" }),
    (0, jsx_1.createExprNode)(components_1.TypeObject, { name: "Column" },
        (0, jsx_1.createExprNode)(components_1.Property, { name: "type" },
            (0, jsx_1.createExprNode)(components_1.PropertyDomain, { "$refByName": "string" })),
        (0, jsx_1.createExprNode)(components_1.Property, { name: "isKey" },
            (0, jsx_1.createExprNode)(components_1.PropertyDomain, { "$refByName": "boolean" }))),
    (0, jsx_1.createExprNode)(components_1.TypeObject, { name: "Table" },
        (0, jsx_1.createExprNode)(components_1.Property, { name: "columns", domain: (0, jsx_1.createExprNode)(components_1.TypeArray, { name: "ArrayOfColumns", elementType: (0, jsx_1.createExprNode)(components_1.TypeObject, { "$refByName": "Column" }) }) })),
    (0, jsx_1.createExprNode)(components_1.TypeObject, { name: "RelSchema" },
        (0, jsx_1.createExprNode)(components_1.Property, { name: "tables", domain: (0, jsx_1.createExprNode)(components_1.TypeArray, { name: "ArrayOfTables", elementType: (0, jsx_1.createExprNode)(components_1.TypeObject, { "$refByName": "Table" }) }) }))));
export { RELModel };