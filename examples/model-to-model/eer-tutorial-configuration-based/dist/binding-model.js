/** @jsx createExprNode */
/**
 * The binding model: connects the decision model's issues to the
 * metamodel concepts they apply to. References are absolute store paths
 * into the EERTutorialMetamodel part and into the decision model; both
 * are rendered before this model, in the order the manifest's `parts`
 * block lists them.
 *
 * The condition is what makes the binding precise. OneToManyStrategy is
 * bound to Relationship, but not every relationship raises the question:
 * an M:N relationship has no alternative to a join table, and the
 * transformation maps it with fixed logic. The condition therefore keeps
 * only the 1:N relationships, so those are the only elements a
 * configuration model ever offers a choice for.
 */
import { createExprNode } from '@aelastics/synthesis/jsx-runtime';
import { Model, Element as ModelElement } from '@aelastics/synthesis/jsx-runtime';
import { BindingModel, Binding } from '@aelastics/synthesis/decision-framework/decisions/2.binding-model/binding-meta.model-components';
import { DecisionModel, ElementIssue } from '@aelastics/synthesis/decision-framework/decisions/1.decision-model/decision-meta.model-components';
export const EERTutorialBindings = (store) => (createExprNode(BindingModel, { name: "EERTutorialBindings", description: "Binding the tutorial EER concepts to relational design issues", sourceModel: createExprNode(Model, { "$refByName": "//www.aelastics.org/EERTutorialMetamodel" }), decisionModel: createExprNode(DecisionModel, { "$refByName": "//www.aelastics.org/RelationshipDesign" }), store: store },
    createExprNode(Binding, { name: "OneToManyBinding", description: "OneToManyStrategy applies to 1:N relationships only", element: createExprNode(ModelElement, { "$refByName": "//www.aelastics.org/EERTutorialMetamodel/Relationship" }), issues: [
            createExprNode(ElementIssue, { "$refByName": "//www.aelastics.org/RelationshipDesign/OneToManyStrategy" }),
        ], condition: 'return (e) => {\n                if (!e.roles || e.roles.length !== 2) return false;\n                const r1 = e.roles[0];\n                const r2 = e.roles[1];\n                return (r1.ub === "1" && r2.ub === "M") ||\n                       (r1.ub === "M" && r2.ub === "1");\n            }' })));
//# sourceMappingURL=binding-model.js.map