/** @jsx createExprNode */
import * as jsx_1 from "@aelastics/synthesis/jsx";
import * as binding_1 from "@aelastics/synthesis/metamodels/binding";
import * as jsx_2 from "@aelastics/synthesis/jsx";
import * as decision_1 from "@aelastics/synthesis/metamodels/decision";
const ER_Bindings = (store) => ((0, jsx_1.createExprNode)(binding_1.BindingModel, { name: "ER_Bindings", description: "Binding EER Model concepts to relation schema design issues", sourceModel: (0, jsx_1.createExprNode)(jsx_2.Model, { "$refByName": "//www.aelastics.org/ERMetamodel" }), decisionModel: (0, jsx_1.createExprNode)(decision_1.DecisionModel, { "$refByName": "//www.aelastics.org/RelationSchemaDesign" }), store: store },
    (0, jsx_1.createExprNode)(binding_1.Binding, { name: "PKStrategyBinding", description: "Binding Primary Key Strategy to EER Model", element: (0, jsx_1.createExprNode)(jsx_2.Element, { "$refByName": "//www.aelastics.org/ERMetamodel/Attribute" }), issues: [
            (0, jsx_1.createExprNode)(decision_1.ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/PrimaryKeyStrategy" }),
        ] }),
    (0, jsx_1.createExprNode)(binding_1.Binding, { name: "OneToManyBinding", description: "Binding 1:N Relationship Strategy to EER Model", element: (0, jsx_1.createExprNode)(jsx_2.Element, { "$refByName": "//www.aelastics.org/ERMetamodel/Relationship" }), issues: [
            (0, jsx_1.createExprNode)(decision_1.ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/OneToManyStrategy" }),
        ], condition: 'return (e) => {\n                if (!e.roles || e.roles.length !== 2) return false;\n                const m1 = e.roles[0];\n                const m2 = e.roles[1];\n                return (m1.upperBound === "1" && m1.lowerBound === "0" && m2.upperBound === "M") ||\n                       (m1.upperBound === "M" && m2.upperBound === "1" && m2.lowerBound === "0");\n            }' })));
export { ER_Bindings };
