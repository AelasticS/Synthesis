/** @jsx createExprNode */
/**
 * The binding model: connects decision-model issues to the metamodel
 * concepts they apply to. References are absolute store paths into the
 * ERMetamodel part (rendered before this model, see synth.json parts
 * order) and into the decision model. The optional condition narrows an
 * element issue to the elements it really concerns; here,
 * OneToManyStrategy applies only to relationships that are 1:N.
 * Binding matches by the concrete type name of a source element, so
 * TableAuditing binds Kernel, Weak, and Subtype separately.
 */
import { createExprNode } from "@aelastics/synthesis/jsx";
import { BindingModel, Binding } from "@aelastics/synthesis/metamodels/binding";
import { Model, Element as ModelElement } from "@aelastics/synthesis/jsx";
import { DecisionModel, ElementLevelIssue } from "@aelastics/synthesis/metamodels/decision";
export const ER_Bindings = (store) => (createExprNode(BindingModel, { name: "ER_Bindings", description: "Binding EER Model concepts to relation schema design issues", sourceModel: createExprNode(Model, { "$refByName": "//www.aelastics.org/ERMetamodel" }), decisionModel: createExprNode(DecisionModel, { "$refByName": "//www.aelastics.org/RelationSchemaDesign" }), store: store },
    createExprNode(Binding, { name: "PKStrategyBinding", description: "Binding Primary Key Strategy to EER Model", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Attribute" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/PrimaryKeyStrategy" }),
        ], condition: 'return (a) => a.isKey' }),
    createExprNode(Binding, { name: "OneToManyBinding", description: "Binding 1:N Relationship Strategy to EER Model", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Relationship" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/OneToManyStrategy" }),
        ], condition: 'return (e) => {\n                if (!e.roles || e.roles.length !== 2) return false;\n                const m1 = e.roles[0];\n                const m2 = e.roles[1];\n                return (m1.upperBound === "1" && m1.lowerBound === "0" && m2.upperBound === "M") ||\n                       (m1.upperBound === "M" && m2.upperBound === "1" && m2.lowerBound === "0");\n            }' }),
    createExprNode(Binding, { name: "KernelAuditingBinding", description: "Binding table auditing to kernel entities", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Kernel" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/TableAuditing" }),
        ] }),
    createExprNode(Binding, { name: "WeakAuditingBinding", description: "Binding table auditing to weak entities", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Weak" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/TableAuditing" }),
        ] }),
    createExprNode(Binding, { name: "SubtypeAuditingBinding", description: "Binding table auditing to subtype entities", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Subtype" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/TableAuditing" }),
        ] }),
    createExprNode(Binding, { name: "InheritanceBinding", description: "Binding the inheritance strategy to specialization hierarchies", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Specialization" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/InheritanceStrategy" }),
        ] }),
    createExprNode(Binding, { name: "KernelHistoryBinding", description: "Binding row history to kernel entities", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Kernel" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/RowHistory" }),
        ] }),
    createExprNode(Binding, { name: "WeakHistoryBinding", description: "Binding row history to weak entities", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Weak" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/RowHistory" }),
        ] }),
    createExprNode(Binding, { name: "AggregationHistoryBinding", description: "Binding row history to aggregations", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/ERMetamodel/Aggregation" }), issues: [
            createExprNode(ElementLevelIssue, { "$refByName": "//www.aelastics.org/RelationSchemaDesign/RowHistory" }),
        ] })));
//# sourceMappingURL=binding-model.js.map